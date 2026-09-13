import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const body = `User-agent: *
Allow: /
Disallow: /inspector
Disallow: /signin
Disallow: /signout
Disallow: /auth/
Disallow: /api/

Sitemap: ${url.origin}/sitemap.xml
`;
	return new Response(body, { headers: { 'content-type': 'text/plain', 'cache-control': 'public, max-age=3600' } });
};
