import { json } from '@sveltejs/kit';
import { desc, like, sql } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { votes } from '$lib/server/db/schema';
import { BAD_KEYS } from '$lib/emojis';
import { tierFor } from '$lib/tiers';
import { memo } from '$lib/server/memo';
import { rateLimit, clientIp } from '$lib/server/ratelimit';
import type { RequestHandler } from './$types';

const badList = sql.join(BAD_KEYS.map((k) => sql`${k}`), sql`, `);

/** GET ?q=prefix → up to 8 known targets, most voted first. Empty q = most voted overall. */
export const GET: RequestHandler = async ({ url, request }) => {
	const headers = { 'cache-control': 'public, max-age=30, s-maxage=60' };
	if (!(await rateLimit(`suggest:${clientIp(request)}`, 120, 60_000)).ok) return json({ results: [] }, { status: 429, headers });
	const q = (url.searchParams.get('q') ?? '').trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15);
	const rows = await memo(`suggest:${q}`, 30_000, () =>
		db
			.select({
				target: votes.target,
				total: sql<number>`count(*)::int`,
				bad: sql<number>`sum(case when ${votes.emoji} in (${badList}) then 1 else 0 end)::int`
			})
			.from(votes)
			.where(q ? like(votes.target, `${q}%`) : sql`true`)
			.groupBy(votes.target)
			.orderBy(desc(sql`count(*)`))
			.limit(8)
	);
	return json(
		{
			results: rows.map((r) => {
				const shitScore = r.total ? Math.round((r.bad / r.total) * 100) : 0;
				return { handle: r.target, total: r.total, shitScore, tier: tierFor(shitScore, r.total).key };
			})
		},
		{ headers }
	);
};
