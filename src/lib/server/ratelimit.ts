// Sliding-window limiter, per instance. Not global, but it bounds abuse per function
// instance at zero cost. Swap for Upstash/Redis if a global limit is ever needed.
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
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

export function clientIp(request: Request): string {
	return (
		request.headers.get('x-real-ip') ||
		request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
		'unknown'
	);
}
