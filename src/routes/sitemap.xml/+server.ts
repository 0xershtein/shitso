import { desc, sql } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { votes } from '$lib/server/db/schema';
import { memo } from '$lib/server/memo';
import type { RequestHandler } from './$types';

/** Home + every profile with at least one vote (max 5000). */
export const GET: RequestHandler = async ({ url }) => {
	const rows = await memo('sitemap', 10 * 60_000, () =>
		db
			.select({ target: votes.target, last: sql<string>`max(${votes.updatedAt})` })
			.from(votes)
			.groupBy(votes.target)
			.orderBy(desc(sql`count(*)`))
			.limit(5000)
	);
	const items = rows
		.map((r) => `<url><loc>${url.origin}/@${r.target}</loc><lastmod>${new Date(r.last).toISOString()}</lastmod><changefreq>hourly</changefreq></url>`)
		.join('');
	const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url.origin}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>${items}</urlset>`;
	return new Response(xml, { headers: { 'content-type': 'application/xml', 'cache-control': 'public, max-age=600, s-maxage=600' } });
};
