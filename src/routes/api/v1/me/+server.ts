import { json } from '@sveltejs/kit';
import { eligibility } from '$lib/eligibility';
import { exempt } from '$lib/server/vote';
import { corsHeaders } from '$lib/server/cors';
import { t } from '$lib/i18n';
import type { RequestHandler } from './$types';

export const OPTIONS: RequestHandler = async ({ request }) =>
	new Response(null, { headers: corsHeaders(request.headers.get('origin')) });

export const GET: RequestHandler = async ({ locals, request }) => {
	const headers = corsHeaders(request.headers.get('origin'), { 'cache-control': 'no-store' });
	const session = await locals.auth();
	if (!session?.user) return json({ signedIn: false }, { headers });
	const e = eligibility(session.user, exempt());
	return json(
		{
			signedIn: true,
			handle: session.user.handle,
			eligible: e.ok,
			reason: e.ok ? null : t(locals.locale, e.key, e.vars)
		},
		{ headers }
	);
};
