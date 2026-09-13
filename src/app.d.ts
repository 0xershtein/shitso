import type { DefaultSession } from '@auth/sveltekit';

declare module '@auth/sveltekit' {
	interface Session {
		user: {
			id: string;
			provider: string;
			handle: string | null;
			followers: number | null;
			accountCreatedAt: string | null;
		} & DefaultSession['user'];
	}
}

declare global {
	namespace App {
		interface Locals {
			locale: import('$lib/i18n').Locale;
		}
	}
}

export {};
