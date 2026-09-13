import { error, fail, redirect } from '@sveltejs/kit';
import {
	VOTE_COOLDOWN_SECONDS,
	castVote,
	myVote,
	onCooldown,
	removeVote,
	rhythmFor,
	statsFor,
	tallyFor
} from '$lib/server/db/queries';
import { gifFor } from '$lib/server/giphy';
import { EMOJI_KEYS, normalizeHandle } from '$lib/emojis';
import { tierFor, viralityFor } from '$lib/tiers';
import { eligibility } from '$lib/eligibility';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const handle = normalizeHandle(params.handle);
	if (!handle) error(404, 'not an X handle');
	if (handle !== params.handle) redirect(301, `/${handle}`);

	const session = await locals.auth();
	const [tally, mine, stats, rhythm] = await Promise.all([
		tallyFor(handle),
		session?.user?.id ? myVote(session.user.id, handle) : null,
		statsFor(handle),
		rhythmFor(handle)
	]);
	const tier = tierFor(tally.shitScore, tally.total);
	const virality = viralityFor({
		total: tally.total,
		bad: tally.bad,
		last24h: stats.last24h,
		distinctEmojis: tally.distinctEmojis
	});
	const gif = await gifFor(handle, tier.gifQuery);

	return {
		handle,
		origin: url.origin,
		tally,
		mine,
		stats,
		rhythm,
		tier,
		virality,
		gif,
		isSelf: session?.user?.handle === handle,
		eligible: session?.user ? eligibility(session.user) : null
	};
};

export const actions: Actions = {
	vote: async ({ params, request, locals }) => {
		const handle = normalizeHandle(params.handle);
		if (!handle) error(404);
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, `/signin?redirectTo=/${handle}`);
		if (session.user.handle === handle) return fail(400, { error: 'you cannot rate yourself, nice try' });
		const elig = eligibility(session.user);
		if (!elig.ok) return fail(403, { error: elig.reason });
		if (await onCooldown(session.user.id, handle))
			return fail(429, { error: `easy. wait ${VOTE_COOLDOWN_SECONDS} seconds between changes.` });

		const form = await request.formData();
		const emoji = String(form.get('emoji') ?? '');
		if (emoji === 'none') {
			await removeVote(session.user.id, session.user.handle, handle);
			return { ok: true };
		}
		if (!EMOJI_KEYS.includes(emoji)) return fail(400, { error: 'unknown emoji' });
		await castVote(session.user.id, session.user.handle, handle, emoji);
		return { ok: true };
	}
};
