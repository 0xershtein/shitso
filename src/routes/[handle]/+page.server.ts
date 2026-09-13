import { error, fail, redirect } from '@sveltejs/kit';
import { myVote, rhythmFor, statsFor, tallyFor } from '$lib/server/db/queries';
import { gifFor } from '$lib/server/giphy';
import { normalizeHandle } from '$lib/emojis';
import { tierFor, viralityFor } from '$lib/tiers';
import { eligibility } from '$lib/eligibility';
import { t } from '$lib/i18n';
import { exempt, submitVote } from '$lib/server/vote';
import { memo, forget } from '$lib/server/memo';
import { rateLimit, clientIp } from '$lib/server/ratelimit';
import { readFor } from '$lib/read';
import { profileFor } from '$lib/server/profiles';
import { BULLSHIT_TTL_DAYS, wallFor, wallHidden } from '$lib/server/bullshit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const handle = normalizeHandle(params.handle);
	if (!handle) error(404, 'not an X handle');
	if (params.handle !== `@${handle}`) redirect(301, `/@${handle}`);

	const session = await locals.auth();
	const [tally, mine, stats, rhythm] = await Promise.all([
		memo(`p:${handle}:tally`, 5_000, () => tallyFor(handle)),
		session?.user?.id ? myVote(session.user.id, handle) : null,
		memo(`p:${handle}:stats`, 10_000, () => statsFor(handle)),
		memo(`p:${handle}:rhythm`, 30_000, () => rhythmFor(handle))
	]);
	const tier = tierFor(tally.shitScore, tally.total);
	const virality = viralityFor({
		total: tally.total,
		bad: tally.bad,
		last24h: stats.last24h,
		distinctEmojis: tally.distinctEmojis
	});
	const [gif, profile, wall, hidden] = await Promise.all([
		gifFor(handle, tier.gifQuery),
		profileFor(handle, tally.total > 0),
		wallFor(handle, session?.user?.id ?? null),
		wallHidden(handle)
	]);

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
		profile: profile && !profile.notFound ? { name: profile.name, followers: profile.followers, following: profile.following } : null,
		read: readFor(tally.counts),
		wall,
		wallHidden: hidden,
		bullshitTtlDays: BULLSHIT_TTL_DAYS,
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
		if (!rateLimit(`vote:${session.user.id}`, 40, 60_000).ok) return fail(429, { error: 'slow down' });
		const form = await request.formData();
		const r = await submitVote(session, handle, String(form.get('emoji') ?? ''));
		if (!r.ok) return fail(r.status, { error: t(locals.locale, r.key, r.vars ?? {}) });
		forget(`p:${handle}:`);
		forget('home:');
		return { ok: true };
	}
};
