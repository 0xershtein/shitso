import { redirect } from '@sveltejs/kit';
import { leaderboard, recentFeed, totals, trending } from '$lib/server/db/queries';
import { normalizeHandle } from '$lib/emojis';
import { t } from '$lib/i18n';
import { latestBullshits } from '$lib/server/bullshit';
import { memo } from '$lib/server/memo';
import { rateLimit, clientIp } from '$lib/server/ratelimit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const [shit, goat, hot, feed, stats, bullshits] = await Promise.all([
		memo('home:shit', 20_000, () => leaderboard('shit')),
		memo('home:goat', 20_000, () => leaderboard('goat')),
		memo('home:hot', 20_000, () => trending()),
		memo('home:feed', 10_000, () => recentFeed()),
		memo('home:totals', 20_000, () => totals()),
		memo('home:bs', 30_000, () => latestBullshits())
	]);
	return { shit, goat, hot, feed, stats, bullshits, origin: url.origin };
};

export const actions: Actions = {
	search: async ({ request, locals }) => {
		if (!(await rateLimit(`search:${clientIp(request)}`, 30, 60_000)).ok) return { error: 'slow down' };
		const form = await request.formData();
		const handle = normalizeHandle(String(form.get('handle') ?? ''));
		if (!handle) return { error: t(locals.locale, 'home.badHandle') };
		redirect(303, `/@${handle}`);
	}
};
