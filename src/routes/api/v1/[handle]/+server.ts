import { json } from '@sveltejs/kit';
import { statsFor, tallyFor } from '$lib/server/db/queries';
import { EMOJIS, normalizeHandle } from '$lib/emojis';
import { tierFor, viralityFor } from '$lib/tiers';
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
	const [t, s] = await Promise.all([tallyFor(handle), statsFor(handle)]);
	const top = EMOJIS.find((e) => e.key === t.top);
	const tier = tierFor(t.shitScore, t.total);
	const virality = viralityFor({
		total: t.total,
		bad: t.bad,
		last24h: s.last24h,
		distinctEmojis: t.distinctEmojis
	});
	return json(
		{
			handle,
			total: t.total,
			shitScore: t.shitScore,
			tier: { key: tier.key, label: tier.label, emoji: tier.emoji, warning: tier.warning },
			virality: { score: virality.score, label: virality.label },
			last24h: s.last24h,
			top: top ? { key: top.key, char: top.char, label: top.label } : null,
			counts: t.counts,
			url: `https://shit.so/${handle}`
		},
		{ headers: cors }
	);
};
