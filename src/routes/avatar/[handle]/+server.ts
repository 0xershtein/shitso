import { redirect } from '@sveltejs/kit';
import { normalizeHandle } from '$lib/emojis';
import { placeholderSvg, resolveAvatar } from '$lib/server/avatar';
import type { RequestHandler } from './$types';

/** /avatar/:handle → 302 to the stored image, or an inline SVG placeholder. */
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const handle = normalizeHandle(params.handle);
	const url = handle ? await resolveAvatar(handle) : null;
	if (url) {
		setHeaders({ 'cache-control': 'public, max-age=3600, s-maxage=86400' });
		redirect(302, url);
	}
	return new Response(placeholderSvg(handle ?? '?'), {
		headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=600' }
	});
};
