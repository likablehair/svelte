export const AVATAR_COLORS = 6;

export function initials(name: string | undefined, locale?: string): string {
	const letters = (name ?? '')
		.split(/\s+/)
		.map((word) => word.match(/[\p{L}\p{N}]/u)?.[0])
		.filter((letter): letter is string => !!letter);
	if (letters.length === 0) return '';
	const picked = letters.length === 1 ? letters[0] : letters[0] + letters[letters.length - 1];
	return picked.toLocaleUpperCase(locale);
}

export function colorIndex(seed: string | number): number {
	const text = String(seed).trim().toLowerCase();
	let hash = 2166136261;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return ((hash >>> 0) % AVATAR_COLORS) + 1;
}
