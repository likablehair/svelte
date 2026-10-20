import { mdiContentCut } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ToggleList from '#lib/components/composed/forms/ToggleList.svelte';
import type { Item } from '#lib/components/simple/forms/item.js';

const items: Item[] = [
	{ value: 'cut', label: 'Haircut', icon: mdiContentCut },
	{ value: 'color', label: 'Color' },
	{ value: 3 }
];

function bound(initial: Item[] | undefined, others: Record<string, unknown>) {
	const state = $state({ values: initial });
	const props = Object.defineProperty({ items, ...others }, 'values', {
		get: () => state.values,
		set: (next: Item[] | undefined) => {
			state.values = next;
		},
		enumerable: true,
		configurable: true
	});
	return { state, props };
}

const pressed = (container: HTMLElement) =>
	[...container.querySelectorAll('button')].map((button) => button.getAttribute('aria-pressed'));

describe('ToggleList', () => {
	test('renders a group with one toggle button per item, attributes on the root', async () => {
		const screen = await render(ToggleList, { items, id: 'services', class: 'mine', 'aria-label': 'Services' });
		const group = screen.getByRole('group', { name: 'Services' });
		await expect.element(group).toHaveAttribute('id', 'services');
		await expect.element(group).toHaveClass('aurora-toggle-list');
		await expect.element(group).toHaveClass('mine');
		await expect.element(group).toHaveAttribute('data-multiple', 'true');
		expect(screen.getByRole('button').all()).toHaveLength(3);
		await expect.element(screen.getByRole('button', { name: 'Haircut' })).toHaveAttribute('aria-pressed', 'false');
		await expect.element(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
	});

	test('values press the matching buttons, compared by value', async () => {
		const screen = await render(ToggleList, { items, values: [{ value: 'color' }] });
		expect(pressed(screen.container)).toEqual(['false', 'true', 'false']);
	});

	test('multiple: each click turns one option on or off and reports it', async () => {
		const onchange = vi.fn();
		const { state, props } = bound(undefined, { onchange });
		const screen = await render(ToggleList, props);
		await screen.getByRole('button', { name: 'Haircut' }).click();
		await screen.getByRole('button', { name: 'Color' }).click();
		expect(state.values?.map((item) => item.value)).toEqual(['cut', 'color']);
		expect(onchange).toHaveBeenNthCalledWith(1, { select: items[0], selection: [items[0]] });
		expect(onchange).toHaveBeenLastCalledWith({ select: items[1], selection: [items[0], items[1]] });
		await screen.getByRole('button', { name: 'Haircut' }).click();
		expect(state.values).toEqual([items[1]]);
		expect(onchange).toHaveBeenLastCalledWith({ unselect: items[0], selection: [items[1]] });
		await expect.element(screen.getByRole('button', { name: 'Haircut' })).toHaveAttribute('aria-pressed', 'false');
	});

	test('v4 bug: with multiple={false} the replaced option is reported in unselect', async () => {
		const onchange = vi.fn();
		const { state, props } = bound([items[0]], { multiple: false, onchange });
		const screen = await render(ToggleList, props);
		await expect.element(screen.getByRole('group')).not.toHaveAttribute('data-multiple');
		await screen.getByRole('button', { name: 'Color' }).click();
		expect(state.values).toEqual([items[1]]);
		expect(onchange).toHaveBeenCalledWith({ select: items[1], unselect: items[0], selection: [items[1]] });
		expect(pressed(screen.container)).toEqual(['false', 'true', 'false']);
	});

	test('with multiple={false} a second click keeps the option pressed (v4 emptied the selection)', async () => {
		const onchange = vi.fn();
		const { state, props } = bound([items[1]], { multiple: false, onchange });
		const screen = await render(ToggleList, props);
		await screen.getByRole('button', { name: 'Color' }).click();
		expect(state.values).toEqual([items[1]]);
		expect(onchange).not.toHaveBeenCalled();
		await expect.element(screen.getByRole('button', { name: 'Color' })).toHaveAttribute('aria-pressed', 'true');
	});

	test('mandatory={false} lets the single option be turned off', async () => {
		const onchange = vi.fn();
		const { state, props } = bound([items[1]], { multiple: false, mandatory: false, onchange });
		const screen = await render(ToggleList, props);
		await screen.getByRole('button', { name: 'Color' }).click();
		expect(state.values).toEqual([]);
		expect(onchange).toHaveBeenCalledWith({ unselect: items[1], selection: [] });
		await expect.element(screen.getByRole('button', { name: 'Color' })).toHaveAttribute('aria-pressed', 'false');
	});

	test('mandatory with multiple keeps the last option pressed', async () => {
		const { state, props } = bound([items[0], items[1]], { mandatory: true });
		const screen = await render(ToggleList, props);
		await screen.getByRole('button', { name: 'Haircut' }).click();
		await screen.getByRole('button', { name: 'Color' }).click();
		expect(state.values).toEqual([items[1]]);
		await expect.element(screen.getByRole('button', { name: 'Color' })).toHaveAttribute('aria-pressed', 'true');
	});

	test('v4 bug: disabled really disables the buttons (v4 only faded them)', async () => {
		const onchange = vi.fn();
		const screen = await render(ToggleList, { items, disabled: true, onchange });
		await expect.element(screen.getByRole('group')).toHaveAttribute('data-disabled', 'true');
		for (const button of screen.getByRole('button').all()) await expect.element(button).toBeDisabled();
		screen.getByRole('button', { name: 'Color' }).element().dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onchange).not.toHaveBeenCalled();
		expect(pressed(screen.container)).toEqual(['false', 'false', 'false']);
	});

	test('keyboard: Tab reaches each button, Space and Enter toggle it', async () => {
		const { state, props } = bound(undefined, {});
		const screen = await render(ToggleList, props);
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button', { name: 'Haircut' })).toHaveFocus();
		await userEvent.keyboard(' ');
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button', { name: 'Color' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		expect(state.values?.map((item) => item.value)).toEqual(['cut', 'color']);
	});

	test('icon, size and dot reach the buttons', async () => {
		const screen = await render(ToggleList, { items, size: 'sm' });
		const [cut, color] = screen.getByRole('button').all().map((button) => button.element());
		expect(cut.querySelector('svg path')?.getAttribute('d')).toBe(mdiContentCut);
		expect(cut.querySelector('.aurora-activable-button-dot')).toBeNull();
		expect(color.querySelector('.aurora-activable-button-dot')).not.toBeNull();
		expect(cut.getAttribute('data-size')).toBe('sm');
		screen.unmount();
		const plain = await render(ToggleList, { items, dot: false });
		expect(plain.container.querySelector('.aurora-activable-button-dot')).toBeNull();
	});

	test('itemSnippet replaces the content of each button', async () => {
		const screen = await render(ToggleList, {
			items,
			values: [items[1]],
			itemSnippet: createRawSnippet<[{ item: Item; active: boolean }]>((args) => ({
				render: () => `<b>${args().item.value}:${args().active}</b>`
			}))
		});
		await expect.element(screen.getByRole('button', { name: 'color:true' })).toHaveAttribute('aria-pressed', 'true');
		await expect.element(screen.getByRole('button', { name: 'cut:false' })).toBeInTheDocument();
	});

	test('instance CSS variables set the gap and the size of the group', async () => {
		const screen = await render(ToggleList, {
			items,
			style: '--toggle-list-gap: 20px; --toggle-list-width: 300px; --toggle-list-height: 90px'
		});
		const group = screen.getByRole('group').element();
		expect(getComputedStyle(group).columnGap).toBe('20px');
		expect(getComputedStyle(group).width).toBe('300px');
		expect(getComputedStyle(group).height).toBe('90px');
	});

	test('bind:toggleListElement exposes the root', async () => {
		let element: HTMLDivElement | undefined;
		const screen = await render(ToggleList, {
			items,
			get toggleListElement() {
				return element;
			},
			set toggleListElement(value) {
				element = value;
			}
		});
		expect(element).toBe(screen.getByRole('group').element());
	});
});
