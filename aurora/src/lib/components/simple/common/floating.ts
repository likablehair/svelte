export type Side = 'top' | 'bottom' | 'left' | 'right';

export type Placement = Side | `${Side}-start` | `${Side}-end`;

export type VirtualElement = { getBoundingClientRect(): DOMRect };

const VIEWPORT_PADDING = 8;
const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

export function place(
	floating: HTMLElement,
	anchor: HTMLElement | VirtualElement | undefined,
	placement: Placement,
	offset: number,
	matchWidth = false
) {
	const viewportWidth = document.documentElement.clientWidth;
	const viewportHeight = document.documentElement.clientHeight;
	const rect = anchor?.getBoundingClientRect();
	if (rect && matchWidth) floating.style.width = `${rect.width}px`;
	const width = floating.offsetWidth;
	const height = floating.offsetHeight;
	const clamp = (value: number, max: number) =>
		Math.max(VIEWPORT_PADDING, Math.min(value, max - VIEWPORT_PADDING));

	if (!rect) {
		floating.style.left = `${(viewportWidth - width) / 2}px`;
		floating.style.top = `${(viewportHeight - height) / 2}px`;
		return;
	}

	const [preferred, align] = placement.split('-') as [Side, 'start' | 'end' | undefined];
	const space: Record<Side, number> = {
		top: rect.top,
		bottom: viewportHeight - rect.bottom,
		left: rect.left,
		right: viewportWidth - rect.right
	};
	const needed = (preferred === 'top' || preferred === 'bottom' ? height : width) + offset;
	const side =
		space[preferred] < needed && space[OPPOSITE[preferred]] > space[preferred]
			? OPPOSITE[preferred]
			: preferred;

	let top: number;
	let left: number;
	if (side === 'top' || side === 'bottom') {
		top = side === 'bottom' ? rect.bottom + offset : rect.top - offset - height;
		left =
			align === 'start'
				? rect.left
				: align === 'end'
					? rect.right - width
					: rect.left + rect.width / 2 - width / 2;
	} else {
		left = side === 'right' ? rect.right + offset : rect.left - offset - width;
		top =
			align === 'start'
				? rect.top
				: align === 'end'
					? rect.bottom - height
					: rect.top + rect.height / 2 - height / 2;
	}

	left = clamp(left, viewportWidth - width);
	top = clamp(top, viewportHeight - height);
	floating.style.left = `${left}px`;
	floating.style.top = `${top}px`;
	floating.style.setProperty('--aurora-anchor-x', `${rect.left + rect.width / 2 - left}px`);
	floating.style.setProperty('--aurora-anchor-y', `${rect.top + rect.height / 2 - top}px`);
	floating.dataset.side = side;
}

export function follow(
	floating: HTMLElement,
	anchor: HTMLElement | VirtualElement | undefined,
	update: () => void
) {
	let frame = 0;
	let last = '';
	const track = () => {
		const rect = anchor?.getBoundingClientRect();
		const key = [
			rect?.top,
			rect?.left,
			rect?.width,
			rect?.height,
			floating.offsetWidth,
			floating.offsetHeight,
			document.documentElement.clientWidth,
			document.documentElement.clientHeight
		].join();
		if (key !== last) {
			last = key;
			update();
		}
		frame = requestAnimationFrame(track);
	};
	frame = requestAnimationFrame(track);
	return () => cancelAnimationFrame(frame);
}
