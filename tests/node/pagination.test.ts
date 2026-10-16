import { describe, expect, test } from 'vitest';
import { pageItems } from '../../src/lib/utils/pagination.js';

describe('pageItems', () => {
	test('shows every page when they fit', () => {
		expect(pageItems(1, 1, 1)).toEqual([1]);
		expect(pageItems(3, 7, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		expect(pageItems(2, 5, 0)).toEqual([1, 2, 3, 4, 5]);
	});

	test('keeps the first and the last page and hides the others behind ellipses', () => {
		expect(pageItems(7, 24, 1)).toEqual([1, 'start-ellipsis', 6, 7, 8, 'end-ellipsis', 24]);
		expect(pageItems(1, 24, 1)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 24]);
		expect(pageItems(24, 24, 1)).toEqual([1, 'start-ellipsis', 20, 21, 22, 23, 24]);
	});

	test('shows the number instead of an ellipsis that would hide one page', () => {
		expect(pageItems(4, 24, 1)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 24]);
		expect(pageItems(21, 24, 1)).toEqual([1, 'start-ellipsis', 20, 21, 22, 23, 24]);
		expect(pageItems(5, 24, 1)).toEqual([1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', 24]);
	});

	test('always returns the same number of items while paging', () => {
		for (const siblings of [0, 1, 2, 3]) {
			const lengths = new Set(
				Array.from({ length: 40 }, (_, index) => pageItems(index + 1, 40, siblings).length)
			);
			expect(lengths).toEqual(new Set([2 * siblings + 5]));
		}
	});

	test('follows siblingCount', () => {
		expect(pageItems(10, 40, 0)).toEqual([1, 'start-ellipsis', 10, 'end-ellipsis', 40]);
		expect(pageItems(10, 40, 2)).toEqual([1, 'start-ellipsis', 8, 9, 10, 11, 12, 'end-ellipsis', 40]);
	});

	test('keeps the window at the end when the page is past the count', () => {
		expect(pageItems(30, 24, 1)).toEqual([1, 'start-ellipsis', 20, 21, 22, 23, 24]);
	});

	test('counts less than one page as one', () => {
		expect(pageItems(1, 0, 1)).toEqual([1]);
	});

	test('without a count shows the previous, the current and the next page', () => {
		expect(pageItems(1, undefined, 1)).toEqual([1, 2]);
		expect(pageItems(5, undefined, 1)).toEqual([4, 5, 6]);
	});
});
