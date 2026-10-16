import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import RadioButton from '#lib/components/simple/forms/RadioButton.svelte';
import BindGroup from '../fixtures/radio-button/BindGroup.svelte';

function host(tag: string, style = '') {
	const element = document.createElement(tag);
	element.style.cssText = style;
	document.body.append(element);
	return element;
}

const root = (input: HTMLElement) => input.closest<HTMLElement>('.aurora-radio-button')!;

describe('RadioButton', () => {
	test('renders a native radio inside a root label, with a class for each part', async () => {
		const screen = await render(RadioButton, {
			value: 'monthly',
			label: 'Monthly',
			description: 'Billed every month',
			class: { container: 'c', input: 'i', label: 'l', description: 'd' }
		});
		const input = screen.getByRole('radio').element() as HTMLInputElement;
		expect(input.type).toBe('radio');
		expect(input.value).toBe('monthly');
		const label = root(input);
		expect(label.tagName).toBe('LABEL');
		expect(label).toHaveClass('aurora-radio-button', 'c');
		expect(input).toHaveClass('aurora-radio-button-circle', 'i');
		expect(label.querySelector('.aurora-radio-button-label')).toHaveClass('l');
		expect(label.querySelector('.aurora-radio-button-description')).toHaveClass('d');
	});

	test('forwards native attributes to the input', async () => {
		const screen = await render(RadioButton, {
			value: 'a',
			label: 'A',
			id: 'option-a',
			name: 'choice',
			title: 'First option',
			required: true,
			'aria-describedby': 'hint'
		});
		const radio = screen.getByRole('radio', { name: 'A' });
		await expect.element(radio).toHaveAttribute('id', 'option-a');
		await expect.element(radio).toHaveAttribute('name', 'choice');
		await expect.element(radio).toHaveAttribute('title', 'First option');
		await expect.element(radio).toHaveAttribute('aria-describedby', 'hint');
		await expect.element(radio).toBeRequired();
	});

	test('the label is the accessible name and the description only the description', async () => {
		const screen = await render(RadioButton, {
			value: 'monthly',
			label: 'Monthly',
			description: 'Billed every month'
		});
		const radio = screen.getByRole('radio');
		await expect.element(radio).toHaveAccessibleName('Monthly');
		await expect.element(radio).toHaveAccessibleDescription('Billed every month');
	});

	test('v4 bug: a click on the label text selects the radio without an id', async () => {
		const screen = await render(RadioButton, { value: 'a', label: 'Option A' });
		await screen.getByText('Option A').click();
		await expect.element(screen.getByRole('radio', { name: 'Option A' })).toBeChecked();
	});

	test('exposes checked, disabled and card as data attributes', async () => {
		const screen = await render(RadioButton, {
			value: 'a',
			group: 'a',
			label: 'A',
			disabled: true,
			card: true
		});
		const label = root(screen.getByRole('radio').element() as HTMLElement);
		expect(label.dataset.checked).toBe('true');
		expect(label.dataset.disabled).toBe('true');
		expect(label.dataset.card).toBe('true');

		const plain = await render(RadioButton, { value: 'b', group: 'a', label: 'B' });
		const other = root(plain.getByRole('radio', { name: 'B' }).element() as HTMLElement);
		expect(other.hasAttribute('data-checked')).toBe(false);
		expect(other.hasAttribute('data-disabled')).toBe(false);
		expect(other.hasAttribute('data-card')).toBe(false);
	});

	test('checked is used only while group is undefined', async () => {
		const alone = await render(RadioButton, { value: 'a', label: 'Alone', checked: true });
		await expect.element(alone.getByRole('radio', { name: 'Alone' })).toBeChecked();

		const grouped = await render(RadioButton, {
			value: 'a',
			label: 'Grouped',
			group: 'b',
			checked: true
		});
		await expect.element(grouped.getByRole('radio', { name: 'Grouped' })).not.toBeChecked();
	});

	test('v4 bug: callbacks receive native events', async () => {
		const onchange = vi.fn();
		const onfocus = vi.fn();
		const onkeydown = vi.fn();
		const screen = await render(RadioButton, {
			value: 'a',
			label: 'A',
			onchange,
			onfocus,
			onkeydown
		});
		await screen.getByRole('radio', { name: 'A' }).click();
		await userEvent.keyboard('{Shift}');
		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange.mock.calls[0][0]).toBeInstanceOf(Event);
		expect(onchange.mock.calls[0][0].type).toBe('change');
		expect(onfocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
		expect(onkeydown.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
	});

	test('v4 bug: bind:group updates the variable when the user selects a radio', async () => {
		const screen = await render(BindGroup);
		await expect.element(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
		await screen.getByText('Yearly', { exact: true }).click();
		await expect.element(screen.getByRole('status')).toHaveTextContent('yearly');
		await expect.element(screen.getByRole('radio', { name: 'Monthly' })).not.toBeChecked();
		const label = root(screen.getByRole('radio', { name: 'Yearly' }).element() as HTMLElement);
		expect(label.dataset.checked).toBe('true');
	});

	test('bind:group: a change from outside moves the selection', async () => {
		const screen = await render(BindGroup);
		await screen.getByRole('button', { name: 'Choose yearly' }).click();
		await expect.element(screen.getByRole('radio', { name: 'Yearly' })).toBeChecked();
		await expect.element(screen.getByRole('radio', { name: 'Monthly' })).not.toBeChecked();
		await screen.getByRole('button', { name: 'Clear' }).click();
		await expect.element(screen.getByRole('radio', { name: 'Yearly' })).not.toBeChecked();
	});

	test('arrow keys move the selection through the group, skipping disabled radios', async () => {
		const screen = await render(BindGroup);
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('radio', { name: 'Monthly' })).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}');
		const yearly = screen.getByRole('radio', { name: 'Yearly' });
		await expect.element(yearly).toHaveFocus();
		await expect.element(yearly).toBeChecked();
		await expect.element(screen.getByRole('status')).toHaveTextContent('yearly');
	});

	test('keeps a numeric value as a number in group', async () => {
		let group: string | number | undefined;
		const screen = await render(RadioButton, {
			value: 2,
			label: 'Two',
			get group() {
				return group;
			},
			set group(value) {
				group = value;
			}
		});
		const radio = screen.getByRole('radio', { name: 'Two' });
		await expect.element(radio).toHaveAttribute('value', '2');
		await radio.click();
		expect(group).toBe(2);
	});

	test('takes part in forms with name, value and required', async () => {
		const form = host('form') as HTMLFormElement;
		for (const value of ['monthly', 'yearly']) {
			await render(RadioButton, {
				target: form,
				props: { name: 'plan', required: true, value, label: value }
			});
		}
		expect(form.checkValidity()).toBe(false);
		await page.getByRole('radio', { name: 'yearly' }).click();
		expect(form.checkValidity()).toBe(true);
		expect(new FormData(form).get('plan')).toBe('yearly');
		form.remove();
	});

	test('disabled is native: the radio cannot be selected, also from the text', async () => {
		const onchange = vi.fn();
		const screen = await render(RadioButton, { value: 'a', label: 'A', disabled: true, onchange });
		const radio = screen.getByRole('radio', { name: 'A' });
		await expect.element(radio).toBeDisabled();
		await screen.getByText('A').click({ force: true });
		await expect.element(radio).not.toBeChecked();
		expect(onchange).not.toHaveBeenCalled();
		expect(getComputedStyle(root(radio.element() as HTMLElement)).opacity).toBe('0.4');
	});

	test('looks disabled inside a disabled fieldset', async () => {
		const fieldset = host('fieldset') as HTMLFieldSetElement;
		fieldset.disabled = true;
		const screen = await render(RadioButton, {
			target: fieldset,
			props: { value: 'a', label: 'A' }
		});
		const radio = screen.getByRole('radio', { name: 'A' });
		await expect.element(radio).toBeDisabled();
		expect(getComputedStyle(root(radio.element() as HTMLElement)).opacity).toBe('0.4');
		fieldset.remove();
	});

	test('v4 bug: keyboard focus shows a focus ring, on the whole box with card', async () => {
		const screen = await render(RadioButton, { value: 'a', label: 'A' });
		await userEvent.keyboard('{Tab}');
		const input = screen.getByRole('radio', { name: 'A' }).element() as HTMLElement;
		await expect.element(input).toHaveFocus();
		expect(getComputedStyle(input).outlineStyle).toBe('solid');
		expect(getComputedStyle(input).outlineWidth).not.toBe('0px');
		screen.unmount();

		const card = await render(RadioButton, { value: 'b', label: 'B', card: true });
		await userEvent.keyboard('{Tab}');
		const cardInput = card.getByRole('radio', { name: 'B' }).element() as HTMLElement;
		await expect.element(cardInput).toHaveFocus();
		expect(getComputedStyle(root(cardInput)).outlineStyle).toBe('solid');
		expect(getComputedStyle(cardInput).outlineStyle).toBe('none');
	});

	test('labelSnippet and descriptionSnippet replace the texts and receive them', async () => {
		const labelSnippet = createRawSnippet<[{ label: string | undefined }]>((params) => ({
			render: () => `<b>${params().label} plan</b>`
		}));
		const descriptionSnippet = createRawSnippet<[{ description: string | undefined }]>(
			(params) => ({ render: () => `<i>${params().description}, VAT included</i>` })
		);
		const screen = await render(RadioButton, {
			value: 'm',
			label: 'Monthly',
			description: '€29',
			labelSnippet,
			descriptionSnippet
		});
		const radio = screen.getByRole('radio');
		await expect.element(radio).toHaveAccessibleName('Monthly plan');
		await expect.element(radio).toHaveAccessibleDescription('€29, VAT included');
		await screen.getByText('Monthly plan').click();
		await expect.element(radio).toBeChecked();
	});

	test('binds the native input', async () => {
		let element: HTMLInputElement | undefined;
		await render(RadioButton, {
			value: 'a',
			get input() {
				return element as HTMLInputElement;
			},
			set input(value) {
				element = value;
			}
		});
		expect(element).toBeInstanceOf(HTMLInputElement);
		expect(element?.type).toBe('radio');
	});

	test('instance CSS variables override the defaults', async () => {
		const target = host(
			'div',
			'--radio-button-size: 24px; --radio-button-checked-background: rgb(1, 2, 3);' +
				' --radio-button-label-color: rgb(4, 5, 6)'
		);
		const screen = await render(RadioButton, {
			target,
			props: { value: 'a', label: 'A', checked: true }
		});
		const input = screen.getByRole('radio').element() as HTMLElement;
		const style = getComputedStyle(input);
		expect(style.width).toBe('24px');
		expect(style.height).toBe('24px');
		expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(root(input)).color).toBe('rgb(4, 5, 6)');
		target.remove();
	});
});
