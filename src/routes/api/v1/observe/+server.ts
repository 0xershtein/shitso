import { json } from '@sveltejs/kit';
import { normalizeHandle } from '$lib/emojis';
import { observe } from '$lib/server/profiles';
import { rememberAvatar } from '$lib/server/avatar';
import { corsHeaders } from '$lib/server/cors';
import type { RequestHandler } from './$types';

export const OPTIONS: RequestHandler = async ({ request }) =>
	new Response(null, { headers: corsHeaders(request.headers.get('origin')) });

/** POST { handle, followers, following, name? } from the extension. Signed-in users only. */
export const POST: RequestHandler = async ({ request, locals }) => {
	const headers = corsHeaders(request.headers.get('origin'), { 'cache-control': 'no-store' });
	const session = await locals.auth();
	if (!session?.user?.id) return json({ error: 'sign in first' }, { status: 401, headers });

	let body: { handle?: string; followers?: unknown; following?: unknown; name?: unknown; avatar?: unknown } = {};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'bad json' }, { status: 400, headers });
	}
	const handle = normalizeHandle(String(body.handle ?? ''));
	const followers = Number(body.followers);
	const following = Number(body.following);
	if (!handle || !Number.isInteger(followers) || !Number.isInteger(following) || followers < 0 || following < 0 || followers > 1e9 || following > 1e7)
		return json({ error: 'bad payload' }, { status: 400, headers });
	const name = typeof body.name === 'string' ? body.name.slice(0, 80) : null;

	await observe(handle, { name, followers, following });
	if (typeof body.avatar === 'string') await rememberAvatar(handle, body.avatar).catch(() => {});
	return json({ ok: true }, { headers });
};
