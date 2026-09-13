import { error, fail, redirect } from '@sveltejs/kit';
import { myVote, rhythmFor, statsFor, tallyFor } from '$lib/server/db/queries';
import { gifFor } from '$lib/server/giphy';
import { normalizeHandle } from '$lib/emojis';
import { tierFor, viralityFor } from '$lib/tiers';
import { eligibility } from '$lib/eligibility';
import { t } from '$lib/i18n';
import { exempt, submitVote } from '$lib/server/vote';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const handle = normalizeHandle(params.handle);
	if (!handle) error(404, 'not an X handle');
	if (params.handle !== `@${handle}`) redirect(301, `/@${handle}`);

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
		eligible: session?.user ? eligibility(session.user, exempt()) : null
	};
};

export const actions: Actions = {
	vote: async ({ params, request, locals }) => {
		const handle = normalizeHandle(params.handle);
		if (!handle) error(404);
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, `/signin?redirectTo=/@${handle}`);
		const form = await request.formData();
		const r = await submitVote(session, handle, String(form.get('emoji') ?? ''));
		if (!r.ok) return fail(r.status, { error: t(locals.locale, r.key, r.vars ?? {}) });
		return { ok: true };
	}
};
