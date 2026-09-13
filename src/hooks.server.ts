import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handle as auth } from './auth';
import { isLocale, pickLocale } from '$lib/i18n';

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

export const handle = sequence(locale, auth);
