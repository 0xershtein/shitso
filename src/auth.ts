import { SvelteKitAuth, type Profile } from '@auth/sveltekit';
import Twitter from '@auth/sveltekit/providers/twitter';
import { env } from '$env/dynamic/private';

interface XProfile extends Profile {
	data?: {
		id: string;
		username?: string;
		created_at?: string;
		public_metrics?: { followers_count?: number };
	};
}

const providers = [];
if (env.AUTH_TWITTER_ID && env.AUTH_TWITTER_SECRET) {
	providers.push(
		Twitter({
			clientId: env.AUTH_TWITTER_ID,
			clientSecret: env.AUTH_TWITTER_SECRET,
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
	callbacks: {
		jwt({ token, account, profile }) {
			if (account) {
				const p = profile as XProfile | undefined;
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
