import { json } from '@sveltejs/kit';
import { normalizeHandle } from '$lib/emojis';
import { myVote, tallyFor } from '$lib/server/db/queries';
import { submitVote } from '$lib/server/vote';
import { corsHeaders } from '$lib/server/cors';
import { t } from '$lib/i18n';
import { forget } from '$lib/server/memo';
import { rateLimit } from '$lib/server/ratelimit';
import type { RequestHandler } from './$types';

export const OPTIONS: RequestHandler = async ({ request }) =>
	new Response(null, { headers: corsHeaders(request.headers.get('origin')) });

/** POST { handle, emoji } — emoji may be 'none' to remove. Returns the fresh tally. */
export const POST: RequestHandler = async ({ request, locals }) => {
	const headers = corsHeaders(request.headers.get('origin'), { 'cache-control': 'no-store' });
	let body: { handle?: string; emoji?: string } = {};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'bad json' }, { status: 400, headers });
	}
	const target = normalizeHandle(String(body.handle ?? ''));
	if (!target) return json({ error: 'bad handle' }, { status: 400, headers });

	const session = await locals.auth();
	if (session?.user?.id && !(await rateLimit(`vote:${session.user.id}`, 40, 60_000)).ok)
		return json({ error: 'slow down' }, { status: 429, headers });
	const r = await submitVote(session, target, String(body.emoji ?? ''));
	if (!r.ok) return json({ error: t(locals.locale, r.key, r.vars ?? {}), code: r.key }, { status: r.status, headers });

	forget(`p:${target}:`);
	forget('home:');
	const [tally, mine] = await Promise.all([tallyFor(target), myVote(session!.user.id, target)]);
	return json({ ok: true, handle: target, total: tally.total, shitScore: tally.shitScore, top: tally.top, mine }, { headers });
};
