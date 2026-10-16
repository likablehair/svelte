export function observeWidth(update: (width: number) => void) {
	return (node: Element) => {
		let frame = 0;
		const observer = new ResizeObserver(([entry]) => {
			const width = entry.borderBoxSize?.[0]?.inlineSize ?? node.getBoundingClientRect().width;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => update(width));
		});
		observer.observe(node);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	};
}
