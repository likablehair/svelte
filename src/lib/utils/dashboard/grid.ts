import type { DashboardWidget, DashboardWidgetSize } from './types.js';

export type Area = { left: number; top: number; width: number; height: number };
export type Place = { left: number; top: number };
export type Direction = 'left' | 'right' | 'up' | 'down';
type Id = string | number;

const STEPS: Record<Direction, Place> = {
	left: { left: -1, top: 0 },
	right: { left: 1, top: 0 },
	up: { left: 0, top: -1 },
	down: { left: 0, top: 1 }
};

export function bottomOf(areas: Area[]): number {
	return areas.reduce((bottom, area) => Math.max(bottom, area.top + area.height - 1), 0);
}

export function overlaps(a: Area, b: Area): boolean {
	return (
		a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height
	);
}

export function inBounds(area: Area, columns: number, rows?: number): boolean {
	return (
		area.left >= 1 &&
		area.top >= 1 &&
		area.width >= 1 &&
		area.height >= 1 &&
		area.left + area.width - 1 <= columns &&
		(rows === undefined || area.top + area.height - 1 <= rows)
	);
}

export function fits(
	widgets: DashboardWidget<any, any>[],
	area: Area,
	columns: number,
	rows?: number,
	ignore: Id[] = []
): boolean {
	return (
		inBounds(area, columns, rows) && !widgets.some((widget) => !ignore.includes(widget.id) && overlaps(widget, area))
	);
}

function occupancy(widgets: Area[], columns: number, rows: number): boolean[][] {
	const grid = Array.from({ length: rows }, () => Array<boolean>(columns).fill(false));
	for (const widget of widgets) {
		for (let row = widget.top; row < widget.top + widget.height && row <= rows; row++) {
			for (let column = widget.left; column < widget.left + widget.width && column <= columns; column++) {
				if (row >= 1 && column >= 1) grid[row - 1][column - 1] = true;
			}
		}
	}
	return grid;
}

export function emptyAreas(widgets: Area[], columns: number, rows: number): Area[] {
	const grid = occupancy(widgets, columns, rows);
	const areas: Area[] = [];
	let open = new Map<string, Area>();
	for (let row = 1; row <= rows; row++) {
		const next = new Map<string, Area>();
		let column = 1;
		while (column <= columns) {
			if (grid[row - 1][column - 1]) {
				column++;
				continue;
			}
			const start = column;
			while (column <= columns && !grid[row - 1][column - 1]) column++;
			const key = `${start}:${column - start}`;
			const above = open.get(key);
			if (above) {
				above.height++;
				next.set(key, above);
			} else {
				const area = { left: start, top: row, width: column - start, height: 1 };
				areas.push(area);
				next.set(key, area);
			}
		}
		open = next;
	}
	return areas;
}

export function hasHoles(widgets: Area[], columns: number): boolean {
	const rows = bottomOf(widgets);
	return occupancy(widgets, columns, rows).some((row) => row.some((taken) => !taken));
}

export function fittingSizes(
	widgets: DashboardWidget<any, any>[],
	sizes: DashboardWidgetSize[],
	place: Place,
	columns: number,
	rows?: number,
	ignore: Id[] = []
): DashboardWidgetSize[] {
	return sizes.filter((size) => fits(widgets, { ...place, ...size }, columns, rows, ignore));
}

export function sameSize(a: DashboardWidgetSize, b: DashboardWidgetSize): boolean {
	return a.width === b.width && a.height === b.height;
}

export function nearestSize(sizes: DashboardWidgetSize[], target: DashboardWidgetSize): DashboardWidgetSize | undefined {
	let best: DashboardWidgetSize | undefined;
	let bestScore = Infinity;
	for (const size of sizes) {
		const score = Math.abs(size.width - target.width) + Math.abs(size.height - target.height);
		if (score < bestScore) {
			best = size;
			bestScore = score;
		}
	}
	return best;
}

export function stepSize(
	sizes: DashboardWidgetSize[],
	current: DashboardWidgetSize,
	direction: Direction
): DashboardWidgetSize | undefined {
	const horizontal = direction === 'left' || direction === 'right';
	const sign = direction === 'right' || direction === 'down' ? 1 : -1;
	let best: DashboardWidgetSize | undefined;
	let bestScore = Infinity;
	for (const size of sizes) {
		const along = horizontal ? size.width - current.width : size.height - current.height;
		const across = horizontal ? size.height - current.height : size.width - current.width;
		if (along * sign <= 0) continue;
		const score = Math.abs(along) + 2 * Math.abs(across);
		if (score < bestScore) {
			best = size;
			bestScore = score;
		}
	}
	return best;
}

export function swapPartner<W extends DashboardWidget<any, any>>(widgets: W[], widget: W, place: Place): W | undefined {
	return widgets.find(
		(other) =>
			other.id !== widget.id && other.left === place.left && other.top === place.top && sameSize(other, widget)
	);
}

export function stepTarget<W extends DashboardWidget<any, any>>(
	widgets: W[],
	widget: W,
	direction: Direction,
	columns: number,
	rows: number
): { place: Place; swap?: W } | undefined {
	const step = STEPS[direction];
	for (let distance = 1; ; distance++) {
		const place = { left: widget.left + step.left * distance, top: widget.top + step.top * distance };
		const area = { ...place, width: widget.width, height: widget.height };
		if (!inBounds(area, columns, rows)) return undefined;
		if (fits(widgets, area, columns, rows, [widget.id])) return { place };
		const swap = swapPartner(widgets, widget, place);
		if (swap) return { place, swap };
	}
}

export function placeWidget<W extends DashboardWidget<any, any>>(
	widgets: W[],
	id: Id,
	place: Place,
	swap?: W
): { widgets: W[]; changed: W[] } {
	const moving = widgets.find((widget) => widget.id === id);
	if (!moving) return { widgets, changed: [] };
	const changed: W[] = [];
	const next = widgets.map((widget) => {
		if (widget.id === id) {
			const moved = { ...widget, ...place };
			changed.push(moved);
			return moved;
		}
		if (swap && widget.id === swap.id) {
			const moved = { ...widget, left: moving.left, top: moving.top };
			changed.push(moved);
			return moved;
		}
		return widget;
	});
	return { widgets: next, changed };
}

export function resizeWidget<W extends DashboardWidget<any, any>>(
	widgets: W[],
	id: Id,
	size: DashboardWidgetSize
): { widgets: W[]; changed: W[] } {
	const changed: W[] = [];
	const next = widgets.map((widget) => {
		if (widget.id !== id) return widget;
		const resized = { ...widget, width: size.width, height: size.height };
		changed.push(resized);
		return resized;
	});
	return { widgets: next, changed };
}

export function readingOrder<W extends Area>(widgets: W[]): W[] {
	return [...widgets].sort((a, b) => a.top - b.top || a.left - b.left);
}

export function newWidgetId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
