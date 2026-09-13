// Recently viewed handles, per browser. Small and best-effort.
const KEY = 'shitso:recent';
const MAX = 8;

export function getRecent(): string[] {
	try {
		const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
		return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, MAX) : [];
	} catch {
		return [];
	}
}

export function pushRecent(handle: string) {
	try {
		const next = [handle, ...getRecent().filter((h) => h !== handle)].slice(0, MAX);
		localStorage.setItem(KEY, JSON.stringify(next));
	} catch {
		/* private mode etc. */
	}
}

export function clearRecent() {
	try {
		localStorage.removeItem(KEY);
	} catch {
		/* ignore */
	}
}
