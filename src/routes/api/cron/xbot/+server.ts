import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { replay, runOnce } from '$lib/server/xbot';
import type { RequestHandler } from './$types';

/** Poll @giveshit_bot mentions. `?replay=<tweetId>` re-processes one tweet. Called every minute by an external scheduler with `Authorization: Bearer $CRON_SECRET`. */
export const GET: RequestHandler = async ({ request, url }) => {
	const auth = request.headers.get('authorization') ?? `Bearer ${url.searchParams.get('key') ?? ''}`;
	if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) return json({ error: 'nope' }, { status: 401 });
	try {
		const id = url.searchParams.get('replay');
		const r = id && /^\d+$/.test(id) ? await replay(id) : await runOnce();
		return json({ ok: true, ...r }, { headers: { 'cache-control': 'no-store' } });
	} catch (e) {
		console.error('[xbot]', e);
		return json({ ok: false, error: (e as Error).message }, { status: 500, headers: { 'cache-control': 'no-store' } });
	}
};
