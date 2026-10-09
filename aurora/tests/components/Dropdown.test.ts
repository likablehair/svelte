import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Dropdown from '#lib/components/composed/forms/Dropdown.svelte';
import type { Item } from '#lib/components/simple/forms/item.js';

const orders: Item[] = [
	{ value: 'recent', label: 'Newest' },
	{ value: 'name', label: 'Name A–Z' },
	{ value: 'spent', label: 'Total spent' }
];

const statuses: Item[] = [
	{ value: 'booked', label: 'Booked' },
	{ value: 'confirmed', label: 'Confirmed' },
	{ value: 'arrived', label: 'Arrived' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
	{ value: 'no-show', label: 'No-show' }
];

function snippetOf<T>(markup: (params: T) => string) {
	return createRawSnippet<[T]>((params) => ({ render: () => markup(params()) }));
}

const valueText = (container: HTMLElement) =>
	container.querySelector('.aurora-dropdown-value')?.textContent?.trim();

describe('Dropdown', () => {
	test('the trigger is a button with the combobox role, named by label', async () => {
		const screen = await render(Dropdown, { label: 'Sort by', items: orders, values: [orders[0]] });
		const trigger = screen.getByRole('combobox', { name: 'Sort by' });
		expect(trigger.element().tagName).toBe('BUTTON');
		await expect.element(trigger).toHaveAttribute('type', 'button');
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'listbox');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(trigger).toHaveAttribute('data-variant', 'secondary');
		await expect.element(trigger).toHaveAttribute('data-size', 'md');
		expect(trigger.element().querySelector('.aurora-dropdown-label')?.textContent).toBe('Sort by');
		expect(valueText(screen.container)).toBe('Newest');
	});

	test('without a selection it shows the placeholder, the name when there is no label', async () => {
		const screen = await render(Dropdown, { items: orders });
		const trigger = screen.getByRole('combobox', { name: 'Select' });
		await expect.element(trigger).toBeInTheDocument();
		expect(valueText(screen.container)).toBe('Select');
		expect(screen.container.querySelector('.aurora-dropdown-trigger')).toHaveAttribute('data-empty');
		await screen.unmount();

		const custom = await render(Dropdown, { items: orders, placeholder: 'Any order' });
		await expect.element(custom.getByRole('combobox', { name: 'Any order' })).toBeInTheDocument();
	});

	test('v4 bug: clicking the button opens and closes the list', async () => {
		const screen = await render(Dropdown, { label: 'Sort by', items: orders });
		const trigger = screen.getByRole('combobox');
		await trigger.click();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		const listbox = screen.getByRole('listbox', { name: 'Sort by' });
		await expect.element(listbox).toBeVisible();
		await expect.element(trigger).toHaveAttribute('aria-controls', listbox.element().id);
		await trigger.click();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
	});

	test('keyboard: arrows, Enter and Space open the list and pick; Escape closes', async () => {
		const onchange = vi.fn();
		const screen = await render(Dropdown, { label: 'Sort by', items: orders, onchange });
		const trigger = screen.getByRole('combobox');
		await userEvent.keyboard('{Tab}');
		await expect.element(trigger).toHaveFocus();

		await userEvent.keyboard('{ArrowDown}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		const newest = screen.getByRole('option', { name: 'Newest' });
		await expect.element(trigger).toHaveAttribute('aria-activedescendant', newest.element().id);
		await userEvent.keyboard('{ArrowDown}{Enter}');
		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange.mock.calls[0][0]).toEqual({
			select: orders[1],
			unselect: undefined,
			selection: [orders[1]]
		});
		expect(onchange.mock.calls[0][0]).not.toHaveProperty('detail');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(valueText(screen.container)).toBe('Name A–Z');

		await userEvent.keyboard(' ');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await userEvent.keyboard('{ArrowDown} ');
		expect(onchange).toHaveBeenLastCalledWith({
			select: orders[0],
			unselect: orders[1],
			selection: [orders[0]]
		});
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

		await userEvent.keyboard('{Enter}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await userEvent.keyboard('{Escape}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(trigger).toHaveFocus();
	});

	test('type-ahead: a letter opens the list on the first option that starts with it', async () => {
		const onchange = vi.fn();
		const screen = await render(Dropdown, { label: 'Status', items: statuses, onchange });
		const trigger = screen.getByRole('combobox');
		await userEvent.keyboard('{Tab}c');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		const confirmed = screen.getByRole('option', { name: 'Confirmed' });
		await expect.element(trigger).toHaveAttribute('aria-activedescendant', confirmed.element().id);
		await userEvent.keyboard('c');
		const completed = screen.getByRole('option', { name: 'Completed' });
		await expect.element(trigger).toHaveAttribute('aria-activedescendant', completed.element().id);
		await userEvent.keyboard('{Enter}');
		expect(onchange.mock.calls[0][0].select).toEqual(statuses[3]);
	});

	test('v4 bug: typing never filters the options', async () => {
		const screen = await render(Dropdown, { label: 'Status', items: statuses });
		const trigger = screen.getByRole('combobox');
		await trigger.click();
		await userEvent.keyboard('n');
		const noShow = screen.getByRole('option', { name: 'No-show' });
		await expect.element(trigger).toHaveAttribute('aria-activedescendant', noShow.element().id);
		expect(screen.getByRole('option').elements()).toHaveLength(6);
		await userEvent.keyboard('zz');
		expect(screen.getByRole('option').elements()).toHaveLength(6);
	});

	test('v4 bug: Backspace never removes values', async () => {
		const onchange = vi.fn();
		const screen = await render(Dropdown, {
			label: 'Status',
			items: statuses,
			multiple: true,
			mandatory: false,
			values: [statuses[0], statuses[1]],
			onchange
		});
		await userEvent.keyboard('{Tab}{Backspace}');
		await expect.element(screen.getByRole('combobox')).toHaveFocus();
		expect(onchange).not.toHaveBeenCalled();
		expect(valueText(screen.container)).toBe('2 selected');
	});

	test('v4 bug: the clear X is a sibling button that clears and gives the focus back', async () => {
		const onchange = vi.fn();
		const screen = await render(Dropdown, {
			label: 'Status',
			items: statuses,
			multiple: true,
			values: [statuses[0], statuses[1]],
			onchange
		});
		const trigger = screen.getByRole('combobox');
		const clear = screen.getByRole('button', { name: 'Clear selection' });
		expect(trigger.element().contains(clear.element())).toBe(false);
		expect(clear.element().parentElement).toBe(trigger.element().parentElement);
		const chevron = screen.container.querySelector('.aurora-dropdown-chevron');
		expect(chevron).toHaveAttribute('data-hidden');

		await clear.click();
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ unselect: statuses[0], selection: [] });
		await expect.element(clear).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(valueText(screen.container)).toBe('Select');
		expect(chevron).not.toHaveAttribute('data-hidden');
	});

	test('v4 bug: disabled is native: the list does not open and the clear X is hidden', async () => {
		const screen = await render(Dropdown, {
			label: 'Status',
			items: statuses,
			values: [statuses[0]],
			disabled: true
		});
		const trigger = screen.getByRole('combobox');
		await expect.element(trigger).toBeDisabled();
		await expect
			.element(screen.getByRole('button', { name: 'Clear selection' }))
			.not.toBeInTheDocument();
		await trigger.click({ force: true });
		await userEvent.keyboard('{Tab}');
		await expect.element(trigger).not.toHaveFocus();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
	});

	test('clearable={false} hides the X; mandatory (default) keeps the last option', async () => {
		const onchange = vi.fn();
		const screen = await render(Dropdown, {
			label: 'Sort by',
			items: orders,
			values: [orders[0]],
			clearable: false,
			onchange
		});
		await expect
			.element(screen.getByRole('button', { name: 'Clear selection' }))
			.not.toBeInTheDocument();
		await screen.getByRole('combobox').click();
		await screen.getByRole('option', { name: 'Newest' }).click();
		expect(onchange).not.toHaveBeenCalled();
		expect(valueText(screen.container)).toBe('Newest');
	});

	test('multiple: the list stays open while options are toggled', async () => {
		const screen = await render(Dropdown, { label: 'Status', items: statuses, multiple: true });
		const trigger = screen.getByRole('combobox');
		await trigger.click();
		await expect
			.element(screen.getByRole('listbox'))
			.toHaveAttribute('aria-multiselectable', 'true');
		await screen.getByRole('option', { name: 'Booked' }).click();
		await screen.getByRole('option', { name: 'Arrived' }).click();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect
			.element(screen.getByRole('option', { name: 'Arrived' }))
			.toHaveAttribute('aria-selected', 'true');
		expect(valueText(screen.container)).toBe('2 selected');
		await screen.getByRole('option', { name: 'Arrived' }).click();
		await screen.getByRole('option', { name: 'Booked' }).click();
		await expect
			.element(screen.getByRole('option', { name: 'Booked' }))
			.toHaveAttribute('aria-selected', 'true');
		expect(valueText(screen.container)).toBe('Booked');
	});

	test('v4 bug: the selection text is "N selected" in English; selectionText sets it', async () => {
		const screen = await render(Dropdown, {
			label: 'Status',
			items: statuses,
			multiple: true,
			values: [statuses[0], statuses[1]]
		});
		expect(valueText(screen.container)).toBe('2 selected');
		await screen.rerender({
			selectionText: (values: Item[]) => values.map((item) => item.label).join(', ')
		});
		expect(valueText(screen.container)).toBe('Booked, Confirmed');
	});

	test('with name, the values are submitted and the trigger never submits the form', async () => {
		const form = document.createElement('form');
		const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
		form.addEventListener('submit', onsubmit);
		document.body.append(form);
		const screen = await render(Dropdown, {
			target: form,
			props: {
				label: 'Status',
				items: statuses,
				multiple: true,
				name: 'status',
				values: [statuses[0], statuses[2]]
			}
		});
		expect(new FormData(form).getAll('status')).toEqual(['booked', 'arrived']);
		await screen.getByRole('combobox').click();
		await screen.getByRole('option', { name: 'Cancelled' }).click();
		expect(onsubmit).not.toHaveBeenCalled();
		form.requestSubmit();
		expect(onsubmit).toHaveBeenCalledOnce();
		expect(new FormData(form).getAll('status')).toEqual(['booked', 'arrived', 'cancelled']);
		form.remove();
	});

	test('labelSnippet renders the prefix and valueSnippet the selection text', async () => {
		const screen = await render(Dropdown, {
			label: 'Room',
			items: orders,
			values: [orders[2]],
			labelSnippet: snippetOf<{ label: string | undefined }>(({ label }) => `<i>${label}:</i>`),
			valueSnippet: snippetOf<{ values: Item[]; text: string; placeholder: string }>(
				({ values, text, placeholder }) => `<b>${text} (${values.length}, ${placeholder})</b>`
			)
		});
		const trigger = screen.getByRole('combobox', { name: 'Room:' });
		await expect.element(trigger).toBeInTheDocument();
		expect(valueText(screen.container)).toBe('Total spent (1, Select)');
	});

	test('variant, size, native attributes and class parts reach the right elements', async () => {
		const screen = await render(Dropdown, {
			label: 'Sort by',
			items: orders,
			values: [orders[0]],
			variant: 'primary',
			size: 'sm',
			id: 'sort',
			title: 'Sort order',
			class: { container: 'app-root', button: 'app-button', clear: 'app-clear', option: 'app-option' }
		});
		const trigger = screen.getByRole('combobox');
		await expect.element(trigger).toHaveAttribute('data-variant', 'primary');
		await expect.element(trigger).toHaveAttribute('data-size', 'sm');
		await expect.element(trigger).toHaveAttribute('id', 'sort');
		await expect.element(trigger).toHaveAttribute('title', 'Sort order');
		await expect.element(trigger).toHaveClass('aurora-dropdown-button', 'app-button');
		expect(screen.container.querySelector('.aurora-autocomplete')).toHaveClass(
			'aurora-dropdown',
			'app-root'
		);
		await expect
			.element(screen.getByRole('button', { name: 'Clear selection' }))
			.toHaveClass('app-clear');
		await trigger.click();
		await expect.element(screen.getByRole('option', { name: 'Newest' })).toHaveClass('app-option');
	});

	test('--button-* variables restyle the trigger', async () => {
		const container = document.createElement('div');
		container.style.setProperty('--button-height', '50px');
		container.style.setProperty('--button-border-radius', '999px');
		document.body.append(container);
		const screen = await render(Dropdown, { target: container, props: { items: orders } });
		const style = getComputedStyle(screen.getByRole('combobox').element());
		expect(style.height).toBe('50px');
		expect(style.borderTopLeftRadius).toBe('999px');
		container.remove();
	});

	test('bind:open reports opening and closing', async () => {
		let open: boolean | undefined;
		const screen = await render(Dropdown, {
			label: 'Sort by',
			items: orders,
			get open() {
				return open;
			},
			set open(value) {
				open = value;
			}
		});
		await screen.getByRole('combobox').click();
		await expect.poll(() => open).toBe(true);
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => open).toBe(false);
	});

	test('onclose fires whenever the list closes', async () => {
		const onclose = vi.fn();
		const screen = await render(Dropdown, { label: 'Sort by', items: orders, onclose });
		const trigger = screen.getByRole('combobox');
		await trigger.click();
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => onclose.mock.calls.length).toBe(1);
		await trigger.click();
		await trigger.click();
		await expect.poll(() => onclose.mock.calls.length).toBe(2);
		await trigger.click();
		await screen.getByRole('option', { name: 'Total spent' }).click();
		await expect.poll(() => onclose.mock.calls.length).toBe(3);
	});

	test('v4 bug: the mobile drawer shows the list without a search field', async () => {
		await page.viewport(800, 700);
		try {
			const onchange = vi.fn();
			const screen = await render(Dropdown, {
				label: 'Operator',
				items: statuses,
				mobileDrawer: true,
				onchange
			});
			const trigger = screen.getByRole('combobox', { name: 'Operator' });
			await trigger.click();
			const drawer = screen.getByRole('dialog', { name: 'Operator' });
			await expect.element(drawer).toBeVisible();
			await expect.element(drawer.getByRole('listbox')).toHaveFocus();
			await expect.element(drawer.getByRole('textbox')).not.toBeInTheDocument();
			await expect.element(drawer.getByRole('combobox')).not.toBeInTheDocument();
			await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
			expect(onchange.mock.calls[0][0].select).toEqual(statuses[1]);
			await expect.element(drawer).not.toBeInTheDocument();
			await expect.element(trigger).toHaveFocus();
		} finally {
			await page.viewport(1280, 800);
		}
	});
});
