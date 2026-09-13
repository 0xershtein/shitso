import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

// Global fixed-window limiter on Upstash Redis when configured (KV_REST_API_* or
// UPSTASH_REDIS_REST_*), otherwise a per-instance sliding window. Fail-open on Redis errors.
let redis: Redis | null | undefined;
function client(): Redis | null {
	if (redis !== undefined) return redis;
	const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
	const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
	redis = url && token ? new Redis({ url, token }) : null;
	return redis;
}

const buckets = new Map<string, number[]>();

function local(key: string, limit: number, windowMs: number) {
	const now = Date.now();
	const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
	if (arr.length >= limit) {
		buckets.set(key, arr);
		return { ok: false, retryAfter: Math.ceil((arr[0] + windowMs - now) / 1000) };
	}
	arr.push(now);
	buckets.set(key, arr);
	if (buckets.size > 20000) {
		for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
	}
	return { ok: true, retryAfter: 0 };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; retryAfter: number }> {
	const r = client();
	if (!r) return local(key, limit, windowMs);
	try {
		const windowSec = Math.ceil(windowMs / 1000);
		const slot = Math.floor(Date.now() / windowMs);
		const k = `rl:${key}:${slot}`;
		const [n] = (await r.multi().incr(k).expire(k, windowSec + 1).exec()) as [number, unknown];
		if (n > limit) return { ok: false, retryAfter: windowSec - Math.floor((Date.now() % windowMs) / 1000) };
		return { ok: true, retryAfter: 0 };
	} catch (e) {
		console.error('[ratelimit] redis failed, falling back', e);
		return local(key, limit, windowMs);
	}
}

export function clientIp(request: Request): string {
	return (
		request.headers.get('x-real-ip') ||
		request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
		'unknown'
	);
}
