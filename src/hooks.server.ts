import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handle as auth } from './auth';
import { isLocale, pickLocale } from '$lib/i18n';
import { env } from '$env/dynamic/private';

// CANONICAL_HOST (e.g. shit.so): send page traffic from other hosts there. API stays
// reachable everywhere so installed extensions keep working.
const canonical: Handle = async ({ event, resolve }) => {
	const want = env.CANONICAL_HOST;
	const host = event.url.hostname;
	if (want && host !== want && host !== 'localhost' && !event.url.pathname.startsWith('/api/') && !event.url.pathname.startsWith('/auth/')) {
		redirect(301, `https://${want}${event.url.pathname}${event.url.search}`);
	}
	return resolve(event);
};

const locale: Handle = async ({ event, resolve }) => {
	const wanted = event.url.searchParams.get('lang');
	if (isLocale(wanted)) {
		event.cookies.set('lang', wanted, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
		const u = new URL(event.url);
		u.searchParams.delete('lang');
		redirect(303, u.pathname + u.search);
	}
	event.locals.locale = pickLocale(event.cookies.get('lang'), event.request.headers.get('accept-language'));
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('<html lang="en">', `<html lang="${event.locals.locale}">`)
	});
};

export const handle = sequence(canonical, locale, auth);
