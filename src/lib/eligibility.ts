export const MIN_FOLLOWERS = 10;
export const MIN_ACCOUNT_AGE_DAYS = 7;

export interface VoterFacts {
	provider: string;
	followers: number | null;
	accountCreatedAt: string | null; // ISO
}

export type Eligibility = { ok: true } | { ok: false; reason: string };

export function eligibility(u: VoterFacts | null | undefined): Eligibility {
	if (!u) return { ok: false, reason: 'sign in with X first.' };
	if (u.provider !== 'twitter') return { ok: false, reason: 'only X accounts can give a shit.' };
	if (u.followers === null || u.accountCreatedAt === null)
		return { ok: false, reason: 'could not read your X profile. sign out and back in.' };
	const ageDays = (Date.now() - new Date(u.accountCreatedAt).getTime()) / 86400000;
	if (u.followers < MIN_FOLLOWERS)
		return { ok: false, reason: `you need ${MIN_FOLLOWERS}+ followers to give a shit. bots stay quiet.` };
	if (ageDays < MIN_ACCOUNT_AGE_DAYS)
		return { ok: false, reason: `your X account needs to be ${MIN_ACCOUNT_AGE_DAYS}+ days old. come back soon.` };
	return { ok: true };
}
