import { and, desc, eq, gte, ne, sql } from 'drizzle-orm';
import { db } from './index';
import { voteEvents, votes } from './schema';
import { BAD_KEYS, EMOJIS } from '$lib/emojis';

export interface Tally {
	target: string;
	total: number;
	bad: number;
	shitScore: number; // 0..100, share of bad votes
	counts: Record<string, number>; // emoji key -> count
	top: string | null; // most given emoji key
	distinctEmojis: number;
}

const badList = sql.join(
	BAD_KEYS.map((k) => sql`${k}`),
	sql`, `
);
const badCase = sql<number>`sum(case when ${votes.emoji} in (${badList}) then 1 else 0 end)::int`;

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
	return {
		target,
		total,
		bad,
		shitScore: total ? Math.round((bad / total) * 100) : 0,
		counts,
		top,
		distinctEmojis: rows.filter((r) => r.n > 0).length
	};
}

export async function myVote(voterId: string, target: string): Promise<string | null> {
	const [row] = await db
		.select({ emoji: votes.emoji })
		.from(votes)
		.where(and(eq(votes.voterId, voterId), eq(votes.target, target)))
		.limit(1);
	return row?.emoji ?? null;
}

export const VOTE_COOLDOWN_SECONDS = 10;

/** True when the voter touched this target within the cooldown window. */
export async function onCooldown(voterId: string, target: string): Promise<boolean> {
	const [row] = await db
		.select({ n: sql<number>`count(*)::int` })
		.from(voteEvents)
		.where(
			and(
				eq(voteEvents.voterId, voterId),
				eq(voteEvents.target, target),
				gte(voteEvents.createdAt, sql`now() - ${sql.raw(`interval '${VOTE_COOLDOWN_SECONDS} seconds'`)}`)
			)
		);
	return (row?.n ?? 0) > 0;
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
	await db.insert(voteEvents).values({ voterId, voterHandle, target, emoji });
}

export async function removeVote(voterId: string, voterHandle: string | null, target: string) {
	await db.delete(votes).where(and(eq(votes.voterId, voterId), eq(votes.target, target)));
	await db.insert(voteEvents).values({ voterId, voterHandle, target, emoji: 'none' });
}

export interface BoardRow {
	target: string;
	total: number;
	bad: number;
	shitScore: number;
}

function withScore<T extends { total: number; bad: number }>(r: T) {
	return { ...r, shitScore: r.total ? Math.round((r.bad / r.total) * 100) : 0 };
}

export async function leaderboard(kind: 'shit' | 'goat', limit = 10): Promise<BoardRow[]> {
	const total = sql<number>`count(*)::int`;
	const rows = await db
		.select({ target: votes.target, total, bad: badCase })
		.from(votes)
		.groupBy(votes.target)
		.orderBy(kind === 'shit' ? desc(badCase) : desc(sql`count(*) - ${badCase}`), desc(total))
		.limit(limit);
	return rows.map(withScore);
}

/** Targets with the most activity in the last 24h, with their current tally. */
export async function trending(limit = 10): Promise<(BoardRow & { last24h: number })[]> {
	const since = sql`now() - interval '24 hours'`;
	const hot = await db
		.select({ target: voteEvents.target, last24h: sql<number>`count(*)::int` })
		.from(voteEvents)
		.where(and(gte(voteEvents.createdAt, since), ne(voteEvents.emoji, 'none')))
		.groupBy(voteEvents.target)
		.orderBy(desc(sql`count(*)`))
		.limit(limit);
	if (hot.length === 0) return [];
	const out = [];
	for (const h of hot) {
		const [t] = await db
			.select({ total: sql<number>`count(*)::int`, bad: badCase })
			.from(votes)
			.where(eq(votes.target, h.target));
		out.push(withScore({ target: h.target, last24h: h.last24h, total: t?.total ?? 0, bad: t?.bad ?? 0 }));
	}
	return out;
}

export interface FeedRow {
	voterHandle: string | null;
	target: string;
	emoji: string;
	at: Date;
}

export async function recentFeed(limit = 12): Promise<FeedRow[]> {
	return db
		.select({
			voterHandle: voteEvents.voterHandle,
			target: voteEvents.target,
			emoji: voteEvents.emoji,
			at: voteEvents.createdAt
		})
		.from(voteEvents)
		.where(ne(voteEvents.emoji, 'none'))
		.orderBy(desc(voteEvents.createdAt))
		.limit(limit);
}

export interface Stats {
	voters: number; // distinct people currently holding a vote
	changes: number; // total events incl. changes/removals
	firstAt: Date | null;
	lastAt: Date | null;
	last24h: number;
	prev24h: number;
	last7d: number;
	prev7d: number;
}

export async function statsFor(target: string): Promise<Stats> {
	const [cur] = await db
		.select({ voters: sql<number>`count(*)::int` })
		.from(votes)
		.where(eq(votes.target, target));
	const [ev] = await db
		.select({
			changes: sql<number>`count(*)::int`,
			firstAt: sql<Date | null>`min(${voteEvents.createdAt})`,
			lastAt: sql<Date | null>`max(${voteEvents.createdAt})`,
			last24h: sql<number>`sum(case when ${voteEvents.createdAt} >= now() - interval '24 hours' and ${voteEvents.emoji} <> 'none' then 1 else 0 end)::int`,
			prev24h: sql<number>`sum(case when ${voteEvents.createdAt} >= now() - interval '48 hours' and ${voteEvents.createdAt} < now() - interval '24 hours' and ${voteEvents.emoji} <> 'none' then 1 else 0 end)::int`,
			last7d: sql<number>`sum(case when ${voteEvents.createdAt} >= now() - interval '7 days' and ${voteEvents.emoji} <> 'none' then 1 else 0 end)::int`,
			prev7d: sql<number>`sum(case when ${voteEvents.createdAt} >= now() - interval '14 days' and ${voteEvents.createdAt} < now() - interval '7 days' and ${voteEvents.emoji} <> 'none' then 1 else 0 end)::int`
		})
		.from(voteEvents)
		.where(eq(voteEvents.target, target));
	return {
		voters: cur?.voters ?? 0,
		changes: ev?.changes ?? 0,
		firstAt: ev?.firstAt ? new Date(ev.firstAt) : null,
		lastAt: ev?.lastAt ? new Date(ev.lastAt) : null,
		last24h: ev?.last24h ?? 0,
		prev24h: ev?.prev24h ?? 0,
		last7d: ev?.last7d ?? 0,
		prev7d: ev?.prev7d ?? 0
	};
}

export interface RhythmDay {
	day: string; // YYYY-MM-DD
	bad: number;
	good: number;
}

/** Votes per day for the last N days (bad vs good), oldest first, zero-filled. */
export async function rhythmFor(target: string, days = 14): Promise<RhythmDay[]> {
	const rows = await db
		.select({
			day: sql<string>`to_char(date_trunc('day', ${voteEvents.createdAt}), 'YYYY-MM-DD')`,
			bad: sql<number>`sum(case when ${voteEvents.emoji} in (${badList}) then 1 else 0 end)::int`,
			good: sql<number>`sum(case when ${voteEvents.emoji} not in (${badList}) and ${voteEvents.emoji} <> 'none' then 1 else 0 end)::int`
		})
		.from(voteEvents)
		.where(and(eq(voteEvents.target, target), gte(voteEvents.createdAt, sql`now() - ${sql.raw(`interval '${days} days'`)}`)))
		.groupBy(sql`1`);
	const byDay = new Map(rows.map((r) => [r.day, r]));
	const out: RhythmDay[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date();
		d.setUTCDate(d.getUTCDate() - i);
		const key = d.toISOString().slice(0, 10);
		const r = byDay.get(key);
		out.push({ day: key, bad: r?.bad ?? 0, good: r?.good ?? 0 });
	}
	return out;
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
