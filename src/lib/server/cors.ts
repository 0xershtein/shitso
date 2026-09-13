/** CORS for the extension (chrome-extension:// origins) and our own hosts. Credentials allowed. */
export function corsHeaders(origin: string | null, extra: Record<string, string> = {}): Record<string, string> {
	const allowed =
		!!origin &&
		(origin.startsWith('chrome-extension://') ||
			origin.startsWith('moz-extension://') ||
			/^https:\/\/(shit\.so|shitso\.vercel\.app)$/.test(origin) ||
			origin.startsWith('http://localhost'));
	return {
		'access-control-allow-origin': allowed ? origin! : 'https://shit.so',
		'access-control-allow-credentials': 'true',
		'access-control-allow-methods': 'GET, POST, OPTIONS',
		'access-control-allow-headers': 'content-type',
		vary: 'origin',
		...extra
	};
}
