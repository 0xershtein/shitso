import { env } from '$env/dynamic/private';
import type { Session } from '@auth/sveltekit';

// ADMIN_HANDLES: comma-separated X handles allowed into /inspector.
export function isAdmin(session: Session | null): boolean {
	const h = session?.user?.handle;
	if (!h) return false;
	return (env.ADMIN_HANDLES ?? '')
		.split(',')
		.map((x) => x.trim().replace(/^@/, '').toLowerCase())
		.filter(Boolean)
		.includes(h);
}
