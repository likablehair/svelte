import { createRawSnippet, type Component } from 'svelte';
import { render } from 'vitest-browser-svelte';
import WithDefaultLocale from './fixtures/locale/WithDefaultLocale.svelte';

export function snippet(markup: string) {
	return createRawSnippet(() => ({ render: () => markup }));
}

export function text(value: string) {
	return snippet(`<span>${value}</span>`);
}

export function tooltipText(element: Element) {
	const ids = (element.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
	const tooltip = ids
		.map((id) => document.getElementById(id))
		.find((node) => node?.classList.contains('aurora-tooltip'));
	return tooltip?.textContent?.trim();
}

export function renderWithDefaultLocale(
	locale: string | undefined,
	component: Component<any, any, any>,
	componentProps: Record<string, unknown> = {}
) {
	return render(WithDefaultLocale, { props: { locale, component, componentProps } });
}

export function sweepFormatChip(root: HTMLElement, variable: string) {
	const chip = root.querySelector('kbd')!;
	const inputs = [...root.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')];
	const steps: { width: number; chip: boolean; fits: boolean }[] = [];
	for (let width = 400; width >= 100; width -= 10) {
		root.style.setProperty(variable, `${width}px`);
		const slot = chip.parentElement!.getBoundingClientRect();
		const box = chip.getBoundingClientRect();
		steps.push({
			width,
			chip: box.top < slot.bottom && box.bottom > slot.top,
			fits: inputs.every((input) => input.scrollWidth <= input.clientWidth)
		});
	}
	root.style.removeProperty(variable);
	return steps;
}
