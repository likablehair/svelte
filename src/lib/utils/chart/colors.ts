const DYNAMIC = /var\(|light-dark\(|color-mix\(|currentcolor|^--/i;

export interface ColorResolver {
	color(value: string): string;
	alpha(value: string, alpha: number): string;
	length(value: string): number;
	reset(): void;
	dispose(): void;
}

function rgba([r, g, b, a]: number[]) {
	return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 1000) / 1000})`;
}

export function colorResolver(host: HTMLElement): ColorResolver {
	const cache = new Map<string, number[]>();
	let probe: HTMLElement | undefined;
	let context: CanvasRenderingContext2D | null | undefined;

	function element() {
		if (!probe) {
			probe = document.createElement('span');
			probe.setAttribute('aria-hidden', 'true');
			probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;inset:0 auto auto 0;height:0;overflow:hidden';
			host.append(probe);
		}
		return probe;
	}

	function channels(value: string): number[] {
		const cached = cache.get(value);
		if (cached) return cached;
		const node = element();
		node.style.color = '';
		node.style.color = value.startsWith('--') ? `var(${value})` : value;
		const computed = getComputedStyle(node).color;
		let result: number[];
		const match = computed.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
		if (match) {
			const a = match[4] === undefined ? 1 : match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4]);
			result = [Number(match[1]), Number(match[2]), Number(match[3]), a];
		} else {
			context ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
			if (!context) return [0, 0, 0, 1];
			context.clearRect(0, 0, 1, 1);
			context.fillStyle = computed;
			context.fillRect(0, 0, 1, 1);
			const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
			result = [r, g, b, a / 255];
		}
		cache.set(value, result);
		return result;
	}

	return {
		color(value) {
			return DYNAMIC.test(value) ? rgba(channels(value)) : value;
		},
		alpha(value, alpha) {
			const [r, g, b, a] = channels(value);
			return rgba([r, g, b, a * alpha]);
		},
		length(value) {
			if (!value) return 0;
			const node = element();
			node.style.width = value;
			const width = parseFloat(getComputedStyle(node).width);
			node.style.width = '';
			return Number.isFinite(width) ? width : 0;
		},
		reset() {
			cache.clear();
		},
		dispose() {
			probe?.remove();
			probe = undefined;
		}
	};
}
