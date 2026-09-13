export interface Tier {
	key: 'unrated' | 'respected' | 'questionable' | 'certified' | 'biohazard';
	emoji: string;
	hasWarning: boolean; // banner shown; copy lives in i18n under tier.<key>.warning
	gifQuery: string; // giphy/tenor search
	bg: string; // full-page backdrop classes
	accent: string; // text color class for the score
	badge: string; // pill classes
	ring: string; // avatar ring
	stamp: string | null; // rotated stamp classes shown next to the avatar, null = none
}

const TIERS: Record<Tier['key'], Tier> = {
	unrated: {
		key: 'unrated',
		emoji: '❓',
		hasWarning: false,
		gifQuery: 'crickets silence',
		bg: 'bg-neutral-950',
		accent: 'text-neutral-300',
		badge: 'border-neutral-700 bg-neutral-900 text-neutral-300',
		ring: 'ring-neutral-800',
		stamp: null
	},
	respected: {
		key: 'respected',
		emoji: '🫡',
		hasWarning: false,
		gifQuery: 'standing ovation respect',
		bg: 'bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.22),_transparent_60%)] bg-neutral-950',
		accent: 'text-emerald-400',
		badge: 'border-emerald-700/50 bg-emerald-950/60 text-emerald-300',
		ring: 'ring-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.35)]',
		stamp: 'border-emerald-400 text-emerald-300'
	},
	questionable: {
		key: 'questionable',
		emoji: '🤨',
		hasWarning: false,
		gifQuery: 'suspicious squint',
		bg: 'bg-[radial-gradient(ellipse_at_top,_rgba(234,179,8,0.18),_transparent_60%)] bg-neutral-950',
		accent: 'text-yellow-400',
		badge: 'border-yellow-700/50 bg-yellow-950/60 text-yellow-300',
		ring: 'ring-yellow-500/60 ring-dashed',
		stamp: null
	},
	certified: {
		key: 'certified',
		emoji: '💩',
		hasWarning: true,
		gifQuery: 'disgusted no thanks',
		bg: 'bg-[radial-gradient(ellipse_at_top,_rgba(180,83,9,0.30),_transparent_60%)] bg-neutral-950',
		accent: 'text-amber-400',
		badge: 'border-amber-700/60 bg-amber-950/60 text-amber-300',
		ring: 'ring-amber-500/70',
		stamp: 'border-amber-400 text-amber-300'
	},
	biohazard: {
		key: 'biohazard',
		emoji: '☣️',
		hasWarning: true,
		gifQuery: 'dumpster fire',
		bg: 'bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.32),_transparent_60%)] bg-neutral-950',
		accent: 'text-red-400',
		badge: 'border-red-700/60 bg-red-950/60 text-red-300',
		ring: 'ring-red-500/80 shadow-[0_0_40px_rgba(239,68,68,0.35)]',
		stamp: 'border-red-500 text-red-400'
	}
};

/** Votes needed before a tier counts as confirmed; below it the page says "early read". */
export const MIN_VOTES_FOR_TIER = 3;

export function isProvisional(total: number): boolean {
	return total > 0 && total < MIN_VOTES_FOR_TIER;
}

export function tierFor(shitScore: number, total: number): Tier {
	if (total === 0) return TIERS.unrated;
	if (shitScore >= 80) return TIERS.biohazard;
	if (shitScore >= 50) return TIERS.certified;
	if (shitScore >= 25) return TIERS.questionable;
	return TIERS.respected;
}

export type ViralityLabel = 'dead' | 'simmering' | 'spicy' | 'volatile' | 'blow';

export interface Virality {
	score: number; // 0..100
	label: ViralityLabel; // i18n key under v.*
	parts: { volume: number; heat: number; controversy: number; diversity: number };
}

export function viralityFor(input: {
	total: number;
	bad: number;
	last24h: number;
	distinctEmojis: number;
}): Virality {
	const volume = Math.min(1, Math.log10(input.total + 1) / 2); // 100 votes -> 1
	const heat = Math.min(1, input.last24h / 10); // 10 votes/day -> 1
	const split = input.total ? input.bad / input.total : 0.5;
	const controversy = input.total ? 1 - Math.abs(split - 0.5) * 2 : 0;
	const diversity = input.distinctEmojis / 10;
	const score = Math.round(100 * (0.35 * volume + 0.35 * heat + 0.2 * controversy + 0.1 * diversity));
	const label: ViralityLabel =
		score < 15 ? 'dead' : score < 35 ? 'simmering' : score < 55 ? 'spicy' : score < 75 ? 'volatile' : 'blow';
	return { score, label, parts: { volume, heat, controversy, diversity } };
}
