import { signIn, enabledProviders } from '../../auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return { providers: enabledProviders, redirectTo: url.searchParams.get('redirectTo') ?? '/', noindex: true };
};

export const actions: Actions = { default: signIn };
