import { eq, sql } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { db } from './db/index';
import { profiles } from './db/schema';

const RETRY_MS = 10 * 60 * 1000;
const miss = new Map<string, number>(); // handle -> last failed attempt (per instance)

/** Stored avatar url for a handle, or null. */
export async function storedAvatar(handle: string): Promise<string | null> {
	const [row] = await db.select({ avatar: profiles.avatar }).from(profiles).where(eq(profiles.handle, handle)).limit(1);
	return row?.avatar ?? null;
}

/** Remember an avatar url we learned for free (login response, extension observation). */
export async function rememberAvatar(handle: string, url: string | null | undefined) {
	if (!url || !/^https:\/\/pbs\.twimg\.com\//.test(url)) return;
	const hi = url.replace(/_(normal|bigger|mini|200x200)\./, '_400x400.');
	await db
		.insert(profiles)
		.values({ handle, source: 'avatar', avatar: hi })
		.onConflictDoUpdate({ target: profiles.handle, set: { avatar: hi } });
}

/**
 * Resolve an avatar: stored url first; otherwise fetch once from unavatar, copy into our Blob
 * store and remember it. Returns null when nothing is available (caller renders a placeholder).
 */
export async function resolveAvatar(handle: string): Promise<string | null> {
	const stored = await storedAvatar(handle);
	if (stored) return stored;
	const last = miss.get(handle);
	if (last && Date.now() - last < RETRY_MS) return null;
	try {
		const res = await fetch(`https://unavatar.io/x/${handle}?fallback=false`, {
			signal: AbortSignal.timeout(4000),
			headers: { 'user-agent': 'shit.so/1.0 (+https://shit.so)' }
		});
		if (!res.ok) throw new Error(String(res.status));
		const type = res.headers.get('content-type') ?? 'image/jpeg';
		const bytes = Buffer.from(await res.arrayBuffer());
		if (bytes.length < 500) throw new Error('empty');
		const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
		const blob = await put(`avatars/${handle}.${ext}`, bytes, {
			access: 'public',
			contentType: type,
			addRandomSuffix: false,
			cacheControlMaxAge: 60 * 60 * 24 * 30
		});
		await db
			.insert(profiles)
			.values({ handle, source: 'avatar', avatar: blob.url })
			.onConflictDoUpdate({ target: profiles.handle, set: { avatar: blob.url } });
		return blob.url;
	} catch {
		miss.set(handle, Date.now());
		return null;
	}
}

/** Data url for server-side rendering (OG cards). */
export async function avatarDataUrl(handle: string): Promise<string | null> {
	const url = await resolveAvatar(handle);
	if (!url) return null;
	const res = await fetch(url, { signal: AbortSignal.timeout(3000) }).catch(() => null);
	if (!res?.ok) return null;
	const type = res.headers.get('content-type') ?? 'image/jpeg';
	return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
}

/** Neutral placeholder: first letter on dark circle. */
export function placeholderSvg(handle: string): string {
	const ch = (handle[0] ?? '?').toUpperCase();
	return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" rx="100" fill="#262626"/><text x="100" y="118" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="88" font-weight="800" fill="#737373">${ch}</text></svg>`;
}

export const touch = sql`now()`;
