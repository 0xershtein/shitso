import type { DefaultSession } from '@auth/sveltekit';

declare module '@auth/sveltekit' {
	interface Session {
		user: {
			id: string;
			provider: string;
			handle: string | null;
		} & DefaultSession['user'];
	}
}

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
