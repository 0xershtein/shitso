export type Tone = 'bad' | 'good';

export interface Emoji {
	key: string;
	char: string;
	tone: Tone; // label lives in i18n under emoji.<key>
}

// The ten fixed reactions. Order matters: bad ones first, good ones last.
export const EMOJIS: Emoji[] = [
	{ key: 'shit', char: '💩', tone: 'bad' },
	{ key: 'cap', char: '🧢', tone: 'bad' },
	{ key: 'clown', char: '🤡', tone: 'bad' },
	{ key: 'snake', char: '🐍', tone: 'bad' },
	{ key: 'bot', char: '🤖', tone: 'bad' },
	{ key: 'brain', char: '🧠', tone: 'good' },
	{ key: 'fire', char: '🔥', tone: 'good' },
	{ key: 'goat', char: '🐐', tone: 'good' },
	{ key: 'respect', char: '🫡', tone: 'good' },
	{ key: 'gem', char: '💎', tone: 'good' }
];

export const EMOJI_KEYS = EMOJIS.map((e) => e.key);
export const BAD_KEYS = EMOJIS.filter((e) => e.tone === 'bad').map((e) => e.key);

export function emojiByKey(key: string): Emoji | undefined {
	return EMOJIS.find((e) => e.key === key);
}

export const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

export function normalizeHandle(raw: string): string | null {
	const h = raw.trim().replace(/^@/, '').toLowerCase();
	return HANDLE_RE.test(h) ? h : null;
}
