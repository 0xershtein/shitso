import { json } from '@sveltejs/kit';
import { tallyFor } from '$lib/server/db/queries';
import { EMOJIS, normalizeHandle } from '$lib/emojis';
import type { RequestHandler } from './$types';

const cors = {
	'access-control-allow-origin': '*',
	'access-control-allow-methods': 'GET, OPTIONS',
	'cache-control': 'public, max-age=30, s-maxage=30'
};

export const OPTIONS: RequestHandler = async () => new Response(null, { headers: cors });

export const GET: RequestHandler = async ({ params }) => {
	const handle = normalizeHandle(params.handle);
	if (!handle) return json({ error: 'bad handle' }, { status: 400, headers: cors });
	const t = await tallyFor(handle);
	const top = EMOJIS.find((e) => e.key === t.top);
	return json(
		{
			handle,
			total: t.total,
			shitScore: t.shitScore,
			top: top ? { key: top.key, char: top.char, label: top.label } : null,
			counts: t.counts,
			url: `https://shit.so/${handle}`
		},
		{ headers: cors }
	);
};
