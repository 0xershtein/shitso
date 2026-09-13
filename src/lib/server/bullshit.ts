import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { put, del } from '@vercel/blob';
import { generateObject } from 'ai';
import { z } from 'zod';
import { env } from '$env/dynamic/private';
import { db } from './db/index';
import { bullshitReports, bullshits, profiles } from './db/schema';

export const BULLSHIT_TTL_DAYS = 30;
export const MAX_BYTES = 350_000;
export const REPORTS_TO_HIDE = 3;
const NONCE_TTL_MS = 90_000;

// ---------- nonce: proves the capture happened in a fresh session on our page ----------
function sign(payload: string) {
	return createHmac('sha256', env.AUTH_SECRET ?? 'dev').update(payload).digest('base64url');
}
export function issueNonce(voterId: string, target: string): string {
	const payload = `${voterId}|${target}|${Date.now()}`;
	return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}
export function verifyNonce(nonce: string, voterId: string, target: string): boolean {
	const [b64, sig] = nonce.split('.');
	if (!b64 || !sig) return false;
	const payload = Buffer.from(b64, 'base64url').toString();
	const expect = sign(payload);
	if (expect.length !== sig.length || !timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return false;
	const [v, t, ts] = payload.split('|');
	return v === voterId && t === target && Date.now() - Number(ts) < NONCE_TTL_MS;
}

// ---------- moderation ----------
const Verdict = z.object({
	is_photo_of_person: z.boolean().describe('a real photo of at least one human, not a screenshot/drawing/meme'),
	faces: z.number().int().describe('number of human faces visible'),
	nudity: z.boolean(),
	violence_or_gore: z.boolean(),
	minor_present: z.boolean().describe('anyone who looks under 18'),
	text_or_qr: z.boolean().describe('readable text, signs, QR codes or urls in the image'),
	hate_symbols: z.boolean()
});

export type Moderation = { ok: true } | { ok: false; reason: string };

export async function moderate(jpeg: Buffer): Promise<Moderation> {
	if (env.BULLSHIT_MODERATION === 'off') return { ok: true };
	try {
		const { object: v } = await generateObject({
			model: env.BULLSHIT_MODERATION_MODEL || 'anthropic/claude-haiku-4-5',
			schema: Verdict,
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'file', data: jpeg, mediaType: 'image/jpeg' },
						{
							type: 'text',
							text: 'This is a webcam selfie a user wants to publish on a joke site. Classify it strictly. Screenshots, memes, drawings and photos of screens are not photos of a person.'
						}
					]
				}
			]
		});
		if (v.nudity) return { ok: false, reason: 'nudity' };
		if (v.violence_or_gore) return { ok: false, reason: 'violence' };
		if (v.minor_present) return { ok: false, reason: 'minor' };
		if (v.hate_symbols) return { ok: false, reason: 'hate' };
		if (v.text_or_qr) return { ok: false, reason: 'text' };
		if (!v.is_photo_of_person || v.faces < 1) return { ok: false, reason: 'noface' };
		if (v.faces > 1) return { ok: false, reason: 'manyfaces' };
		return { ok: true };
	} catch (e) {
		console.error('[bullshit] moderation failed', e);
		return { ok: false, reason: 'unavailable' };
	}
}

// ---------- storage + rows ----------
export interface BullshitRow {
	id: number;
	voterHandle: string | null;
	target: string;
	emoji: string;
	url: string;
	createdAt: Date;
	mine: boolean;
}

export async function publishBullshit(opts: {
	voterId: string;
	voterHandle: string | null;
	target: string;
	emoji: string;
	jpeg: Buffer;
}) {
	// replace any previous one from this voter for this target
	const [prev] = await db
		.select({ pathname: bullshits.pathname })
		.from(bullshits)
		.where(and(eq(bullshits.voterId, opts.voterId), eq(bullshits.target, opts.target)))
		.limit(1);
	if (prev) await del(prev.pathname).catch(() => {});

	const pathname = `bullshit/${opts.target}/${hash(opts.voterId)}-${Date.now()}.jpg`;
	const blob = await put(pathname, opts.jpeg, {
		access: 'public',
		contentType: 'image/jpeg',
		addRandomSuffix: false,
		cacheControlMaxAge: 60 * 60 * 24 * 365
	});
	await db
		.insert(bullshits)
		.values({
			voterId: opts.voterId,
			voterHandle: opts.voterHandle,
			target: opts.target,
			emoji: opts.emoji,
			url: blob.url,
			pathname: blob.pathname,
			status: 'live',
			reason: null,
			reports: 0
		})
		.onConflictDoUpdate({
			target: [bullshits.voterId, bullshits.target],
			set: {
				voterHandle: opts.voterHandle,
				emoji: opts.emoji,
				url: blob.url,
				pathname: blob.pathname,
				status: 'live',
				reason: null,
				reports: 0,
				createdAt: sql`now()`
			}
		});
	return blob.url;
}

export async function wallFor(target: string, viewerId: string | null): Promise<BullshitRow[]> {
	const [p] = await db.select({ hidden: profiles.bullshitHidden }).from(profiles).where(eq(profiles.handle, target)).limit(1);
	if (p?.hidden) return [];
	const rows = await db
		.select()
		.from(bullshits)
		.where(
			and(
				eq(bullshits.target, target),
				eq(bullshits.status, 'live'),
				gte(bullshits.createdAt, sql`now() - ${sql.raw(`interval '${BULLSHIT_TTL_DAYS} days'`)}`)
			)
		)
		.orderBy(desc(bullshits.createdAt))
		.limit(60);
	return rows.map((r) => ({
		id: r.id,
		voterHandle: r.voterHandle,
		target: r.target,
		emoji: r.emoji,
		url: r.url,
		createdAt: new Date(r.createdAt),
		mine: !!viewerId && r.voterId === viewerId
	}));
}

export async function wallHidden(target: string): Promise<boolean> {
	const [p] = await db.select({ hidden: profiles.bullshitHidden }).from(profiles).where(eq(profiles.handle, target)).limit(1);
	return !!p?.hidden;
}

export async function deleteMine(voterId: string, target: string) {
	const [row] = await db
		.select({ id: bullshits.id, pathname: bullshits.pathname })
		.from(bullshits)
		.where(and(eq(bullshits.voterId, voterId), eq(bullshits.target, target)))
		.limit(1);
	if (!row) return false;
	await del(row.pathname).catch(() => {});
	await db.delete(bullshits).where(eq(bullshits.id, row.id));
	return true;
}

/** Target owner toggles the whole wall. Creates the profile row if missing. */
export async function setWallHidden(target: string, hidden: boolean) {
	await db
		.insert(profiles)
		.values({ handle: target, source: 'owner', bullshitHidden: hidden })
		.onConflictDoUpdate({ target: profiles.handle, set: { bullshitHidden: hidden } });
}

export async function report(bullshitId: number, reporterId: string): Promise<'ok' | 'dup' | 'missing'> {
	const [row] = await db.select({ id: bullshits.id, reports: bullshits.reports }).from(bullshits).where(eq(bullshits.id, bullshitId)).limit(1);
	if (!row) return 'missing';
	const inserted = await db.insert(bullshitReports).values({ bullshitId, reporterId }).onConflictDoNothing().returning({ id: bullshitReports.bullshitId });
	if (inserted.length === 0) return 'dup';
	const n = row.reports + 1;
	await db
		.update(bullshits)
		.set({ reports: n, ...(n >= REPORTS_TO_HIDE ? { status: 'hidden', reason: 'reports' } : {}) })
		.where(eq(bullshits.id, bullshitId));
	return 'ok';
}

function hash(s: string) {
	return createHmac('sha256', 'bullshit').update(s).digest('hex').slice(0, 16);
}
