import { env } from '$env/dynamic/private';

export interface Gif {
	url: string; // animated gif url
	page: string; // source page for attribution
	title: string;
	via: 'GIPHY' | 'Tenor';
}

const cache = new Map<string, { at: number; gifs: Gif[] }>();
const TTL = 60 * 60 * 1000;

async function giphy(q: string): Promise<Gif[]> {
	const u = new URL('https://api.giphy.com/v1/gifs/search');
	u.searchParams.set('api_key', env.GIPHY_API_KEY!);
	u.searchParams.set('q', q);
	u.searchParams.set('limit', '25');
	u.searchParams.set('rating', 'pg-13');
	const res = await fetch(u, { signal: AbortSignal.timeout(2500) });
	if (!res.ok) return [];
	const body = (await res.json()) as {
		data: { url: string; title: string; images: { fixed_height: { url: string } } }[];
	};
	return body.data.map((g) => ({ url: g.images.fixed_height.url, page: g.url, title: g.title, via: 'GIPHY' }));
}

async function tenor(q: string): Promise<Gif[]> {
	const u = new URL('https://tenor.googleapis.com/v2/search');
	u.searchParams.set('key', env.TENOR_API_KEY!);
	u.searchParams.set('client_key', 'shit.so');
	u.searchParams.set('q', q);
	u.searchParams.set('limit', '25');
	u.searchParams.set('contentfilter', 'medium');
	u.searchParams.set('media_filter', 'tinygif');
	const res = await fetch(u, { signal: AbortSignal.timeout(2500) });
	if (!res.ok) return [];
	const body = (await res.json()) as {
		results: { url: string; content_description: string; media_formats: { tinygif: { url: string } } }[];
	};
	return body.results.map((g) => ({
		url: g.media_formats.tinygif.url,
		page: g.url,
		title: g.content_description,
		via: 'Tenor'
	}));
}

async function search(q: string): Promise<Gif[]> {
	const provider = env.GIPHY_API_KEY ? giphy : env.TENOR_API_KEY ? tenor : null;
	if (!provider) return [];
	const hit = cache.get(q);
	if (hit && Date.now() - hit.at < TTL) return hit.gifs;
	try {
		const gifs = await provider(q);
		cache.set(q, { at: Date.now(), gifs });
		return gifs;
	} catch {
		return [];
	}
}

function hash(s: string) {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
	return h;
}

/** Stable pick per (handle, query) so a profile keeps its gif until the tier changes. */
export async function gifFor(handle: string, query: string): Promise<Gif | null> {
	const gifs = await search(query);
	if (gifs.length === 0) return null;
	return gifs[hash(handle + query) % gifs.length];
}
