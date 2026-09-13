import { json } from '@sveltejs/kit';
import { normalizeHandle } from '$lib/emojis';
import { myVote, tallyFor } from '$lib/server/db/queries';
import { tierFor } from '$lib/tiers';
import { corsHeaders } from '$lib/server/cors';
import { memo } from '$lib/server/memo';
import { rateLimit, clientIp } from '$lib/server/ratelimit';
import type { RequestHandler } from './$types';

export const OPTIONS: RequestHandler = async ({ request }) =>
	new Response(null, { headers: corsHeaders(request.headers.get('origin')) });

/** GET ?handles=a,b,c (max 50). Includes the caller's own vote when signed in. */
export const GET: RequestHandler = async ({ url, locals, request }) => {
	const headers = corsHeaders(request.headers.get('origin'), { 'cache-control': 'no-store' });
	if (!rateLimit(`tally:${clientIp(request)}`, 120, 60_000).ok) return json({ error: 'slow down' }, { status: 429, headers });
	const handles = Array.from(
		new Set(
			(url.searchParams.get('handles') ?? '')
				.split(',')
				.map((h) => normalizeHandle(h))
				.filter((h): h is string => !!h)
		)
	).slice(0, 50);
	const session = await locals.auth();
	const uid = session?.user?.id ?? null;
	const rows = await Promise.all(
		handles.map(async (h) => {
			const [t, mine] = await Promise.all([memo(`p:${h}:tally`, 5_000, () => tallyFor(h)), uid ? myVote(uid, h) : null]);
			const tier = tierFor(t.shitScore, t.total);
			return { handle: h, total: t.total, shitScore: t.shitScore, top: t.top, tier: tier.key, mine };
		})
	);
	return json({ results: rows }, { headers });
};
