import { isAdmin } from '$lib/server/admin';
import { pendingCount } from '$lib/server/bullshit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const session = await event.locals.auth();
	return {
		session,
		locale: event.locals.locale,
		pendingCount: isAdmin(session) ? await pendingCount() : null
	};
};
