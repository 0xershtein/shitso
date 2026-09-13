import { error, fail, redirect } from '@sveltejs/kit';
import { castVote, myVote, removeVote, tallyFor } from '$lib/server/db/queries';
import { EMOJI_KEYS, normalizeHandle } from '$lib/emojis';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const handle = normalizeHandle(params.handle);
	if (!handle) error(404, 'not an X handle');
	if (handle !== params.handle) redirect(301, `/${handle}`);

	const session = await locals.auth();
	const [tally, mine] = await Promise.all([
		tallyFor(handle),
		session?.user?.id ? myVote(session.user.id, handle) : null
	]);
	return { handle, tally, mine, isSelf: session?.user?.handle === handle };
};

export const actions: Actions = {
	vote: async ({ params, request, locals }) => {
		const handle = normalizeHandle(params.handle);
		if (!handle) error(404);
		const session = await locals.auth();
		if (!session?.user?.id) redirect(303, `/signin?redirectTo=/${handle}`);
		if (session.user.handle === handle) return fail(400, { error: 'you cannot rate yourself, nice try' });

		const form = await request.formData();
		const emoji = String(form.get('emoji') ?? '');
		if (emoji === 'none') {
			await removeVote(session.user.id, handle);
			return { ok: true };
		}
		if (!EMOJI_KEYS.includes(emoji)) return fail(400, { error: 'unknown emoji' });
		await castVote(session.user.id, session.user.handle, handle, emoji);
		return { ok: true };
	}
};
