import { json } from '@sveltejs/kit';
import { recentFeed } from '$lib/server/db/queries';
import { memo } from '$lib/server/memo';
import type { RequestHandler } from './$types';

/** Latest votes for the live feed. Cached briefly; polled by the home page. */
export const GET: RequestHandler = async () => {
	const rows = await memo('feed:20', 5_000, () => recentFeed(20));
	return json(
		{ items: rows.map((r) => ({ voter: r.voterHandle, target: r.target, emoji: r.emoji, at: r.at })) },
		{ headers: { 'cache-control': 'public, max-age=5, s-maxage=5' } }
	);
};
