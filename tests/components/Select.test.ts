import { mdiContentCut, mdiPalette } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Select from '#lib/components/simple/forms/Select.svelte';
import type { Item } from '#lib/components/simple/forms/item.js';
import { snippet } from '../helpers.js';

const rooms: Item[] = [
	{ value: 'a', label: 'Room A' },
	{ value: 'b', label: 'Room B' },
	{ value: 2 }
];

const operators: Item<{ initials: string }>[] = [
	{ value: 'luca', label: 'Luca Rossi', data: { initials: 'LR' } },
	{ value: 'giulia', label: 'Giulia Marini', data: { initials: 'GM' } }
];

const avatar = createRawSnippet<[{ item: Item; index: number }]>((args) => ({
	render: () => {
		const { item, index } = args();
		return `<span class="avatar">${(item.data as { initials: string }).initials}-${index}</span>`;
	}
}));

const styledPicker = () => CSS.supports('appearance', 'base-select');

function host(style: string) {
	const element = document.createElement('div');
	element.style.cssText = style;
	document.body.append(element);
	return element;
}

describe('Select', () => {
	test('renders a native select linked to its label, with one option per item', async () => {
		const screen = await render(Select, { label: 'Room', items: rooms });
		const select = screen.getByRole('combobox', { name: 'Room' });
		const options = [...(select.element() as HTMLSelectElement).options];
		expect(options.map((option) => [option.value, option.textContent?.trim()])).toEqual([
			['a', 'Room A'],
			['b', 'Room B'],
			['2', '2']
		]);
		await screen.getByText('Room', { exact: true }).click();
		await expect.element(select).toHaveFocus();
	});

	test('without placeholder the first item is selected and bound, as in a native select', async () => {
		let value: string | number | undefined;
		const screen = await render(Select, {
			label: 'Room',
			items: rooms,
			get value() {
				return value;
			},
			set value(next) {
				value = next;
			}
		});
		await expect.element(screen.getByRole('combobox', { name: 'Room' })).toHaveValue('a');
		expect(value).toBe('a');
		expect(screen.container.querySelector('.aurora-select')?.hasAttribute('data-empty')).toBe(false);
	});

	test('bind:value keeps the type of the item value and follows outside changes', async () => {
		let value: string | number | undefined = 'b';
		const screen = await render(Select, {
			label: 'Room',
			items: rooms,
			get value() {
				return value;
			},
			set value(next) {
				value = next;
			}
		});
		const select = screen.getByRole('combobox', { name: 'Room' });
		await expect.element(select).toHaveValue('b');
		await select.selectOptions('2');
		expect(value).toBe(2);
		await screen.rerender({ value: 'a' });
		await expect.element(select).toHaveValue('a');
	});

	test('forwards native attributes to the select and each class to its part', async () => {
		const screen = await render(Select, {
			label: 'Room',
			hint: 'Where the service happens',
			items: rooms,
			id: 'room',
			autocomplete: 'off',
			title: 'Room of the salon',
			'data-testid': 'room-select',
			class: { container: 'c', label: 'l', field: 'f', select: 's', option: 'o', hint: 'h' }
		});
		const select = screen.getByTestId('room-select');
		await expect.element(select).toHaveAttribute('id', 'room');
		await expect.element(select).toHaveAttribute('autocomplete', 'off');
		await expect.element(select).toHaveAttribute('title', 'Room of the salon');
		await expect.element(select).toHaveClass('s');
		const root = screen.container.querySelector('.aurora-select')!;
		expect(root.classList.contains('c')).toBe(true);
		expect(root.querySelector('label')?.classList.contains('l')).toBe(true);
		expect(root.querySelector('label')?.htmlFor).toBe('room');
		expect(root.querySelector('.aurora-select-control')?.classList.contains('f')).toBe(true);
		expect(root.querySelector('.aurora-select-hint')?.classList.contains('h')).toBe(true);
		const options = [...root.querySelectorAll('option')];
		expect(options).toHaveLength(3);
		expect(options.every((option) => option.classList.contains('o'))).toBe(true);
	});

	test('hint describes the select; state="error" sets aria-invalid, data-state and an icon', async () => {
		const screen = await render(Select, {
			label: 'Plan',
			items: rooms,
			hint: 'Choose a plan to continue',
			state: 'error'
		});
		const select = screen.getByRole('combobox', { name: 'Plan' });
		await expect.element(select).toHaveAccessibleDescription('Choose a plan to continue');
		await expect.element(select).toHaveAttribute('aria-invalid', 'true');
		const root = screen.container.querySelector('.aurora-select')!;
		expect(root.getAttribute('data-state')).toBe('error');
		expect(root.querySelector('.aurora-select-state-icon')).not.toBeNull();

		await screen.rerender({ state: 'success', hint: undefined });
		await expect.element(select).not.toHaveAttribute('aria-invalid');
		await expect.element(select).not.toHaveAttribute('aria-describedby');
		expect(root.getAttribute('data-state')).toBe('success');
	});

	test('disabled reaches the select and is exposed as data-disabled', async () => {
		const screen = await render(Select, { label: 'Plan', items: rooms, disabled: true });
		await expect.element(screen.getByRole('combobox', { name: 'Plan' })).toBeDisabled();
		expect(screen.container.querySelector('.aurora-select')?.getAttribute('data-disabled')).toBe(
			'true'
		);
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('combobox', { name: 'Plan' })).not.toHaveFocus();
	});

	test('onchange and oninput receive the native events', async () => {
		let seen: string | undefined;
		const onchange = vi.fn((event: Event) => {
			seen = (event.currentTarget as HTMLSelectElement).value;
		});
		const oninput = vi.fn();
		const screen = await render(Select, { label: 'Room', items: rooms, onchange, oninput });
		await screen.getByRole('combobox', { name: 'Room' }).selectOptions('b');
		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange.mock.calls[0][0]).toBeInstanceOf(Event);
		expect(onchange.mock.calls[0][0]).not.toHaveProperty('detail');
		expect(seen).toBe('b');
		expect(oninput).toHaveBeenCalledOnce();
	});

	test('takes part in a form: name submits the value, required blocks the placeholder', async () => {
		const form = document.createElement('form');
		document.body.append(form);
		const screen = await render(Select, {
			target: form,
			props: {
				label: 'Payment',
				name: 'payment',
				placeholder: 'Choose…',
				required: true,
				items: [
					{ value: 'card', label: 'Card' },
					{ value: 'cash', label: 'Cash' }
				]
			}
		});
		expect(form.checkValidity()).toBe(false);
		await screen.getByRole('combobox', { name: 'Payment' }).selectOptions('cash');
		expect(form.checkValidity()).toBe(true);
		expect(new FormData(form).get('payment')).toBe('cash');
	});

	test('snippets replace label, hint, state icon and chevron', async () => {
		const screen = await render(Select, {
			label: 'Plan',
			hint: 'Billed monthly',
			state: 'success',
			items: rooms,
			labelSnippet: createRawSnippet<[{ label: string | undefined }]>((args) => ({
				render: () => `<span>${args().label} <em>required</em></span>`
			})),
			hintSnippet: createRawSnippet<[{ hint: string | undefined }]>((args) => ({
				render: () => `<span>${args().hint}!</span>`
			})),
			stateIconSnippet: createRawSnippet<[{ state: 'error' | 'success' }]>((args) => ({
				render: () => `<i data-testid="state">${args().state}</i>`
			})),
			chevronSnippet: snippet('<i data-testid="chevron"></i>')
		});
		const select = screen.getByRole('combobox', { name: 'Plan required' });
		await expect.element(select).toHaveAccessibleDescription('Billed monthly!');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('success');
		await expect.element(screen.getByTestId('chevron')).toBeInTheDocument();
		expect(screen.container.querySelector('.aurora-select-state-icon')).toBeNull();
	});

	test('instance CSS variables override the defaults', async () => {
		const target = host(
			[
				'--global-duration: 0s',
				'--select-width: 220px',
				'--select-height: 50px',
				'--select-padding-x: 20px',
				'--select-background: rgb(1, 2, 3)',
				'--select-border-color: rgb(4, 5, 6)',
				'--select-hover-border-color: rgb(4, 5, 6)',
				'--select-color: rgb(7, 8, 9)'
			].join(';')
		);
		await render(Select, { target, props: { label: 'Room', items: rooms } });
		const control = getComputedStyle(target.querySelector('.aurora-select-control')!);
		const select = getComputedStyle(target.querySelector('select')!);
		expect(getComputedStyle(target.querySelector('.aurora-select')!).width).toBe('220px');
		expect(control.height).toBe('50px');
		expect(control.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(control.borderTopColor).toBe('rgb(4, 5, 6)');
		expect(select.paddingLeft).toBe('20px');
		expect(select.color).toBe('rgb(7, 8, 9)');
	});

	test('keeps aria-describedby and aria-invalid passed by the app when hint and state are unused', async () => {
		const screen = await render(Select, {
			label: 'Room',
			items: rooms,
			'aria-describedby': 'external-error',
			'aria-invalid': true
		});
		const select = screen.getByRole('combobox', { name: 'Room' });
		await expect.element(select).toHaveAttribute('aria-describedby', 'external-error');
		await expect.element(select).toHaveAttribute('aria-invalid', 'true');
	});

	test('keeps the focus border color while the pointer is over the focused field', async () => {
		const target = host(
			[
				'--global-duration: 0s',
				'--select-focus-border-color: rgb(1, 2, 3)',
				'--select-hover-border-color: rgb(4, 5, 6)'
			].join(';')
		);
		const screen = await render(Select, { target, props: { label: 'Room', items: rooms } });
		const select = screen.getByRole('combobox', { name: 'Room' });
		(select.element() as HTMLSelectElement).focus();
		await select.hover();
		const control = target.querySelector('.aurora-select-control')!;
		expect(getComputedStyle(control).borderTopColor).toBe('rgb(1, 2, 3)');
	});

	test('v4 bug: placeholder is a hidden option and value stays undefined until a choice', async () => {
		let value: string | number | undefined;
		const screen = await render(Select, {
			label: 'Duration',
			placeholder: 'Choose a duration',
			items: rooms,
			get value() {
				return value;
			},
			set value(next) {
				value = next;
			}
		});
		const select = screen.getByRole('combobox', { name: 'Duration' });
		const element = select.element() as HTMLSelectElement;
		const [placeholder] = element.selectedOptions;
		expect(placeholder.textContent).toBe('Choose a duration');
		expect(placeholder.hidden).toBe(true);
		expect(placeholder.disabled).toBe(true);
		expect(element.hasAttribute('placeholder')).toBe(false);
		expect(value).toBeUndefined();
		await select.selectOptions('b');
		expect(value).toBe('b');

		const unbound = await render(Select, { label: 'Room', placeholder: 'Choose…', items: rooms });
		const root = unbound.container.querySelector('.aurora-select')!;
		expect(root.getAttribute('data-empty')).toBe('true');
		await unbound.getByRole('combobox', { name: 'Room' }).selectOptions('a');
		await expect.poll(() => root.hasAttribute('data-empty')).toBe(false);
	});

	test('v4 bug: item icons are drawn in the list where the styled picker is supported', async () => {
		const screen = await render(Select, {
			label: 'Service',
			items: [
				{ value: 'cut', label: 'Haircut', icon: mdiContentCut },
				{ value: 'color', label: 'Color', icon: mdiPalette }
			]
		});
		const option = screen.container.querySelectorAll('option')[1];
		expect(option.textContent?.trim()).toBe('Color');
		expect(option.querySelector('path')?.getAttribute('d')).toBe(mdiPalette);
		if (!styledPicker()) return;
		await screen.getByRole('combobox', { name: 'Service' }).click();
		await expect
			.poll(() => option.querySelector('svg')!.getBoundingClientRect().width)
			.toBeGreaterThan(0);
		await userEvent.keyboard('{Escape}');
	});

	test('v4 bug: each option gets its own content from itemSnippet instead of one optionAttributes', async () => {
		const screen = await render(Select, {
			label: 'Operator',
			items: operators,
			itemSnippet: avatar
		});
		const avatars = () =>
			[...screen.container.querySelectorAll('option .avatar')].map((a) => a.textContent);
		if (styledPicker()) {
			await expect.poll(avatars).toEqual(['LR-0', 'GM-1']);
		} else {
			expect(avatars()).toEqual([]);
			const options = [...screen.container.querySelectorAll('option')];
			expect(options.map((option) => option.textContent?.trim())).toEqual([
				'Luca Rossi',
				'Giulia Marini'
			]);
		}
	});

	test('the field shows the itemSnippet content of the initially selected option', async () => {
		const screen = await render(Select, {
			label: 'Operator',
			items: operators,
			value: 'giulia',
			itemSnippet: avatar
		});
		await expect.element(screen.getByRole('combobox', { name: 'Operator' })).toHaveValue('giulia');
		if (!styledPicker()) return;
		await expect
			.poll(() => screen.container.querySelector('selectedcontent')?.textContent)
			.toContain('GM-1');
	});

	test('v4 bug: focus is visible, with a ring and --select-focus-border-color', async () => {
		const target = host('--global-duration: 0s; --select-focus-border-color: rgb(1, 2, 3)');
		const screen = await render(Select, { target, props: { label: 'Plan', items: rooms } });
		const spacer = Object.assign(document.createElement('div'), { textContent: 'Spacer' });
		target.prepend(spacer);
		await userEvent.hover(spacer);
		const control = target.querySelector('.aurora-select-control')!;
		const before = getComputedStyle(control).boxShadow;
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('combobox', { name: 'Plan' })).toHaveFocus();
		await expect.poll(() => getComputedStyle(control).boxShadow).toMatch(/0px 0px 0px 3px/);
		expect(before).not.toMatch(/0px 0px 0px 3px/);
		expect(getComputedStyle(control).borderTopColor).toBe('rgb(1, 2, 3)');
	});
});
