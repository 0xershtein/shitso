import { error } from '@sveltejs/kit';
import { tallyFor } from '$lib/server/db/queries';
import { emojiByKey, normalizeHandle } from '$lib/emojis';
import { tierFor } from '$lib/tiers';
import { renderOg } from '$lib/server/og';
import { readFor } from '$lib/read';
import { t as tr } from '$lib/i18n';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const handle = normalizeHandle(params.handle);
	if (!handle) error(404);
	const t = await tallyFor(handle);
	const png = await renderOg({
		handle,
		shitScore: t.shitScore,
		total: t.total,
		tier: tierFor(t.shitScore, t.total),
		topChar: t.top ? (emojiByKey(t.top)?.char ?? null) : null,
		archetype: (() => {
			const r = readFor(t.counts);
			return r.ready ? tr('en', `read.a.${r.archetype}`) : null;
		})()
	});
	return new Response(new Uint8Array(png), {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600'
		}
	});
};
