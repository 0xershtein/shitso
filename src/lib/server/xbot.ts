// @giveshit_bot — vote by tweet. "@giveshit_bot @target 💩" casts a vote from the tweet's author.
import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';
import { EMOJIS, normalizeHandle } from '$lib/emojis';
import { eligibility } from '$lib/eligibility';
import { exempt } from './vote';
import { castVote, tallyFor } from './db/queries';
import { forget } from './memo';
import { tierFor } from '$lib/tiers';
import { readFor } from '$lib/read';
import { t, type Locale } from '$lib/i18n';
import { rememberAvatar } from './avatar';

const API = 'https://api.x.com/2';

function redis(): Redis | null {
	const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
	const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
	return url && token ? new Redis({ url, token }) : null;
}

interface Tokens {
	access: string;
	refresh: string | null;
	exp: number; // ms epoch
}

/** Current tokens: Redis copy (refreshed) wins over the env seed. */
async function tokens(): Promise<Tokens | null> {
	const r = redis();
	const stored = r ? await r.get<Tokens>('xbot:tokens') : null;
	if (stored?.access) return stored;
	if (!env.X_BOT_ACCESS_TOKEN) return null;
	return { access: env.X_BOT_ACCESS_TOKEN, refresh: env.X_BOT_REFRESH_TOKEN ?? null, exp: Date.now() + 90 * 60_000 };
}

async function refresh(tk: Tokens): Promise<Tokens | null> {
	if (!tk.refresh || !env.X_BOT_CLIENT_ID) return null;
	const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tk.refresh, client_id: env.X_BOT_CLIENT_ID });
	const headers: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded' };
	if (env.X_BOT_CLIENT_SECRET) headers.authorization = `Basic ${Buffer.from(`${env.X_BOT_CLIENT_ID}:${env.X_BOT_CLIENT_SECRET}`).toString('base64')}`;
	const res = await fetch(`${API}/oauth2/token`, { method: 'POST', headers, body });
	if (!res.ok) {
		console.error('[xbot] refresh failed', res.status, await res.text().catch(() => ''));
		return null;
	}
	const j = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
	const next: Tokens = { access: j.access_token, refresh: j.refresh_token ?? tk.refresh, exp: Date.now() + (j.expires_in - 120) * 1000 };
	await redis()?.set('xbot:tokens', next);
	return next;
}

async function authed(): Promise<string | null> {
	let tk = await tokens();
	if (!tk) return null;
	if (Date.now() > tk.exp - 5 * 60_000) tk = (await refresh(tk)) ?? tk;
	return tk.access;
}

async function xfetch(path: string, init: RequestInit = {}) {
	const access = await authed();
	if (!access) throw new Error('bot not configured');
	const res = await fetch(`${API}${path}`, { ...init, headers: { ...(init.headers ?? {}), authorization: `Bearer ${access}` } });
	if (res.status === 401) {
		const tk = await tokens();
		const fresh = tk ? await refresh(tk) : null;
		if (fresh) return fetch(`${API}${path}`, { ...init, headers: { ...(init.headers ?? {}), authorization: `Bearer ${fresh.access}` } });
	}
	return res;
}

async function botId(): Promise<{ id: string; username: string }> {
	const r = redis();
	const cached = r ? await r.get<{ id: string; username: string }>('xbot:me') : null;
	if (cached) return cached;
	const res = await xfetch('/users/me');
	if (!res.ok) throw new Error(`users/me ${res.status}`);
	const j = (await res.json()) as { data: { id: string; username: string } };
	await r?.set('xbot:me', j.data, { ex: 3600 }); // handle can be renamed; re-read hourly
	return j.data;
}

interface Mention {
	id: string;
	text: string;
	author_id: string;
	created_at?: string;
	lang?: string;
	entities?: { mentions?: { username: string; id: string }[] };
}
interface XUser {
	id: string;
	username: string;
	created_at?: string;
	profile_image_url?: string;
	public_metrics?: { followers_count?: number };
}

const EMOJI_BY_CHAR = new Map(EMOJIS.map((e) => [e.char, e.key]));
// 🫡 and ☣️ carry variation selectors in some clients; normalize by stripping FE0F.
const strip = (s: string) => s.replace(/️/g, '');

function parse(m: Mention, botId: string): { target: string | null; emoji: string | null } {
	// exclude the bot by id, so a renamed bot account never becomes its own target
	const others = (m.entities?.mentions ?? []).filter((x) => x.id !== botId).map((x) => x.username.toLowerCase());
	const target = others.length ? normalizeHandle(others[0]) : null;
	let emoji: string | null = null;
	const text = strip(m.text);
	for (const [char, key] of EMOJI_BY_CHAR) {
		if (text.includes(strip(char))) {
			emoji = key;
			break;
		}
	}
	return { target, emoji };
}

function replyText(L: Locale, target: string, counts: Record<string, number>, total: number, shitScore: number): string {
	const tier = tierFor(shitScore, total);
	const read = readFor(counts);
	const label = t(L, `tier.${tier.key}.label`);
	const arch = read.ready ? t(L, `read.a.${read.archetype}`) : null;
	const votes = t(L, total === 1 ? 'profile.vote' : 'profile.votes');
	const early = total < 3 ? ` · ${t(L, 'tier.early')}` : '';
	return `@${target} ${shitScore}% shit · ${tier.emoji} ${label}${arch ? ` · ${arch}` : ''} · ${total} ${votes}${early}\nhttps://shit.so/@${target}`;
}

export interface RunResult {
	seen: number;
	voted: number;
	replied: number;
	skipped: string[];
}

/** One polling pass: read new mentions, cast votes, reply. */
export async function runOnce(): Promise<RunResult> {
	const r = redis();
	const me = await botId();
	const since = r ? await r.get<string>('xbot:since') : null;
	// First run ever: only remember the newest id, never replay the account's history.
	if (!since) {
		const boot = await xfetch(`/users/${me.id}/mentions?max_results=5`);
		const bj = boot.ok ? ((await boot.json()) as { meta?: { newest_id?: string } }) : {};
		await r?.set('xbot:since', bj.meta?.newest_id ?? '1');
		return { seen: 0, voted: 0, replied: 0, skipped: ['bootstrap'] };
	}
	const q = new URLSearchParams({
		max_results: '50',
		'tweet.fields': 'author_id,entities,lang,created_at',
		expansions: 'author_id',
		'user.fields': 'username,public_metrics,created_at,profile_image_url'
	});
	if (since) q.set('since_id', since);
	const res = await xfetch(`/users/${me.id}/mentions?${q}`);
	if (!res.ok) throw new Error(`mentions ${res.status} ${await res.text().catch(() => '')}`);
	const j = (await res.json()) as { data?: Mention[]; includes?: { users?: XUser[] }; meta?: { newest_id?: string } };
	const out: RunResult = { seen: j.data?.length ?? 0, voted: 0, replied: 0, skipped: [] };
	if (!j.data?.length) return out;
	const users = new Map((j.includes?.users ?? []).map((u) => [u.id, u]));
	const exemptList = exempt();

	// oldest first so replies land in order
	const MAX_AGE_MS = 30 * 60_000; // never act on anything older than 30 minutes
	for (const m of [...j.data].reverse()) {
		if (r && (await r.get(`xbot:done:${m.id}`))) continue;
		if (m.created_at && Date.now() - new Date(m.created_at).getTime() > MAX_AGE_MS) {
			out.skipped.push(`${m.id}:too-old`);
			continue;
		}
		const author = users.get(m.author_id);
		const { target, emoji } = parse(m, me.id);
		const L: Locale = m.lang === 'tr' ? 'tr' : 'en';
		let reply: string | null = null;
		if (!author || !target) {
			out.skipped.push(`${m.id}:no-target`);
		} else if (target === author.username.toLowerCase()) {
			reply = `@${author.username} ${t(L, 'vote.self')}`;
		} else if (emoji) {
			const elig = eligibility(
				{ provider: 'twitter', handle: author.username.toLowerCase(), followers: author.public_metrics?.followers_count ?? null, accountCreatedAt: author.created_at ?? null },
				exemptList
			);
			if (!elig.ok) {
				reply = `@${author.username} ${t(L, elig.key, elig.vars)}`;
			} else {
				await castVote(`twitter:${author.id}`, author.username.toLowerCase(), target, emoji);
				forget(`p:${target}:`);
				forget('home:');
				await rememberAvatar(author.username.toLowerCase(), author.profile_image_url).catch(() => {});
				out.voted++;
				const tally = await tallyFor(target);
				reply = replyText(L, target, tally.counts, tally.total, tally.shitScore);
			}
		} else {
			// summon without an emoji: just the card
			const tally = await tallyFor(target);
			reply = tally.total ? replyText(L, target, tally.counts, tally.total, tally.shitScore) : `@${target} ${t(L, 'profile.nobody')} https://shit.so/@${target}`;
		}
		if (reply) {
			const pr = await xfetch('/tweets', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ text: reply, reply: { in_reply_to_tweet_id: m.id } })
			});
			if (pr.ok) out.replied++;
			else out.skipped.push(`${m.id}:reply-${pr.status}`);
		}
		await r?.set(`xbot:done:${m.id}`, 1, { ex: 60 * 60 * 24 * 7 });
	}
	if (j.meta?.newest_id) await r?.set('xbot:since', j.meta.newest_id);
	return out;
}
