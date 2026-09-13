import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { forceRefresh, replay, runOnce } from '$lib/server/xbot';
import { rateLimit, clientIp } from '$lib/server/ratelimit';
import type { RequestHandler } from './$types';

/** Poll @giveshit_bot mentions. `?replay=<tweetId>` re-processes one tweet. Called every minute by an external scheduler with `Authorization: Bearer $CRON_SECRET`. */
export const GET: RequestHandler = async ({ request, url }) => {
	const auth = request.headers.get('authorization') ?? `Bearer ${url.searchParams.get('key') ?? ''}`;
	const trusted = !!env.CRON_SECRET && auth === `Bearer ${env.CRON_SECRET}`;
	// Unauthenticated polls are allowed (so a public scheduler needs no secret) but globally
	// throttled to one run per 45s and per-IP limited; replay stays secret-only.
	if (!trusted) {
		if (!(await rateLimit(`xbot:ip:${clientIp(request)}`, 4, 60_000)).ok) return json({ error: 'slow down' }, { status: 429 });
		if (!(await rateLimit('xbot:global', 1, 45_000)).ok) return json({ ok: true, throttled: true }, { headers: { 'cache-control': 'no-store' } });
	}
	try {
		if (trusted && url.searchParams.get('refresh')) return json(await forceRefresh(), { headers: { 'cache-control': 'no-store' } });
		const id = trusted ? url.searchParams.get('replay') : null;
		const r = id && /^\d+$/.test(id) ? await replay(id) : await runOnce();
		return json({ ok: true, ...r }, { headers: { 'cache-control': 'no-store' } });
	} catch (e) {
		console.error('[xbot]', e);
		return json({ ok: false, error: (e as Error).message }, { status: 500, headers: { 'cache-control': 'no-store' } });
	}
};
