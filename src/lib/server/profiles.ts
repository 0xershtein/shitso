import { eq, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from './db/index';
import { profiles } from './db/schema';

export interface ProfileFacts {
	handle: string;
	name: string | null;
	followers: number | null;
	following: number | null;
	source: 'x' | 'extension' | 'login' | 'owner';
	fetchedAt: Date;
	notFound: boolean;
}

const X_TTL_MS = 24 * 60 * 60 * 1000; // one paid call per handle per day, at most
const OBS_TTL_MS = 6 * 60 * 60 * 1000; // extension observations count as fresh for 6h

async function stored(handle: string): Promise<ProfileFacts | null> {
	const [row] = await db.select().from(profiles).where(eq(profiles.handle, handle)).limit(1);
	return row ? { ...row, source: row.source as ProfileFacts['source'], fetchedAt: new Date(row.fetchedAt) } : null;
}

function fresh(p: ProfileFacts | null): p is ProfileFacts {
	if (!p) return false;
	const ttl = p.source === 'extension' ? OBS_TTL_MS : p.source === 'owner' ? 0 : X_TTL_MS;
	return Date.now() - p.fetchedAt.getTime() < ttl;
}

/** Fetch public metrics from the X API (bearer token). Returns null when disabled or on error. */
async function fromX(handle: string): Promise<ProfileFacts | null> {
	const token = env.X_BEARER_TOKEN;
	if (!token) return null;
	const u = new URL(`https://api.x.com/2/users/by/username/${handle}`);
	u.searchParams.set('user.fields', 'public_metrics,name,profile_image_url');
	const res = await fetch(u, {
		headers: { authorization: `Bearer ${token}` },
		signal: AbortSignal.timeout(4000)
	}).catch(() => null);
	if (!res) return null;
	if (res.status === 404) {
		return { handle, name: null, followers: null, following: null, source: 'x', fetchedAt: new Date(), notFound: true };
	}
	if (!res.ok) return null;
	const body = (await res.json()) as {
		data?: { name?: string; profile_image_url?: string; public_metrics?: { followers_count?: number; following_count?: number } };
		errors?: unknown[];
	};
	if (!body.data) {
		return { handle, name: null, followers: null, following: null, source: 'x', fetchedAt: new Date(), notFound: true };
	}
	return {
		handle,
		name: body.data.name ?? null,
		followers: body.data.public_metrics?.followers_count ?? null,
		following: body.data.public_metrics?.following_count ?? null,
		source: 'x',
		fetchedAt: new Date(),
		notFound: false
	};
}

async function upsert(p: ProfileFacts, avatar?: string | null) {
	await db
		.insert(profiles)
		.values({ ...p, avatar: avatar ?? null })
		.onConflictDoUpdate({
			target: profiles.handle,
			set: {
				name: p.name,
				followers: p.followers,
				following: p.following,
				source: p.source,
				notFound: p.notFound,
				fetchedAt: sql`now()`,
				...(avatar !== undefined ? { avatar } : {})
			}
		});
}

/**
 * Profile facts for a target. Cached; the X API is only called when `allowFetch` is true
 * (callers pass this for targets that have at least one vote, so crawlers cannot run up the bill).
 */
export async function profileFor(handle: string, allowFetch: boolean): Promise<ProfileFacts | null> {
	const cached = await stored(handle);
	if (fresh(cached)) return cached;
	if (!allowFetch) return cached;
	const live = await fromX(handle);
	if (!live) return cached;
	await upsert(live);
	return live;
}

/** Record counts an extension user saw on x.com. Never overwrites a fresher X API row with older-looking data. */
export async function observe(handle: string, facts: { name?: string | null; followers: number; following: number }) {
	await upsert({
		handle,
		name: facts.name ?? null,
		followers: facts.followers,
		following: facts.following,
		source: 'extension',
		fetchedAt: new Date(),
		notFound: false
	});
}

/** Called on every X login: the userinfo response already carries public metrics. */
export async function rememberFromLogin(f: { handle: string; name: string | null; followers: number | null; following: number | null }) {
	if (f.followers === null) return;
	await upsert({
		handle: f.handle,
		name: f.name,
		followers: f.followers,
		following: f.following,
		source: 'login',
		fetchedAt: new Date(),
		notFound: false
	});
}
