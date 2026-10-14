import { Virtualizer } from '@tanstack/virtual-core';

export interface RowRange {
	start: number;
	end: number;
	before: number;
	after: number;
}

export interface RowWindowOptions {
	body: Element;
	scroller: Element | Window;
	count: number;
	estimate: number;
	gap?: number;
	overscan?: number;
	key: (index: number) => string | number;
	onChange: (range: RowRange) => void;
}

export function scrollParent(node: Element, own?: Element): Element | Window {
	if (own && getComputedStyle(own).maxHeight !== 'none') return own;
	for (let parent = node.parentElement; parent; parent = parent.parentElement) {
		if (parent === document.body || parent === document.documentElement) break;
		const { overflowY } = getComputedStyle(parent);
		if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return parent;
	}
	return window;
}

export function createRowWindow(options: RowWindowOptions) {
	const { body, scroller, onChange } = options;
	const isWindow = scroller === window;
	const element = scroller as Element;

	const viewportTop = () => (isWindow ? 0 : element.getBoundingClientRect().top + element.clientTop);
	const viewport = () =>
		isWindow
			? { width: window.innerWidth, height: window.innerHeight }
			: { width: element.clientWidth, height: element.clientHeight };
	const offset = () => viewportTop() - body.getBoundingClientRect().top;

	let settings = {
		count: options.count,
		estimate: options.estimate,
		key: options.key
	};

	const base = {
		getScrollElement: () => scroller,
		estimateSize: () => settings.estimate,
		overscan: options.overscan ?? 8,
		gap: options.gap ?? 0,
		observeElementRect: (_: unknown, cb: (rect: { width: number; height: number }) => void) => {
			const update = () => cb(viewport());
			update();
			if (isWindow) {
				window.addEventListener('resize', update);
				return () => window.removeEventListener('resize', update);
			}
			const observer = new ResizeObserver(update);
			observer.observe(element);
			return () => observer.disconnect();
		},
		observeElementOffset: (_: unknown, cb: (offset: number, isScrolling: boolean) => void) => {
			let timer = 0;
			const scroll = () => {
				cb(offset(), true);
				clearTimeout(timer);
				timer = window.setTimeout(() => cb(offset(), false), 150);
			};
			cb(offset(), false);
			const target = isWindow ? window : element;
			target.addEventListener('scroll', scroll, { passive: true });
			return () => {
				clearTimeout(timer);
				target.removeEventListener('scroll', scroll);
			};
		},
		scrollToFn: (to: number, { adjustments = 0, behavior }: { adjustments?: number; behavior?: ScrollBehavior }) => {
			const delta = to + adjustments - offset();
			if (delta) (isWindow ? window : element).scrollBy({ top: delta, behavior });
		},
		onChange: () => emit()
	};

	const virtualizer = new Virtualizer<Element | Window, Element>({
		...base,
		count: settings.count,
		getItemKey: (index) => settings.key(index)
	});

	function emit() {
		const items = virtualizer.getVirtualItems();
		const first = items[0];
		const last = items.at(-1);
		if (!first || !last) {
			onChange({ start: 0, end: -1, before: 0, after: 0 });
			return;
		}
		onChange({
			start: first.index,
			end: last.index,
			before: first.start,
			after: Math.max(0, virtualizer.getTotalSize() - last.end)
		});
	}

	const unmount = virtualizer._didMount();
	virtualizer._willUpdate();
	emit();

	return {
		update(next: { count: number; key: (index: number) => string | number; estimate?: number }) {
			const estimateChanged = next.estimate !== undefined && next.estimate !== settings.estimate;
			settings = { ...settings, ...next, estimate: next.estimate ?? settings.estimate };
			virtualizer.setOptions({
				...base,
				count: settings.count,
				getItemKey: (index) => settings.key(index)
			});
			if (estimateChanged) virtualizer.measure();
			virtualizer._willUpdate();
			emit();
		},
		resize(index: number, size: number) {
			if (index < settings.count) virtualizer.resizeItem(index, size);
		},
		destroy() {
			unmount();
		}
	};
}
