import { redirect } from '@sveltejs/kit';
import { leaderboard, recentFeed, totals, trending } from '$lib/server/db/queries';
import { normalizeHandle } from '$lib/emojis';
import { t } from '$lib/i18n';
import { latestBullshits } from '$lib/server/bullshit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [shit, goat, hot, feed, stats, bullshits] = await Promise.all([
		leaderboard('shit'),
		leaderboard('goat'),
		trending(),
		recentFeed(),
		totals(),
		latestBullshits()
	]);
	return { shit, goat, hot, feed, stats, bullshits };
};

export const actions: Actions = {
	search: async ({ request, locals }) => {
		const form = await request.formData();
		const handle = normalizeHandle(String(form.get('handle') ?? ''));
		if (!handle) return { error: t(locals.locale, 'home.badHandle') };
		redirect(303, `/@${handle}`);
	}
};
