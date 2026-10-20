export type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

function range(from: number, to: number): number[] {
	return Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);
}

export function pageItems(page: number, pageCount: number | undefined, siblingCount: number): PageItem[] {
	if (pageCount === undefined) return page > 1 ? [page - 1, page, page + 1] : [page, page + 1];
	const count = Math.max(1, Math.floor(pageCount));
	const siblings = Math.max(0, Math.floor(siblingCount));
	if (count <= 2 * siblings + 5) return range(1, count);
	const start = Math.max(Math.min(page - siblings, count - 2 * siblings - 2), 3);
	const end = Math.min(Math.max(page + siblings, 2 * siblings + 3), count - 2);
	return [
		1,
		start > 3 ? 'start-ellipsis' : 2,
		...range(start, end),
		end < count - 2 ? 'end-ellipsis' : count - 1,
		count
	];
}
