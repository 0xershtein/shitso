import { SvelteKitAuth, type Profile } from '@auth/sveltekit';
import Twitter from '@auth/sveltekit/providers/twitter';
import { env } from '$env/dynamic/private';
import { rememberFromLogin } from '$lib/server/profiles';
import { rememberAvatar } from '$lib/server/avatar';

interface XProfile extends Profile {
	data?: {
		id: string;
		name?: string;
		username?: string;
		profile_image_url?: string;
		created_at?: string;
		public_metrics?: { followers_count?: number; following_count?: number };
	};
}

const providers = [];
if (env.AUTH_TWITTER_ID && env.AUTH_TWITTER_SECRET) {
	providers.push(
		Twitter({
			clientId: env.AUTH_TWITTER_ID,
			clientSecret: env.AUTH_TWITTER_SECRET,
			// Read-only. No tweet.write, no offline.access: we only need one users/me call at login,
			// so the consent screen should not say "stay connected until you revoke access".
			authorization: 'https://x.com/i/oauth2/authorize?scope=users.read tweet.read',
			// Pull follower count + account age in the same call Auth.js already makes.
			userinfo: {
				url: 'https://api.x.com/2/users/me?user.fields=profile_image_url,public_metrics,created_at'
			}
		})
	);
}

export const enabledProviders = providers.map((p) => p.id);

export const { handle, signIn, signOut } = SvelteKitAuth({
	trustHost: true,
	secret: env.AUTH_SECRET,
	providers,
	session: { strategy: 'jwt' },
	pages: { signIn: '/signin', error: '/auth/error' },
	callbacks: {
		async jwt({ token, account, profile }) {
			if (account) {
				const p = profile as XProfile | undefined;
				// Free profile facts: X already returns them with the login. Persist for everyone.
				if (account.provider === 'twitter' && p?.data?.username) {
					await rememberFromLogin({
						handle: p.data.username.toLowerCase(),
						name: p.data.name ?? null,
						followers: p.data.public_metrics?.followers_count ?? null,
						following: p.data.public_metrics?.following_count ?? null
					}).catch((e) => console.error('[auth] profile upsert failed', e));
					await rememberAvatar(p.data.username.toLowerCase(), p.data.profile_image_url).catch(() => {});
				}
				token.uid = `${account.provider}:${account.providerAccountId}`;
				token.provider = account.provider;
				token.handle = p?.data?.username?.toLowerCase() ?? null;
				token.followers = p?.data?.public_metrics?.followers_count ?? null;
				token.accountCreatedAt = p?.data?.created_at ?? null;
			}
			return token;
		},
		session({ session, token }) {
			session.user.id = token.uid as string;
			session.user.provider = token.provider as string;
			session.user.handle = (token.handle as string | null) ?? null;
			session.user.followers = (token.followers as number | null) ?? null;
			session.user.accountCreatedAt = (token.accountCreatedAt as string | null) ?? null;
			return session;
		}
	}
});
