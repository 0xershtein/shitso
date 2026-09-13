import { env } from '$env/dynamic/private';
import type { Session } from '@auth/sveltekit';
import { EMOJI_KEYS } from '$lib/emojis';
import { eligibility } from '$lib/eligibility';
import { castVote, removeVote } from './db/queries';

// ELIGIBILITY_EXEMPT: comma-separated X handles that skip the follower/age rule.
export const exempt = () =>
	(env.ELIGIBILITY_EXEMPT ?? '')
		.split(',')
		.map((h) => h.trim().replace(/^@/, '').toLowerCase())
		.filter(Boolean);

export type VoteResult =
	| { ok: true }
	| { ok: false; status: number; key: string; vars?: Record<string, number> };

/** Shared by the profile form action and the extension API. `emoji` may be 'none' to remove. */
export async function submitVote(session: Session | null, target: string, emoji: string): Promise<VoteResult> {
	const user = session?.user;
	if (!user?.id) return { ok: false, status: 401, key: 'elig.signin' };
	if (user.handle === target) return { ok: false, status: 400, key: 'vote.self' };
	const elig = eligibility(user, exempt());
	if (!elig.ok) return { ok: false, status: 403, key: elig.key, vars: elig.vars };
	if (emoji === 'none') {
		await removeVote(user.id, user.handle, target);
		return { ok: true };
	}
	if (!EMOJI_KEYS.includes(emoji)) return { ok: false, status: 400, key: 'vote.unknown' };
	await castVote(user.id, user.handle, target, emoji);
	return { ok: true };
}
