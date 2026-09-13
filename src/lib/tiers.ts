export interface Tier {
	key: 'unrated' | 'respected' | 'questionable' | 'certified' | 'biohazard';
	label: string;
	emoji: string;
	blurb: string; // shown under the score
	warning: string | null; // banner text, null = no banner
	gifQuery: string; // giphy search
	bg: string; // full-page backdrop classes
	accent: string; // text color class for the score
	badge: string; // pill classes
	ring: string; // avatar ring
}

const TIERS: Record<Tier['key'], Tier> = {
	unrated: {
		key: 'unrated',
		label: 'unrated',
		emoji: '❓',
		blurb: 'nobody has given a shit yet.',
		warning: null,
		gifQuery: 'crickets silence',
		bg: 'bg-neutral-950',
		accent: 'text-neutral-300',
		badge: 'border-neutral-700 bg-neutral-900 text-neutral-300',
		ring: 'ring-neutral-800'
	},
	respected: {
		key: 'respected',
		label: 'respected',
		emoji: '🫡',
		blurb: 'the people have spoken. this one is alright.',
		warning: null,
		gifQuery: 'standing ovation respect',
		bg: 'bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.22),_transparent_60%)] bg-neutral-950',
		accent: 'text-emerald-400',
		badge: 'border-emerald-700/50 bg-emerald-950/60 text-emerald-300',
		ring: 'ring-emerald-500/60'
	},
	questionable: {
		key: 'questionable',
		label: 'questionable',
		emoji: '🤨',
		blurb: 'jury is out. keep an eye on this one.',
		warning: null,
		gifQuery: 'suspicious squint',
		bg: 'bg-[radial-gradient(ellipse_at_top,_rgba(234,179,8,0.18),_transparent_60%)] bg-neutral-950',
		accent: 'text-yellow-400',
		badge: 'border-yellow-700/50 bg-yellow-950/60 text-yellow-300',
		ring: 'ring-yellow-500/60'
	},
	certified: {
		key: 'certified',
		label: 'certified shit',
		emoji: '💩',
		blurb: 'most people who bothered think this account is shit.',
		warning: 'heads up: the majority of voters flagged this account as shit. read with caution.',
		gifQuery: 'disgusted no thanks',
		bg: 'bg-[radial-gradient(ellipse_at_top,_rgba(180,83,9,0.30),_transparent_60%)] bg-neutral-950',
		accent: 'text-amber-400',
		badge: 'border-amber-700/60 bg-amber-950/60 text-amber-300',
		ring: 'ring-amber-500/70'
	},
	biohazard: {
		key: 'biohazard',
		label: 'biohazard',
		emoji: '☣️',
		blurb: 'this is not an account, this is a hazard zone.',
		warning: 'biohazard: almost everyone who voted thinks this account is shit. do not engage without protection.',
		gifQuery: 'dumpster fire',
		bg: 'bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.32),_transparent_60%)] bg-neutral-950',
		accent: 'text-red-400',
		badge: 'border-red-700/60 bg-red-950/60 text-red-300',
		ring: 'ring-red-500/80'
	}
};

export const MIN_VOTES_FOR_TIER = 3;

export function tierFor(shitScore: number, total: number): Tier {
	if (total < MIN_VOTES_FOR_TIER) return TIERS.unrated;
	if (shitScore >= 80) return TIERS.biohazard;
	if (shitScore >= 50) return TIERS.certified;
	if (shitScore >= 25) return TIERS.questionable;
	return TIERS.respected;
}

export interface Virality {
	score: number; // 0..100
	label: string;
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
	const label =
		score < 15 ? 'dead' : score < 35 ? 'simmering' : score < 55 ? 'spicy' : score < 75 ? 'volatile' : 'about to blow up';
	return { score, label, parts: { volume, heat, controversy, diversity } };
}
