import { json } from '@sveltejs/kit';
import { normalizeHandle } from '$lib/emojis';
import { myVote } from '$lib/server/db/queries';
import { eligibility } from '$lib/eligibility';
import { exempt } from '$lib/server/vote';
import { t } from '$lib/i18n';
import {
	MAX_BYTES,
	deleteMine,
	issueNonce,
	moderate,
	publishBullshit,
	report,
	setWallHidden,
	verifyNonce
} from '$lib/server/bullshit';
import type { RequestHandler } from './$types';

const noStore = { 'cache-control': 'no-store' };

/** GET ?handle= → { nonce } for a fresh capture. */
export const GET: RequestHandler = async ({ url, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) return json({ error: 'signin' }, { status: 401, headers: noStore });
	const target = normalizeHandle(url.searchParams.get('handle') ?? '');
	if (!target) return json({ error: 'bad handle' }, { status: 400, headers: noStore });
	return json({ nonce: issueNonce(session.user.id, target) }, { headers: noStore });
};

/**
 * POST { handle, nonce, image } (image = data:image/jpeg;base64,...) → publish.
 * POST { handle, action: 'delete' } → remove own.
 * POST { handle, action: 'hide' | 'show' } → target owner toggles wall.
 * POST { action: 'report', id } → report one.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const L = locals.locale;
	const session = await locals.auth();
	if (!session?.user?.id) return json({ error: t(L, 'elig.signin') }, { status: 401, headers: noStore });
	let body: { handle?: string; nonce?: string; image?: string; action?: string; id?: number } = {};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'bad json' }, { status: 400, headers: noStore });
	}

	if (body.action === 'report') {
		const r = await report(Number(body.id), session.user.id);
		return json({ ok: r !== 'missing', result: r }, { status: r === 'missing' ? 404 : 200, headers: noStore });
	}

	const target = normalizeHandle(String(body.handle ?? ''));
	if (!target) return json({ error: 'bad handle' }, { status: 400, headers: noStore });

	if (body.action === 'delete') {
		return json({ ok: await deleteMine(session.user.id, target) }, { headers: noStore });
	}
	if (body.action === 'hide' || body.action === 'show') {
		if (session.user.handle !== target) return json({ error: 'not yours' }, { status: 403, headers: noStore });
		await setWallHidden(target, body.action === 'hide');
		return json({ ok: true }, { headers: noStore });
	}

	// publish
	if (session.user.handle === target) return json({ error: t(L, 'vote.self') }, { status: 400, headers: noStore });
	const elig = eligibility(session.user, exempt());
	if (!elig.ok) return json({ error: t(L, elig.key, elig.vars) }, { status: 403, headers: noStore });
	const mine = await myVote(session.user.id, target);
	if (!mine) return json({ error: t(L, 'bs.voteFirst') }, { status: 400, headers: noStore });
	if (!body.nonce || !verifyNonce(body.nonce, session.user.id, target))
		return json({ error: t(L, 'bs.expired') }, { status: 400, headers: noStore });

	const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image ?? ''));
	if (!m) return json({ error: 'bad image' }, { status: 400, headers: noStore });
	const jpeg = Buffer.from(m[1], 'base64');
	if (jpeg.length < 2000 || jpeg.length > MAX_BYTES || jpeg[0] !== 0xff || jpeg[1] !== 0xd8)
		return json({ error: 'bad image' }, { status: 400, headers: noStore });

	const verdict = await moderate(jpeg);
	if (!verdict.ok) return json({ error: t(L, `bs.reject.${verdict.reason}`), reason: verdict.reason }, { status: 422, headers: noStore });

	const url = await publishBullshit({
		voterId: session.user.id,
		voterHandle: session.user.handle,
		target,
		emoji: mine,
		jpeg
	});
	return json({ ok: true, url }, { headers: noStore });
};
