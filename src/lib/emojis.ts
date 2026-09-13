export type Tone = 'bad' | 'good';

export interface Emoji {
	key: string;
	char: string;
	label: string;
	tone: Tone;
}

// The ten fixed reactions. Order matters: bad ones first, good ones last.
export const EMOJIS: Emoji[] = [
	{ key: 'shit', char: '💩', label: 'shit', tone: 'bad' },
	{ key: 'cap', char: '🧢', label: 'cap', tone: 'bad' },
	{ key: 'clown', char: '🤡', label: 'clown', tone: 'bad' },
	{ key: 'snake', char: '🐍', label: 'snake', tone: 'bad' },
	{ key: 'bot', char: '🤖', label: 'bot', tone: 'bad' },
	{ key: 'brain', char: '🧠', label: 'big brain', tone: 'good' },
	{ key: 'fire', char: '🔥', label: 'fire', tone: 'good' },
	{ key: 'goat', char: '🐐', label: 'goat', tone: 'good' },
	{ key: 'respect', char: '🫡', label: 'respect', tone: 'good' },
	{ key: 'gem', char: '💎', label: 'gem', tone: 'good' }
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
