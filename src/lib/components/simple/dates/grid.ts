export function gridTarget(
	event: KeyboardEvent,
	list: HTMLElement,
	index: number,
	count: number
): number | undefined {
	const style = getComputedStyle(list);
	const columns = style.gridTemplateColumns.split(' ').filter(Boolean).length || 1;
	const step = style.direction === 'rtl' ? -1 : 1;
	let target: number;
	if (event.key === 'ArrowLeft') target = index - step;
	else if (event.key === 'ArrowRight') target = index + step;
	else if (event.key === 'ArrowUp') target = index - columns;
	else if (event.key === 'ArrowDown') target = index + columns;
	else if (event.key === 'PageUp') target = index - columns * 3;
	else if (event.key === 'PageDown') target = index + columns * 3;
	else if (event.key === 'Home') target = 0;
	else if (event.key === 'End') target = count - 1;
	else return undefined;
	return Math.min(count - 1, Math.max(0, target));
}
