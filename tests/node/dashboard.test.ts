import { describe, expect, test } from 'vitest';
import {
	bottomOf,
	emptyAreas,
	fits,
	fittingSizes,
	hasHoles,
	nearestSize,
	newWidgetId,
	placeWidget,
	readingOrder,
	resizeWidget,
	stepSize,
	stepTarget
} from '../../src/lib/utils/dashboard/grid.js';
import type { DashboardWidget } from '../../src/lib/utils/dashboard/types.js';

const widget = (id: string, left: number, top: number, width: number, height: number): DashboardWidget => ({
	id,
	name: id,
	left,
	top,
	width,
	height
});

describe('dashboard grid', () => {
	test('bottomOf is the last row taken, 0 when empty', () => {
		expect(bottomOf([])).toBe(0);
		expect(bottomOf([widget('a', 1, 1, 2, 2), widget('b', 3, 2, 1, 3)])).toBe(4);
	});

	test('fits checks bounds and overlaps, ignoring the given ids', () => {
		const widgets = [widget('a', 1, 1, 2, 2)];
		expect(fits(widgets, { left: 3, top: 1, width: 2, height: 2 }, 4)).toBe(true);
		expect(fits(widgets, { left: 2, top: 2, width: 2, height: 1 }, 4)).toBe(false);
		expect(fits(widgets, { left: 4, top: 1, width: 2, height: 1 }, 4)).toBe(false);
		expect(fits(widgets, { left: 1, top: 3, width: 1, height: 2 }, 4, 3)).toBe(false);
		expect(fits(widgets, { left: 1, top: 3, width: 1, height: 2 }, 4)).toBe(true);
		expect(fits(widgets, { left: 2, top: 1, width: 2, height: 2 }, 4, undefined, ['a'])).toBe(true);
	});

	test('v4 bug: a size is offered only if every cell is free, not just its row and column', () => {
		const widgets = [widget('a', 1, 1, 1, 1), widget('b', 2, 2, 1, 1)];
		expect(fittingSizes(widgets, [{ width: 2, height: 2 }, { width: 1, height: 2 }], { left: 1, top: 2 }, 4)).toEqual([
			{ width: 1, height: 2 }
		]);
	});

	test('emptyAreas joins the free cells of a row and stacks equal runs of the following rows', () => {
		const widgets = [widget('a', 1, 1, 2, 1), widget('b', 4, 1, 1, 2)];
		expect(emptyAreas(widgets, 4, 4)).toEqual([
			{ left: 3, top: 1, width: 1, height: 1 },
			{ left: 1, top: 2, width: 3, height: 1 },
			{ left: 1, top: 3, width: 4, height: 2 }
		]);
		expect(emptyAreas([], 3, 0)).toEqual([]);
	});

	test('hasHoles looks only at the rows in use', () => {
		expect(hasHoles([], 4)).toBe(false);
		expect(hasHoles([widget('a', 1, 1, 4, 1)], 4)).toBe(false);
		expect(hasHoles([widget('a', 1, 1, 3, 1)], 4)).toBe(true);
		expect(hasHoles([widget('a', 1, 1, 4, 1), widget('b', 1, 2, 2, 1)], 4)).toBe(true);
	});

	test('nearestSize and stepSize pick among the allowed sizes', () => {
		const sizes = [
			{ width: 2, height: 2 },
			{ width: 4, height: 2 },
			{ width: 4, height: 4 }
		];
		expect(nearestSize(sizes, { width: 3, height: 3 })).toEqual({ width: 2, height: 2 });
		expect(nearestSize(sizes, { width: 4, height: 3 })).toEqual({ width: 4, height: 2 });
		expect(nearestSize([], { width: 1, height: 1 })).toBeUndefined();
		expect(stepSize(sizes, { width: 2, height: 2 }, 'right')).toEqual({ width: 4, height: 2 });
		expect(stepSize(sizes, { width: 4, height: 2 }, 'down')).toEqual({ width: 4, height: 4 });
		expect(stepSize(sizes, { width: 4, height: 4 }, 'left')).toEqual({ width: 2, height: 2 });
		expect(stepSize(sizes, { width: 2, height: 2 }, 'left')).toBeUndefined();
	});

	test('stepTarget moves to the next free place, jumps over others and swaps with a widget of the same size', () => {
		const a = widget('a', 1, 1, 1, 1);
		const b = widget('b', 2, 1, 2, 1);
		const c = widget('c', 4, 1, 1, 1);
		const widgets = [a, b, c];
		expect(stepTarget(widgets, a, 'down', 4, 2)).toEqual({ place: { left: 1, top: 2 } });
		expect(stepTarget(widgets, a, 'up', 4, 2)).toBeUndefined();
		expect(stepTarget(widgets, a, 'right', 4, 2)).toEqual({ place: { left: 4, top: 1 }, swap: c });
		expect(stepTarget(widgets, b, 'right', 4, 2)).toBeUndefined();
		expect(stepTarget(widgets, a, 'down', 4, 1)).toBeUndefined();
	});

	test('placeWidget moves one widget or swaps two; resizeWidget changes the size', () => {
		const a = widget('a', 1, 1, 1, 1);
		const b = widget('b', 3, 1, 1, 1);
		expect(placeWidget([a, b], 'a', { left: 2, top: 1 })).toEqual({
			widgets: [{ ...a, left: 2 }, b],
			changed: [{ ...a, left: 2 }]
		});
		const swapped = placeWidget([a, b], 'a', { left: 3, top: 1 }, b);
		expect(swapped.widgets).toEqual([{ ...a, left: 3 }, { ...b, left: 1 }]);
		expect(swapped.changed).toHaveLength(2);
		expect(placeWidget([a], 'x', { left: 2, top: 2 })).toEqual({ widgets: [a], changed: [] });
		expect(resizeWidget([a, b], 'b', { width: 2, height: 3 }).widgets[1]).toEqual({ ...b, width: 2, height: 3 });
	});

	test('readingOrder sorts by row, then column', () => {
		const order = readingOrder([widget('c', 1, 2, 1, 1), widget('b', 3, 1, 1, 1), widget('a', 1, 1, 1, 1)]);
		expect(order.map((w) => w.id)).toEqual(['a', 'b', 'c']);
	});

	test('newWidgetId gives different string ids', () => {
		const first = newWidgetId();
		expect(typeof first).toBe('string');
		expect(first).not.toBe(newWidgetId());
	});
});
