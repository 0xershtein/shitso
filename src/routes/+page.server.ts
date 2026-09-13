import { redirect } from '@sveltejs/kit';
import { leaderboard, recentFeed, totals, trending } from '$lib/server/db/queries';
import { normalizeHandle } from '$lib/emojis';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [shit, goat, hot, feed, stats] = await Promise.all([
		leaderboard('shit'),
		leaderboard('goat'),
		trending(),
		recentFeed(),
		totals()
	]);
	return { shit, goat, hot, feed, stats };
};

export const actions: Actions = {
	search: async ({ request }) => {
		const form = await request.formData();
		const handle = normalizeHandle(String(form.get('handle') ?? ''));
		if (!handle) return { error: 'that is not an X handle' };
		redirect(303, `/${handle}`);
	}
};
