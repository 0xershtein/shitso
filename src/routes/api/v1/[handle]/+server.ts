import { json } from '@sveltejs/kit';
import { statsFor, tallyFor } from '$lib/server/db/queries';
import { EMOJIS, normalizeHandle } from '$lib/emojis';
import { tierFor, viralityFor } from '$lib/tiers';
import { t } from '$lib/i18n';
import { readFor } from '$lib/read';
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
	const [tally, s] = await Promise.all([tallyFor(handle), statsFor(handle)]);
	const top = EMOJIS.find((e) => e.key === tally.top);
	const tier = tierFor(tally.shitScore, tally.total);
	const virality = viralityFor({
		total: tally.total,
		bad: tally.bad,
		last24h: s.last24h,
		distinctEmojis: tally.distinctEmojis
	});
	return json(
		{
			handle,
			total: tally.total,
			shitScore: tally.shitScore,
			tier: {
				key: tier.key,
				label: t('en', `tier.${tier.key}.label`),
				emoji: tier.emoji,
				warning: tier.hasWarning ? t('en', `tier.${tier.key}.warning`) : null
			},
			virality: { score: virality.score, label: t('en', `v.${virality.label}`) },
			last24h: s.last24h,
			top: top ? { key: top.key, char: top.char, label: t('en', `emoji.${top.key}`) } : null,
			read: (() => {
				const r = readFor(tally.counts);
				return {
					ready: r.ready,
					axes: r.axes,
					quadrant: r.quadrant,
					archetype: r.archetype,
					label: t('en', `read.a.${r.archetype}`),
					source: r.source.url
				};
			})(),
			counts: tally.counts,
			url: `https://shit.so/@${handle}`
		},
		{ headers: cors }
	);
};
