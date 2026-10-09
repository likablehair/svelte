import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Autocomplete from '#lib/components/simple/forms/Autocomplete.svelte';
import type { Item } from '#lib/components/simple/forms/item.js';

const services: Item[] = [
	{ value: 'cut', label: 'Haircut' },
	{ value: 'blow-dry', label: 'Blow-dry' },
	{ value: 'color', label: 'Color' },
	{ value: 'balayage', label: 'Balayage' },
	{ value: 'pedicure', label: 'Pédicure' }
];

function snippetOf<T>(markup: (params: T) => string) {
	return createRawSnippet<[T]>((params) => ({ render: () => markup(params()) }));
}

const optionLabels = () =>
	[...document.querySelectorAll('[role="option"]')].map((option) => option.textContent?.trim());

describe('Autocomplete', () => {
	test('is an ARIA combobox whose listbox opens on focus', async () => {
		const screen = await render(Autocomplete, { label: 'Service', items: services });
		const input = screen.getByRole('combobox', { name: 'Service' });
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(input).toHaveAttribute('aria-haspopup', 'listbox');
		await expect.element(input).toHaveAttribute('aria-autocomplete', 'list');
		await expect.element(input).not.toHaveAttribute('aria-controls');

		await input.click();
		await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		const listbox = screen.getByRole('listbox', { name: 'Service' });
		await expect.element(listbox).toBeVisible();
		await expect.element(input).toHaveAttribute('aria-controls', listbox.element().id);
		expect(optionLabels()).toEqual(['Haircut', 'Blow-dry', 'Color', 'Balayage', 'Pédicure']);
		await expect
			.element(screen.getByRole('option', { name: 'Color' }))
			.toHaveAttribute('aria-selected', 'false');
		await expect.element(input).toHaveFocus();
		await expect.element(input).not.toHaveAttribute('aria-activedescendant');
	});

	test('v4 bug: arrows open the list and move the highlight without moving the caret', async () => {
		const screen = await render(Autocomplete, { label: 'Service', items: services });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('{Escape}');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');

		await userEvent.keyboard('{ArrowDown}');
		await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		const haircut = screen.getByRole('option', { name: 'Haircut' });
		await expect.element(input).toHaveAttribute('aria-activedescendant', haircut.element().id);
		await expect.element(haircut).toHaveAttribute('data-highlighted');

		await userEvent.keyboard('{ArrowDown}');
		const blowDry = screen.getByRole('option', { name: 'Blow-dry' });
		await expect.element(input).toHaveAttribute('aria-activedescendant', blowDry.element().id);
		await expect.element(haircut).not.toHaveAttribute('data-highlighted');
		await userEvent.keyboard('{ArrowUp}{ArrowUp}');
		await expect.element(input).toHaveAttribute('aria-activedescendant', haircut.element().id);

		await userEvent.keyboard('ha');
		const element = input.element() as HTMLInputElement;
		expect(element.selectionStart).toBe(2);
		await userEvent.keyboard('{ArrowUp}');
		expect(element.selectionStart).toBe(2);
		await expect.element(input).toHaveFocus();
	});

	test('while typing, the first match is highlighted and Enter picks it', async () => {
		const onchange = vi.fn();
		const screen = await render(Autocomplete, { label: 'Service', items: services, onchange });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('bal');
		const option = screen.getByRole('option', { name: 'Balayage' });
		await expect.element(option).toHaveAttribute('data-highlighted');
		await expect.element(input).toHaveAttribute('aria-activedescendant', option.element().id);

		await userEvent.keyboard('{Enter}');
		expect(onchange).toHaveBeenCalledOnce();
		const change = onchange.mock.calls[0][0];
		expect(change).not.toHaveProperty('detail');
		expect(change).toEqual({ select: services[3], unselect: undefined, selection: [services[3]] });
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(input).toHaveFocus();
		await expect.element(input).toHaveValue('');
		await expect
			.element(screen.getByRole('button', { name: 'Remove Balayage' }))
			.toBeInTheDocument();
	});

	test('the search ignores case and accents and marks the match', async () => {
		const screen = await render(Autocomplete, { label: 'Service', items: services });
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('PEDI');
		await expect.poll(optionLabels).toEqual(['Pédicure']);
		const mark = screen.getByRole('option', { name: 'Pédicure' }).element().querySelector('mark');
		expect(mark?.textContent).toBe('Pédi');
	});

	test('searchFunction replaces the default search', async () => {
		const searchFunction = vi.fn((item: Item, text: string) => String(item.value).startsWith(text));
		const screen = await render(Autocomplete, { label: 'Service', items: services, searchFunction });
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('b');
		await expect.poll(optionLabels).toEqual(['Blow-dry', 'Balayage']);
		expect(searchFunction).toHaveBeenCalledWith(services[0], 'b');
	});

	test('v4 bug: Enter on a highlighted option picks it without submitting the form', async () => {
		const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
		const form = document.createElement('form');
		form.addEventListener('submit', onsubmit);
		form.append(document.createElement('button'));
		document.body.append(form);
		const onchange = vi.fn();
		const screen = await render(Autocomplete, {
			target: form,
			props: { label: 'Service', items: services, onchange }
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('col');
		await expect.element(screen.getByRole('option', { name: 'Color' })).toHaveAttribute(
			'data-highlighted'
		);
		await userEvent.keyboard('{Enter}');
		expect(onchange).toHaveBeenCalledOnce();
		expect(onsubmit).not.toHaveBeenCalled();
		form.remove();
	});

	test('v4 bug: Enter on an empty list does nothing', async () => {
		const onchange = vi.fn();
		const screen = await render(Autocomplete, { label: 'Service', items: services, onchange });
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('zzz');
		const status = screen.getByRole('status');
		await expect.element(status).toHaveTextContent('No results');
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
		await userEvent.keyboard('{Enter}');
		expect(onchange).not.toHaveBeenCalled();
		await expect.element(status).toHaveTextContent('No results');
	});

	test('v4 bug: Backspace on an empty field removes the last value, also untouched', async () => {
		const onchange = vi.fn();
		const screen = await render(Autocomplete, {
			label: 'Services',
			items: services,
			multiple: true,
			values: [services[0], services[2]],
			onchange
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('{Backspace}');
		expect(onchange).toHaveBeenCalledExactlyOnceWith({
			unselect: services[2],
			selection: [services[0]]
		});
		await expect
			.element(screen.getByRole('button', { name: 'Remove Color' }))
			.not.toBeInTheDocument();

		await userEvent.keyboard('x{Backspace}');
		expect(onchange).toHaveBeenCalledOnce();
		await expect
			.element(screen.getByRole('button', { name: 'Remove Haircut' }))
			.toBeInTheDocument();
	});

	test('Escape closes the list, keeps the focus and calls onclose', async () => {
		const onclose = vi.fn();
		const screen = await render(Autocomplete, { label: 'Service', items: services, onclose });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('col');
		await userEvent.keyboard('{Escape}');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
		await expect.element(input).toHaveFocus();
		expect(onclose).toHaveBeenCalledOnce();
	});

	test('closing empties searchText, unless clearSearchOnClose is false', async () => {
		let searchText: string | undefined;
		const screen = await render(Autocomplete, {
			label: 'Service',
			items: services,
			get searchText() {
				return searchText;
			},
			set searchText(value) {
				searchText = value;
			}
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('col');
		expect(searchText).toBe('col');
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => searchText).toBe('');
		await screen.unmount();

		const kept = await render(Autocomplete, {
			label: 'Service',
			items: services,
			clearSearchOnClose: false
		});
		const input = kept.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('col{Escape}');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(input).toHaveValue('col');
	});

	test('multiple: picks become chips, the list stays open, the chip X keeps the focus', async () => {
		const onchange = vi.fn();
		const screen = await render(Autocomplete, {
			label: 'Services',
			items: services,
			multiple: true,
			values: [services[0]],
			onchange
		});
		const input = screen.getByRole('combobox');
		await input.click();
		await expect
			.element(screen.getByRole('listbox'))
			.toHaveAttribute('aria-multiselectable', 'true');
		await expect
			.element(screen.getByRole('option', { name: 'Haircut' }))
			.toHaveAttribute('aria-selected', 'true');

		await screen.getByRole('option', { name: 'Color' }).click();
		expect(onchange).toHaveBeenLastCalledWith({
			select: services[2],
			unselect: undefined,
			selection: [services[0], services[2]]
		});
		await expect
			.element(screen.getByRole('option', { name: 'Color' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect.element(input).toHaveAttribute('aria-expanded', 'true');

		await screen.getByRole('button', { name: 'Remove Haircut' }).click();
		await expect
			.element(screen.getByRole('button', { name: 'Remove Haircut' }))
			.not.toBeInTheDocument();
		expect(onchange).toHaveBeenLastCalledWith({ unselect: services[0], selection: [services[2]] });
		await expect.element(input).toHaveFocus();
		await expect.element(input).toHaveAttribute('aria-expanded', 'true');
	});

	test('maxVisibleChips shows a +N counter that lists the hidden values', async () => {
		const screen = await render(Autocomplete, {
			label: 'Services',
			items: services,
			multiple: true,
			values: services,
			maxVisibleChips: 2
		});
		expect(screen.getByRole('button', { name: /^Remove/ }).elements()).toHaveLength(2);
		const counter = screen.getByText('+3');
		await expect.element(counter).toHaveAttribute('title', 'Color, Balayage, Pédicure');
	});

	test('mandatory keeps the last value', async () => {
		const onchange = vi.fn();
		const screen = await render(Autocomplete, {
			label: 'Services',
			items: services,
			multiple: true,
			mandatory: true,
			values: [services[2]],
			onchange
		});
		await expect
			.element(screen.getByRole('button', { name: 'Remove Color' }))
			.not.toBeInTheDocument();
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('{Backspace}');
		await screen.getByRole('option', { name: 'Color' }).click();
		expect(onchange).not.toHaveBeenCalled();
		await expect
			.element(screen.getByRole('option', { name: 'Color' }))
			.toHaveAttribute('aria-selected', 'true');
	});

	test('v4 bug: disabled really disables the field', async () => {
		const onchange = vi.fn();
		const screen = await render(Autocomplete, {
			label: 'Services',
			items: services,
			multiple: true,
			values: [services[0]],
			disabled: true,
			onchange
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toBeDisabled();
		await expect.element(input).toHaveAttribute('aria-disabled', 'true');
		expect(screen.container.querySelector('.aurora-autocomplete')).toHaveAttribute('data-disabled');
		await expect
			.element(screen.getByRole('button', { name: 'Remove Haircut' }))
			.not.toBeInTheDocument();

		await userEvent.click(screen.container.querySelector('.aurora-autocomplete-field')!);
		await userEvent.keyboard('{Tab}');
		await expect.element(input).not.toHaveFocus();
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
		expect(onchange).not.toHaveBeenCalled();
	});

	test('with name, every selected value is submitted with the form', async () => {
		const form = document.createElement('form');
		let data: FormData | undefined;
		form.addEventListener('submit', (event) => {
			event.preventDefault();
			data = new FormData(form);
		});
		document.body.append(form);
		const screen = await render(Autocomplete, {
			target: form,
			props: {
				label: 'Services',
				items: services,
				multiple: true,
				name: 'services',
				values: [services[0], services[2]]
			}
		});
		form.requestSubmit();
		expect(data?.getAll('services')).toEqual(['cut', 'color']);
		expect([...new Set(data?.keys())]).toEqual(['services']);

		await screen.getByRole('combobox').click();
		await screen.getByRole('option', { name: 'Balayage' }).click();
		form.requestSubmit();
		expect(data?.getAll('services')).toEqual(['cut', 'color', 'balayage']);
		form.remove();
	});

	test('single selection: another pick replaces the value and reports it in unselect', async () => {
		const onchange = vi.fn();
		let values: Item[] | undefined = [services[0]];
		const screen = await render(Autocomplete, {
			label: 'Service',
			items: services,
			onchange,
			get values() {
				return values;
			},
			set values(value) {
				values = value;
			}
		});
		await screen.getByRole('combobox').click();
		await screen.getByRole('option', { name: 'Color' }).click();
		expect(onchange).toHaveBeenCalledExactlyOnceWith({
			select: services[2],
			unselect: services[0],
			selection: [services[2]]
		});
		expect(values).toEqual([services[2]]);
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
	});

	test('v4 bug: values are compared with ===, so 1 and "1" are different options', async () => {
		const items: Item[] = [
			{ value: 1, label: 'One' },
			{ value: '1', label: 'One as text' }
		];
		const screen = await render(Autocomplete, { label: 'Number', items, values: [items[0]] });
		await screen.getByRole('combobox').click();
		await expect
			.element(screen.getByRole('option', { name: 'One', exact: true }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(screen.getByRole('option', { name: 'One as text' }))
			.toHaveAttribute('aria-selected', 'false');
	});

	test('v4 bug: the initial searchText is kept and filters the list', async () => {
		const screen = await render(Autocomplete, {
			label: 'Service',
			items: services,
			searchText: 'Col'
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveValue('Col');
		await input.click();
		await expect.poll(optionLabels).toEqual(['Color']);
		await expect.element(input).toHaveValue('Col');
	});

	test('bind:open reports opening and closing', async () => {
		let open: boolean | undefined;
		const screen = await render(Autocomplete, {
			label: 'Service',
			items: services,
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

	test('open and values set from outside update the component', async () => {
		const onclose = vi.fn();
		const screen = await render(Autocomplete, { label: 'Service', items: services, onclose });
		await screen.rerender({ open: true });
		await expect.element(screen.getByRole('listbox')).toBeVisible();
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');

		await screen.rerender({ values: [services[1]] });
		await expect
			.element(screen.getByRole('option', { name: 'Blow-dry' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(screen.getByRole('button', { name: 'Remove Blow-dry' }))
			.toBeInTheDocument();

		await screen.rerender({ open: false });
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
	});

	test('loading shows a spinner and a loading row, and Enter picks nothing', async () => {
		const onchange = vi.fn();
		const screen = await render(Autocomplete, {
			label: 'Service',
			items: services,
			loading: true,
			onchange
		});
		const root = screen.container.querySelector('.aurora-autocomplete');
		expect(root).toHaveAttribute('data-loading');
		expect(root?.querySelector('.aurora-autocomplete-field .aurora-autocomplete-spinner')).not.toBe(
			null
		);
		await screen.getByRole('combobox').click();
		await expect.element(screen.getByRole('status')).toHaveTextContent('Loading…');
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
		await userEvent.keyboard('{ArrowDown}{Enter}');
		expect(onchange).not.toHaveBeenCalled();

		await screen.rerender({ loading: false, open: true });
		await expect.element(screen.getByRole('listbox')).toBeVisible();
		await expect.element(screen.getByRole('status')).not.toBeInTheDocument();
	});

	test('noResultsText replaces the text of the row shown without matches', async () => {
		const screen = await render(Autocomplete, {
			label: 'Service',
			items: services,
			noResultsText: 'No services'
		});
		await screen.getByRole('combobox').click();
		await userEvent.keyboard('zzz');
		await expect.element(screen.getByRole('status')).toHaveTextContent('No services');
	});

	test('v4 bug: menuSnippet is gone; the list parts take snippets with parameters', async () => {
		const itemCalls: unknown[] = [];
		const itemSnippet = createRawSnippet<
			[{ item: Item; index: number; selected: boolean; highlighted: boolean }]
		>((params) => {
			itemCalls.push(params());
			return { render: () => `<span>${params().item.label}</span>` };
		});
		const screen = await render(Autocomplete, {
			label: 'Service',
			items: services,
			values: [services[1]],
			itemSnippet,
			emptySnippet: snippetOf<{ searchText: string | undefined }>(
				({ searchText }) => `<em>Nothing for ${searchText}</em>`
			)
		});
		await screen.getByRole('combobox').click();
		await expect.element(screen.getByRole('option', { name: 'Haircut' })).toBeInTheDocument();
		expect(itemCalls).toContainEqual({
			item: services[1],
			index: 1,
			selected: true,
			highlighted: false
		});
		await userEvent.fill(screen.getByRole('combobox'), 'xyz');
		await expect.element(screen.getByRole('status')).toHaveTextContent('Nothing for xyz');
	});

	test('v4 bug: itemSnippet replaces the option content; click, role and state stay', async () => {
		const onchange = vi.fn();
		const screen = await render(Autocomplete, {
			label: 'Service',
			items: services,
			onchange,
			itemSnippet: snippetOf<{ item: Item }>(
				({ item }) => `<b data-testid="custom-${item.value}">${item.label}</b>`
			)
		});
		await screen.getByRole('combobox').click();
		await screen.getByTestId('custom-color').click();
		expect(onchange).toHaveBeenCalledOnce();
		await screen.getByRole('combobox').click();
		const option = screen.getByRole('option', { name: 'Color' });
		await expect.element(option).toHaveAttribute('aria-selected', 'true');
		await expect.element(option).toHaveAttribute('data-selected');
	});

	test('v4 bug: options are not tab stops and clicking one keeps the focus', async () => {
		const screen = await render(Autocomplete, {
			label: 'Services',
			items: services,
			multiple: true
		});
		const input = screen.getByRole('combobox');
		await input.click();
		for (const option of screen.getByRole('option').elements()) {
			expect(option).toHaveAttribute('tabindex', '-1');
		}
		await screen.getByRole('option', { name: 'Balayage' }).click();
		await expect.element(input).toHaveFocus();
		await expect.element(input).toHaveAttribute('aria-expanded', 'true');
	});

	test('v4 bug: typing does not remount the list', async () => {
		const screen = await render(Autocomplete, { label: 'Service', items: services });
		await screen.getByRole('combobox').click();
		const listbox = screen.getByRole('listbox').element();
		const menu = listbox.closest('.aurora-autocomplete-menu');
		await userEvent.keyboard('c');
		await expect.poll(optionLabels).toEqual(['Haircut', 'Color', 'Pédicure']);
		expect(listbox.isConnected).toBe(true);
		expect(screen.getByRole('listbox').element()).toBe(listbox);
		expect(listbox.closest('.aurora-autocomplete-menu')).toBe(menu);
	});

	test('v4 bug: the list stays closed after Enter picks an option', async () => {
		const screen = await render(Autocomplete, { label: 'Service', items: services });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('col{Enter}');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await new Promise((resolve) => setTimeout(resolve, 120));
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
	});

	test('v4 bug: the hint sits outside the clickable field and describes the input', async () => {
		const screen = await render(Autocomplete, {
			label: 'Service',
			items: services,
			hint: 'Choose a service',
			state: 'error'
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveAccessibleDescription('Choose a service');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		expect(screen.container.querySelector('.aurora-autocomplete')).toHaveAttribute(
			'data-state',
			'error'
		);
		const hint = screen.getByText('Choose a service');
		expect(hint.element().closest('.aurora-autocomplete-field')).toBeNull();
		await hint.click();
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(input).not.toHaveFocus();
	});

	test('v4 bug: the focused field shows a focus ring', async () => {
		const screen = await render(Autocomplete, { label: 'Service', items: services });
		const field = screen.container.querySelector('.aurora-autocomplete-field')!;
		const before = getComputedStyle(field).boxShadow;
		await screen.getByRole('combobox').click();
		await expect.poll(() => getComputedStyle(field).boxShadow).not.toBe(before);
		expect(getComputedStyle(field).boxShadow).not.toBe('none');
	});

	test('v4 bug: openingId is gone; each field has its own list and closes the others', async () => {
		const first = await render(Autocomplete, { label: 'First', items: services });
		const second = await render(Autocomplete, { label: 'Second', items: services });
		const a = first.getByRole('combobox', { name: 'First' });
		const b = second.getByRole('combobox', { name: 'Second' });
		await a.click();
		await expect.element(a).toHaveAttribute('aria-expanded', 'true');
		const firstList = a.element().getAttribute('aria-controls');
		(b.element() as HTMLInputElement).focus();
		await expect.element(b).toHaveAttribute('aria-expanded', 'true');
		await expect.element(a).toHaveAttribute('aria-expanded', 'false');
		expect(b.element().getAttribute('aria-controls')).not.toBe(firstList);
	});

	test('mobileDrawer opens a bottom drawer with its own search field', async () => {
		await page.viewport(800, 700);
		try {
			const screen = await render(Autocomplete, {
				label: 'Branches',
				items: services,
				multiple: true,
				mobileDrawer: true
			});
			const input = screen.getByRole('combobox', { name: 'Branches' });
			await expect.element(input).toHaveAttribute('readonly');
			await input.click();
			const drawer = screen.getByRole('dialog', { name: 'Branches' });
			await expect.element(drawer).toBeVisible();
			const search = drawer.getByRole('combobox');
			await expect.element(search).toHaveFocus();
			await userEvent.keyboard('bal{Enter}');
			await expect
				.element(drawer.getByRole('option', { name: 'Balayage' }))
				.toHaveAttribute('aria-selected', 'true');
			await userEvent.keyboard('{Escape}');
			await expect.element(drawer).not.toBeInTheDocument();
			await expect.element(input).toHaveFocus();
			await expect
				.element(screen.getByRole('button', { name: 'Remove Balayage' }))
				.toBeInTheDocument();
		} finally {
			await page.viewport(1280, 800);
		}
	});

	test('keeps the focus border color while the pointer is over the focused field', async () => {
		const target = document.createElement('div');
		target.style.cssText = [
			'--global-duration: 0s',
			'--autocomplete-focus-border-color: rgb(1, 2, 3)',
			'--autocomplete-hover-border-color: rgb(4, 5, 6)'
		].join(';');
		document.body.append(target);
		const screen = await render(Autocomplete, { target, props: { items: services } });
		const input = screen.getByRole('combobox');
		await input.click();
		await input.hover();
		const field = target.querySelector('.aurora-autocomplete-field')!;
		expect(getComputedStyle(field).borderTopColor).toBe('rgb(1, 2, 3)');
		target.remove();
	});
});
