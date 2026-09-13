// Per-instance memo with TTL. Fluid Compute keeps instances warm, so hot pages
// (home, popular profiles) stop hammering Neon under a traffic spike.
const store = new Map<string, { at: number; value: Promise<unknown> }>();

export function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
	const hit = store.get(key);
	if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>;
	const value = fn().catch((e) => {
		store.delete(key);
		throw e;
	});
	store.set(key, { at: Date.now(), value });
	if (store.size > 5000) {
		const cutoff = Date.now() - 60_000;
		for (const [k, v] of store) if (v.at < cutoff) store.delete(k);
	}
	return value;
}

export function forget(prefix: string) {
	for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
