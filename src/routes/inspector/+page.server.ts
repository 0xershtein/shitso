import { error, fail } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/admin';
import { inspect, inspectorQueue } from '$lib/server/bullshit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!isAdmin(session)) error(404, 'nothing here');
	return { ...(await inspectorQueue()), noindex: true };
};

export const actions: Actions = {
	decide: async ({ request, locals }) => {
		const session = await locals.auth();
		if (!isAdmin(session)) error(404);
		const form = await request.formData();
		const id = Number(form.get('id'));
		const decision = String(form.get('decision'));
		if (!Number.isInteger(id) || (decision !== 'approve' && decision !== 'reject')) return fail(400);
		await inspect(id, decision);
		return { ok: true };
	}
};
