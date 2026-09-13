export const MIN_FOLLOWERS = 10;
export const MIN_ACCOUNT_AGE_DAYS = 7;

export interface VoterFacts {
	provider: string;
	handle: string | null;
	followers: number | null;
	accountCreatedAt: string | null; // ISO
}

/** `key` is an i18n key under elig.*; `vars` fill its placeholders. */
export type Eligibility = { ok: true } | { ok: false; key: string; vars: Record<string, number> };

/**
 * @param exempt lowercased X handles that skip the follower/age checks
 *   (the founder's own fresh account, invited testers). Read from ELIGIBILITY_EXEMPT.
 */
export function eligibility(u: VoterFacts | null | undefined, exempt: string[] = []): Eligibility {
	if (!u) return { ok: false, key: 'elig.signin', vars: {} };
	if (u.provider !== 'twitter') return { ok: false, key: 'elig.xOnly', vars: {} };
	if (u.handle && exempt.includes(u.handle)) return { ok: true };
	if (u.followers === null || u.accountCreatedAt === null) return { ok: false, key: 'elig.noProfile', vars: {} };
	const ageDays = (Date.now() - new Date(u.accountCreatedAt).getTime()) / 86400000;
	if (u.followers < MIN_FOLLOWERS) return { ok: false, key: 'elig.followers', vars: { f: MIN_FOLLOWERS } };
	if (ageDays < MIN_ACCOUNT_AGE_DAYS) return { ok: false, key: 'elig.age', vars: { d: MIN_ACCOUNT_AGE_DAYS } };
	return { ok: true };
}
