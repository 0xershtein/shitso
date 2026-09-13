import { SvelteKitAuth, type Profile } from '@auth/sveltekit';
import Twitter from '@auth/sveltekit/providers/twitter';
import Google from '@auth/sveltekit/providers/google';
import { env } from '$env/dynamic/private';

const providers = [];
if (env.AUTH_TWITTER_ID && env.AUTH_TWITTER_SECRET) {
	providers.push(Twitter({ clientId: env.AUTH_TWITTER_ID, clientSecret: env.AUTH_TWITTER_SECRET }));
}
if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
	providers.push(Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }));
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
				token.uid = `${account.provider}:${account.providerAccountId}`;
				token.provider = account.provider;
				token.handle = xHandle(account.provider, profile) ?? null;
			}
			return token;
		},
		session({ session, token }) {
			session.user.id = token.uid as string;
			session.user.provider = token.provider as string;
			session.user.handle = (token.handle as string | null) ?? null;
			return session;
		}
	}
});

function xHandle(provider: string, profile: Profile | undefined): string | undefined {
	if (provider !== 'twitter' || !profile) return undefined;
	const data = (profile as { data?: { username?: string } }).data;
	return data?.username?.toLowerCase();
}
