import { totals } from '$lib/server/db/queries';
import { memo } from '$lib/server/memo';
import { renderHomeOg } from '$lib/server/og';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const stats = await memo('home:totals', 20_000, () => totals());
	const png = await renderHomeOg(stats);
	return new Response(new Uint8Array(png), {
		headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' }
	});
};
