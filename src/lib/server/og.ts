import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fontDataUrl from './fonts/Inter-ExtraBold.ttf?inline';
import type { Tier } from '$lib/tiers';
import { t } from '$lib/i18n';
import { avatarDataUrl } from './avatar';

// satori shapes text with harfbuzzjs, whose hb.wasm is copied into the Vercel bundle by scripts/postbuild.mjs.
const font = Buffer.from(fontDataUrl.split(',')[1], 'base64');
const emojiCache = new Map<string, string>();

const TINT: Record<Tier['key'], string> = {
	unrated: '#262626',
	respected: '#064e3b',
	questionable: '#713f12',
	certified: '#78350f',
	biohazard: '#7f1d1d'
};
const ACCENT: Record<Tier['key'], string> = {
	unrated: '#d4d4d4',
	respected: '#34d399',
	questionable: '#facc15',
	certified: '#fbbf24',
	biohazard: '#f87171'
};

function toCodePoints(s: string, stripFe0f: boolean) {
	return Array.from(s)
		.map((c) => c.codePointAt(0)!)
		.filter((cp) => !(stripFe0f && cp === 0xfe0f))
		.map((cp) => cp.toString(16))
		.join('-');
}

async function twemoji(segment: string): Promise<string> {
	const hit = emojiCache.get(segment);
	if (hit) return hit;
	for (const strip of [false, true]) {
		const url = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@16.0.1/assets/svg/${toCodePoints(segment, strip)}.svg`;
		const res = await fetch(url, { signal: AbortSignal.timeout(2500) }).catch(() => null);
		if (res?.ok) {
			const data = `data:image/svg+xml;base64,${Buffer.from(await res.text()).toString('base64')}`;
			emojiCache.set(segment, data);
			return data;
		}
	}
	return '';
}

export interface OgInput {
	handle: string;
	shitScore: number;
	total: number;
	tier: Tier;
	topChar: string | null;
	archetype: string | null;
}

const stamp = () =>
	h('div', { position: 'absolute', right: 48, top: 24, fontSize: 220, opacity: 0.16 }, '💩');

const h = (type: string, style: Record<string, unknown>, children?: unknown) => ({
	type,
	props: { style, children }
});

export async function renderOg(i: OgInput): Promise<Buffer> {
	const img = await avatarDataUrl(i.handle);
	const rated = i.total >= 3;
	const headline = rated ? `${i.shitScore}% shit` : 'unrated';
	const sub = rated
		? `${i.total} ${i.total === 1 ? 'person' : 'people'} gave a shit${i.archetype ? ` · ${i.archetype}` : ''}${i.topChar ? ` · mostly ${i.topChar}` : ''}`
		: i.total > 0
			? `${i.total} ${i.total === 1 ? 'vote' : 'votes'} so far. needs 3 for a verdict.`
			: 'nobody has given a shit yet. be first.';

	const tree = h(
		'div',
		{
			width: 1200,
			height: 630,
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			padding: 64,
			position: 'relative',
			background: `radial-gradient(ellipse at top left, ${TINT[i.tier.key]} 0%, #0a0a0a 65%)`,
			color: '#f5f5f5',
			fontFamily: 'Inter'
		},
		[
			stamp(),
			h('div', { display: 'flex', alignItems: 'center', gap: 36 }, [
				img
					? {
							type: 'img',
							props: {
								src: img,
								width: 160,
								height: 160,
								style: { borderRadius: 999, border: `8px solid ${ACCENT[i.tier.key]}` }
							}
						}
					: h('div', { width: 160, height: 160, borderRadius: 999, background: '#262626' }),
				h('div', { display: 'flex', flexDirection: 'column', gap: 10 }, [
					h('div', { fontSize: 56, letterSpacing: -2 }, `@${i.handle}`),
					rated
						? h(
								'div',
								{
									display: 'flex',
									alignItems: 'center',
									gap: 12,
									fontSize: 30,
									color: ACCENT[i.tier.key],
									padding: '8px 22px',
									border: `3px solid ${ACCENT[i.tier.key]}`,
									borderRadius: 999,
									alignSelf: 'flex-start'
								},
								`${i.tier.emoji} ${t('en', `tier.${i.tier.key}.label`)}`
							)
						: h('div', { fontSize: 30, color: '#a3a3a3' }, 'no verdict yet')
				])
			]),
			h('div', { display: 'flex', flexDirection: 'column', gap: 8 }, [
				h('div', { fontSize: 150, letterSpacing: -6, color: ACCENT[i.tier.key], lineHeight: 1 }, headline),
				h('div', { fontSize: 34, color: '#a3a3a3' }, sub)
			]),
			h('div', { display: 'flex', justifyContent: 'space-between', fontSize: 30, color: '#737373' }, [
				h('div', {}, '💩 shit.so'),
				h('div', {}, 'give yours →')
			])
		]
	);

	const svg = await satori(tree as never, {
		width: 1200,
		height: 630,
		fonts: [{ name: 'Inter', data: font, weight: 800, style: 'normal' }],
		loadAdditionalAsset: async (code, segment) => (code === 'emoji' ? twemoji(segment) : '')
	});
	return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}

/** Generic card for the home page and unspecific shares. */
export async function renderHomeOg(stats: { votes: number; targets: number }): Promise<Buffer> {
	const tree = h(
		'div',
		{
			width: 1200,
			height: 630,
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			padding: 72,
			position: 'relative',
			background: 'radial-gradient(ellipse at top left, #3f2a12 0%, #0a0a0a 65%)',
			color: '#f5f5f5',
			fontFamily: 'Inter'
		},
		[
			stamp(),
			h('div', { fontSize: 40, color: '#a3a3a3' }, '💩 shit.so'),
			h('div', { display: 'flex', flexDirection: 'column', gap: 18 }, [
				h('div', { fontSize: 150, letterSpacing: -6, lineHeight: 1 }, 'give a shit.'),
				h('div', { fontSize: 38, color: '#a3a3a3' }, 'rate anyone on X with one of ten emojis. one account, one vote.'),
				h('div', { fontSize: 52, letterSpacing: 4 }, '💩 🧢 🤡 🐍 🤖 🧠 🔥 🐐 🫡 💎')
			]),
			h('div', { display: 'flex', justifyContent: 'space-between', fontSize: 30, color: '#737373' }, [
				h('div', {}, `${stats.votes} shits given about ${stats.targets} people`),
				h('div', {}, 'no ads. no payments. never.')
			])
		]
	);
	const svg = await satori(tree as never, {
		width: 1200,
		height: 630,
		fonts: [{ name: 'Inter', data: font, weight: 800, style: 'normal' }],
		loadAdditionalAsset: async (code, segment) => (code === 'emoji' ? twemoji(segment) : '')
	});
	return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
