// "The read": a small psychology layer on top of the ten emojis.
// Axes follow the Stereotype Content Model (warmth × competence) and the
// interpersonal circumplex (dominance). Pure functions, no I/O.

export type Axis = 'warmth' | 'competence' | 'dominance' | 'honesty';

// emoji key -> axis weights in [-1, 1]
const W: Record<string, Partial<Record<Axis, number>>> = {
	shit: { warmth: -1, competence: -1 },
	cap: { warmth: -1, honesty: -1 },
	clown: { competence: -1, dominance: 1 },
	snake: { warmth: -1, competence: 1, honesty: -1 },
	bot: { dominance: -1, honesty: -0.5 },
	brain: { competence: 1 },
	fire: { warmth: 1, dominance: 1 },
	goat: { competence: 1, dominance: 1 },
	respect: { warmth: 1, competence: 1 },
	gem: { warmth: 1, honesty: 1 }
};

export type Quadrant = 'admiration' | 'envy' | 'pity' | 'contempt';
export type Archetype =
	| 'wildcard'
	| 'grifter'
	| 'clown'
	| 'npc'
	| 'menace'
	| 'sage'
	| 'hype'
	| 'goat'
	| 'classact'
	| 'unread';

export interface Source {
	key: 'scm' | 'circumplex' | 'darktriad' | 'crowds' | 'disinhibition';
	url: string;
}

export const SOURCES: Record<Source['key'], string> = {
	scm: 'https://doi.org/10.1037/0022-3514.82.6.878',
	circumplex: 'https://doi.org/10.1037/0022-3514.37.3.395',
	darktriad: 'https://doi.org/10.1016/S0092-6566(02)00505-6',
	crowds: 'https://doi.org/10.1038/075450a0',
	disinhibition: 'https://doi.org/10.1089/1094931041291295'
};

const ARCHETYPE_SOURCE: Record<Archetype, Source['key']> = {
	wildcard: 'crowds',
	grifter: 'darktriad',
	clown: 'scm',
	npc: 'circumplex',
	menace: 'disinhibition',
	sage: 'scm',
	hype: 'circumplex',
	goat: 'scm',
	classact: 'scm',
	unread: 'crowds'
};

export interface Read {
	ready: boolean; // false until MIN votes
	axes: Record<Axis, number>; // -1..1
	quadrant: Quadrant | null;
	archetype: Archetype;
	evidence: { key: string; share: number }[]; // top emojis driving the label
	source: { key: Source['key']; url: string };
}

export const MIN_VOTES_FOR_READ = 1;

export function readFor(counts: Record<string, number>): Read {
	const total = Object.values(counts).reduce((a, b) => a + b, 0);
	const axes: Record<Axis, number> = { warmth: 0, competence: 0, dominance: 0, honesty: 0 };
	if (total === 0)
		return { ready: false, axes, quadrant: null, archetype: 'unread', evidence: [], source: src('unread') };

	for (const [key, n] of Object.entries(counts)) {
		for (const [axis, w] of Object.entries(W[key] ?? {})) axes[axis as Axis] += (w as number) * n;
	}
	for (const k of Object.keys(axes) as Axis[]) axes[k] = clamp(axes[k] / total);

	const share = (k: string) => (counts[k] ?? 0) / total;
	const bad = share('shit') + share('cap') + share('clown') + share('snake') + share('bot');
	const ready = total >= MIN_VOTES_FOR_READ;
	const quadrant: Quadrant | null = !ready
		? null
		: axes.warmth >= 0
			? axes.competence >= 0
				? 'admiration'
				: 'pity'
			: axes.competence >= 0
				? 'envy'
				: 'contempt';

	let archetype: Archetype = 'unread';
	if (ready) {
		if (total >= 6 && bad >= 0.4 && bad <= 0.6) archetype = 'wildcard';
		else if (share('cap') + share('snake') >= 0.35) archetype = 'grifter';
		else if (share('clown') >= 0.3) archetype = 'clown';
		else if (share('bot') >= 0.3) archetype = 'npc';
		else if (share('shit') >= 0.35) archetype = 'menace';
		else if (share('brain') >= 0.3) archetype = 'sage';
		else if (share('fire') >= 0.3) archetype = 'hype';
		else if (share('goat') >= 0.3) archetype = 'goat';
		else if (share('respect') + share('gem') >= 0.35) archetype = 'classact';
		else archetype = bad >= 0.5 ? 'menace' : 'classact';
	}

	const evidence = Object.entries(counts)
		.filter(([, n]) => n > 0)
		.map(([key, n]) => ({ key, share: n / total }))
		.sort((a, b) => b.share - a.share)
		.slice(0, 3);

	return { ready, axes, quadrant, archetype, evidence, source: src(archetype) };
}

function src(a: Archetype) {
	const key = ARCHETYPE_SOURCE[a];
	return { key, url: SOURCES[key] };
}
function clamp(x: number) {
	return Math.max(-1, Math.min(1, x));
}
