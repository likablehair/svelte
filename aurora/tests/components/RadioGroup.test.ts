import { mdiEmailOutline } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import RadioGroup from '#lib/components/simple/forms/RadioGroup.svelte';
import type { RadioItem } from '#lib/components/simple/forms/item.ts';
import FormExample from '../../src/docs/examples/radio-group/03-form.svelte';

const items: RadioItem[] = [
	{ value: 'email', label: 'Email' },
	{ value: 'sms', label: 'SMS' },
	{ value: 'phone', label: 'Phone call', disabled: true },
	{ value: 'post', label: 'Post' }
];

const radios = (container: HTMLElement) => [
	...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')
];

describe('RadioGroup', () => {
	test('renders a fieldset with role radiogroup, named by its legend', async () => {
		const screen = await render(RadioGroup, { label: 'Contact', items });
		const group = screen.getByRole('radiogroup', { name: 'Contact' });
		await expect.element(group).toBeInTheDocument();
		expect(group.element().tagName).toBe('FIELDSET');
		expect(group.element().querySelector('legend')?.textContent).toBe('Contact');
		expect(radios(screen.container)).toHaveLength(4);
	});

	test('forwards native attributes to the fieldset and the class object to each part', async () => {
		const screen = await render(RadioGroup, {
			label: 'Contact',
			hint: 'Only for reminders',
			items,
			id: 'contact',
			title: 'How we reach you',
			class: { container: 'c', label: 'l', items: 'is', item: 'i', hint: 'h' }
		});
		const group = screen.getByRole('radiogroup').element();
		expect(group.id).toBe('contact');
		expect(group.getAttribute('title')).toBe('How we reach you');
		expect(group).toHaveClass('aurora-radio-group', 'c');
		expect(group.querySelector('legend')).toHaveClass('aurora-radio-group-label', 'l');
		expect(group.querySelector('.aurora-radio-group-items')).toHaveClass('is');
		expect(group.querySelectorAll('.aurora-radio-button.i')).toHaveLength(4);
		expect(group.querySelector('.aurora-radio-group-hint')).toHaveClass('h');
	});

	test('names each radio by its label, or its value, with icon and description', async () => {
		const screen = await render(RadioGroup, {
			items: [
				{ value: 'email', label: 'Email', icon: mdiEmailOutline, description: 'Once a week' },
				{ value: 3 }
			]
		});
		const email = screen.getByRole('radio', { name: 'Email' });
		await expect.element(email).toHaveAccessibleName('Email');
		await expect.element(email).toHaveAccessibleDescription('Once a week');
		const label = email.element().closest('label')!;
		expect(label.querySelector('svg path')?.getAttribute('d')).toBe(mdiEmailOutline);
		await expect.element(screen.getByRole('radio', { name: '3' })).toHaveAttribute('value', '3');
	});

	test('the radios share a generated name, or the given one', async () => {
		const generated = await render(RadioGroup, { items });
		const names = new Set(radios(generated.container).map((radio) => radio.name));
		expect(names.size).toBe(1);
		expect([...names][0]).not.toBe('');
		generated.unmount();

		const named = await render(RadioGroup, { items, name: 'contact' });
		expect(radios(named.container).every((radio) => radio.name === 'contact')).toBe(true);
	});

	test('bind:value follows the choice and keeps numeric values as numbers', async () => {
		let value: string | number | undefined = 'sms';
		const screen = await render(RadioGroup, {
			items: [...items, { value: 7, label: 'Seven' }],
			get value() {
				return value;
			},
			set value(next) {
				value = next;
			}
		});
		await expect.element(screen.getByRole('radio', { name: 'SMS' })).toBeChecked();
		await screen.getByText('Email').click();
		expect(value).toBe('email');
		await screen.getByText('Seven').click();
		expect(value).toBe(7);
		await expect.element(screen.getByRole('radio', { name: 'Email' })).not.toBeChecked();
	});

	test('a value set from outside checks the matching radio', async () => {
		const screen = await render(RadioGroup, { items, value: 'email' });
		await expect.element(screen.getByRole('radio', { name: 'Email' })).toBeChecked();
		await screen.rerender({ value: 'post' });
		await expect.element(screen.getByRole('radio', { name: 'Post' })).toBeChecked();
		await expect.element(screen.getByRole('radio', { name: 'Email' })).not.toBeChecked();
		await screen.rerender({ value: undefined });
		await expect.element(screen.getByRole('radio', { name: 'Post' })).not.toBeChecked();
	});

	test('Tab enters the group and arrow keys move the selection past disabled items', async () => {
		let value: string | number | undefined = 'sms';
		const screen = await render(RadioGroup, {
			items,
			get value() {
				return value;
			},
			set value(next) {
				value = next;
			}
		});
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('radio', { name: 'SMS' })).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}');
		const post = screen.getByRole('radio', { name: 'Post' });
		await expect.element(post).toHaveFocus();
		await expect.element(post).toBeChecked();
		expect(value).toBe('post');
	});

	test('disabled disables the whole group natively; item.disabled only its option', async () => {
		const one = await render(RadioGroup, { items });
		await expect.element(one.getByRole('radio', { name: 'Phone call' })).toBeDisabled();
		await expect.element(one.getByRole('radio', { name: 'Email' })).toBeEnabled();
		one.unmount();

		const all = await render(RadioGroup, { items, disabled: true });
		const group = all.getByRole('radiogroup');
		await expect.element(group).toHaveAttribute('data-disabled', 'true');
		expect(group.element()).toHaveProperty('disabled', true);
		expect(radios(all.container).every((radio) => radio.disabled)).toBe(true);
	});

	test('required blocks the form until an option is chosen, then sends name=value', async () => {
		const screen = await render(FormExample);
		const group = screen.getByRole('radiogroup', { name: 'Payment method' });
		await expect.element(group).toHaveAttribute('aria-required', 'true');
		await expect.element(screen.getByRole('radio', { name: 'Cash at the salon' })).toBeRequired();
		await screen.getByRole('button', { name: 'Pay' }).click();
		await expect.element(group).toHaveAttribute('aria-invalid', 'true');
		await expect.element(group).toHaveAttribute('data-state', 'error');
		await expect.element(group).toHaveAccessibleDescription('Choose a payment method');
		await expect.element(screen.getByRole('radio', { name: 'Credit card' })).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}');
		await expect.element(screen.getByRole('radio', { name: 'Bank transfer' })).toBeChecked();
		await expect.element(group).not.toHaveAttribute('aria-invalid');
		await screen.getByRole('button', { name: 'Pay' }).click();
		await expect.element(screen.getByText('payment=transfer')).toBeInTheDocument();
	});

	test('hint describes the group; state is exposed and only error sets aria-invalid', async () => {
		const screen = await render(RadioGroup, {
			label: 'Contact',
			items,
			hint: 'Saved',
			state: 'success'
		});
		const group = screen.getByRole('radiogroup', { name: 'Contact' });
		await expect.element(group).toHaveAccessibleDescription('Saved');
		await expect.element(group).toHaveAttribute('data-state', 'success');
		await expect.element(group).not.toHaveAttribute('aria-invalid');
		await expect.element(group).not.toHaveAttribute('aria-required');
	});

	test('orientation and card are exposed, and card reaches every radio', async () => {
		const vertical = await render(RadioGroup, { items });
		const list = vertical.container.querySelector('.aurora-radio-group-items')!;
		await expect
			.element(vertical.getByRole('radiogroup'))
			.toHaveAttribute('data-orientation', 'vertical');
		expect(getComputedStyle(list).flexDirection).toBe('column');
		vertical.unmount();

		const horizontal = await render(RadioGroup, { items, orientation: 'horizontal', card: true });
		const group = horizontal.getByRole('radiogroup');
		await expect.element(group).toHaveAttribute('data-orientation', 'horizontal');
		await expect.element(group).toHaveAttribute('data-card', 'true');
		const row = horizontal.container.querySelector('.aurora-radio-group-items')!;
		expect(getComputedStyle(row).flexDirection).toBe('row');
		const cards = horizontal.container.querySelectorAll('.aurora-radio-button[data-card]');
		expect(cards).toHaveLength(4);
	});

	test('snippets replace legend, option texts and hint, and receive their data', async () => {
		type ItemParams = { item: RadioItem; index: number; checked: boolean };
		const screen = await render(RadioGroup, {
			label: 'Contact',
			hint: 'Pick one',
			value: 'sms',
			items: items.slice(0, 2),
			labelSnippet: createRawSnippet<[{ label: string | undefined }]>((params) => ({
				render: () => `<span>${params().label} preference</span>`
			})),
			itemSnippet: createRawSnippet<[ItemParams]>((params) => ({
				render: () => {
					const { index, item, checked } = params();
					return `<span>${index}. ${item.label}${checked ? ' (current)' : ''}</span>`;
				}
			})),
			itemDescriptionSnippet: createRawSnippet<[ItemParams]>((params) => ({
				render: () => `<span>about ${params().item.value}</span>`
			})),
			hintSnippet: createRawSnippet<[{ hint: string | undefined }]>((params) => ({
				render: () => `<span>${params().hint}!</span>`
			}))
		});
		await expect.element(screen.getByRole('radiogroup')).toHaveAccessibleName('Contact preference');
		await expect.element(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Pick one!');
		const sms = screen.getByRole('radio', { name: '1. SMS (current)' });
		await expect.element(sms).toBeChecked();
		await expect.element(sms).toHaveAccessibleDescription('about sms');
		await screen.getByText('0. Email').click();
		await expect.element(screen.getByRole('radio', { name: '0. Email' })).toBeChecked();
	});

	test('instance CSS variables reach the hint and, in the error state, the circles', async () => {
		const screen = await render(RadioGroup, {
			items,
			hint: 'Choose one',
			state: 'error',
			style: '--radio-group-error-color: rgb(1, 2, 3); --radio-group-hint-font-size: 15px'
		});
		const hint = screen.getByText('Choose one').element();
		expect(getComputedStyle(hint).color).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(hint).fontSize).toBe('15px');
		expect(getComputedStyle(radios(screen.container)[0]).borderTopColor).toBe('rgb(1, 2, 3)');
	});
});
