import type { DashboardCatalogEntry } from './types.js';

function fold(text: string) {
	return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
}

export function matchesSearch(entry: DashboardCatalogEntry, search: string) {
	const words = fold(search).split(/\s+/).filter(Boolean);
	if (!words.length) return true;
	const text = fold(`${entry.item.title} ${entry.item.description ?? ''}`);
	return words.every((word) => text.includes(word));
}

export function catalogCategories(entries: DashboardCatalogEntry[]) {
	return [...new Set(entries.flatMap((entry) => (entry.item.category ? [entry.item.category] : [])))];
}

export function filterCatalog<Entry extends DashboardCatalogEntry>(
	entries: Entry[],
	search: string,
	categories: string[]
) {
	const found = entries.filter((entry) => matchesSearch(entry, search));
	const counts = new Map<string, number>();
	for (const entry of found) {
		const category = entry.item.category;
		if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
	}
	const shown = categories.length
		? found.filter((entry) => !!entry.item.category && categories.includes(entry.item.category))
		: found;
	return { shown, counts };
}
