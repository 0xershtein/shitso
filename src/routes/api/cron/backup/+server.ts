import { json } from '@sveltejs/kit';
import { put, list, del } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/index';
import { bullshitReports, bullshits, profiles, voteEvents, votes } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

const KEEP_DAYS = 30;

/**
 * Nightly JSON dump of every table into the blob store (Neon Free only keeps a 6h restore window).
 * Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`.
 */
export const GET: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization');
	if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) return json({ error: 'nope' }, { status: 401 });

	const [v, e, p, b, r] = await Promise.all([
		db.select().from(votes),
		db.select().from(voteEvents),
		db.select().from(profiles),
		db.select().from(bullshits),
		db.select().from(bullshitReports)
	]);
	const dump = { at: new Date().toISOString(), votes: v, vote_events: e, profiles: p, bullshits: b, bullshit_reports: r };
	const day = dump.at.slice(0, 10);
	const blob = await put(`backups/shitso-${day}.json`, JSON.stringify(dump), {
		access: 'public', // store is public; the random suffix keeps the url unguessable
		contentType: 'application/json',
		addRandomSuffix: true
	});

	// prune old dumps
	const old = await list({ prefix: 'backups/' });
	const cutoff = Date.now() - KEEP_DAYS * 86400000;
	const stale = old.blobs.filter((x) => new Date(x.uploadedAt).getTime() < cutoff).map((x) => x.url);
	if (stale.length) await del(stale);

	return json({ ok: true, rows: { votes: v.length, events: e.length, profiles: p.length, bullshits: b.length }, pruned: stale.length, url: blob.pathname });
};
