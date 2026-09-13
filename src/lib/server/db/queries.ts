import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index';
import { votes } from './schema';
import { BAD_KEYS, EMOJIS } from '$lib/emojis';

export interface Tally {
	target: string;
	total: number;
	bad: number;
	shitScore: number; // 0..100, share of bad votes
	counts: Record<string, number>; // emoji key -> count
	top: string | null; // most given emoji key
}

const badList = sql.join(
	BAD_KEYS.map((k) => sql`${k}`),
	sql`, `
);

export async function tallyFor(target: string): Promise<Tally> {
	const rows = await db
		.select({ emoji: votes.emoji, n: sql<number>`count(*)::int` })
		.from(votes)
		.where(eq(votes.target, target))
		.groupBy(votes.emoji);

	const counts: Record<string, number> = Object.fromEntries(EMOJIS.map((e) => [e.key, 0]));
	let total = 0;
	let bad = 0;
	let top: string | null = null;
	let topN = 0;
	for (const r of rows) {
		counts[r.emoji] = r.n;
		total += r.n;
		if (BAD_KEYS.includes(r.emoji)) bad += r.n;
		if (r.n > topN) {
			topN = r.n;
			top = r.emoji;
		}
	}
	return { target, total, bad, shitScore: total ? Math.round((bad / total) * 100) : 0, counts, top };
}

export async function myVote(voterId: string, target: string): Promise<string | null> {
	const [row] = await db
		.select({ emoji: votes.emoji })
		.from(votes)
		.where(and(eq(votes.voterId, voterId), eq(votes.target, target)))
		.limit(1);
	return row?.emoji ?? null;
}

export async function castVote(
	voterId: string,
	voterHandle: string | null,
	target: string,
	emoji: string
) {
	await db
		.insert(votes)
		.values({ voterId, voterHandle, target, emoji })
		.onConflictDoUpdate({
			target: [votes.voterId, votes.target],
			set: { emoji, voterHandle, updatedAt: sql`now()` }
		});
}

export async function removeVote(voterId: string, target: string) {
	await db.delete(votes).where(and(eq(votes.voterId, voterId), eq(votes.target, target)));
}

export interface BoardRow {
	target: string;
	total: number;
	bad: number;
	shitScore: number;
}

export async function leaderboard(kind: 'shit' | 'goat', limit = 10): Promise<BoardRow[]> {
	const badCount = sql<number>`sum(case when ${votes.emoji} in (${badList}) then 1 else 0 end)::int`;
	const total = sql<number>`count(*)::int`;
	const rows = await db
		.select({ target: votes.target, total, bad: badCount })
		.from(votes)
		.groupBy(votes.target)
		.orderBy(kind === 'shit' ? desc(badCount) : desc(sql`count(*) - ${badCount}`), desc(total))
		.limit(limit);
	return rows.map((r) => ({
		...r,
		shitScore: r.total ? Math.round((r.bad / r.total) * 100) : 0
	}));
}

export async function totals() {
	const [row] = await db
		.select({
			votes: sql<number>`count(*)::int`,
			targets: sql<number>`count(distinct ${votes.target})::int`
		})
		.from(votes);
	return row ?? { votes: 0, targets: 0 };
}
