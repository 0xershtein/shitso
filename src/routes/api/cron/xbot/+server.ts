import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { runOnce } from '$lib/server/xbot';
import type { RequestHandler } from './$types';

/** Poll @shitdotso mentions. Called every minute by an external scheduler with `Authorization: Bearer $CRON_SECRET`. */
export const GET: RequestHandler = async ({ request, url }) => {
	const auth = request.headers.get('authorization') ?? `Bearer ${url.searchParams.get('key') ?? ''}`;
	if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) return json({ error: 'nope' }, { status: 401 });
	try {
		const r = await runOnce();
		return json({ ok: true, ...r }, { headers: { 'cache-control': 'no-store' } });
	} catch (e) {
		console.error('[xbot]', e);
		return json({ ok: false, error: (e as Error).message }, { status: 500, headers: { 'cache-control': 'no-store' } });
	}
};
