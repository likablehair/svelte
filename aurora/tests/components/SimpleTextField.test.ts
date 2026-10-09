import { mdiClose, mdiHelpCircleOutline, mdiMagnify, mdiStoreOutline } from '@mdi/js';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import SimpleTextField from '#lib/components/simple/forms/SimpleTextField.svelte';

function host(style: string) {
	const element = document.createElement('div');
	element.style.cssText = style;
	document.body.append(element);
	return element;
}

function selectors(rules: CSSRuleList): string[] {
	return [...rules].flatMap((rule) => [
		...(rule instanceof CSSStyleRule ? [rule.selectorText] : []),
		...('cssRules' in rule ? selectors((rule as CSSGroupingRule).cssRules) : [])
	]);
}

describe('SimpleTextField', () => {
	test('renders a text input linked to its label', async () => {
		const screen = await render(SimpleTextField, { label: 'Email', placeholder: 'name@salon.com' });
		const input = screen.getByRole('textbox', { name: 'Email' });
		await expect.element(input).toHaveAttribute('type', 'text');
		await expect.element(input).toHaveAttribute('placeholder', 'name@salon.com');
		await screen.getByText('Email').click();
		await expect.element(input).toHaveFocus();
	});

	test('uses the given id or generates one, so the label always points to the input', async () => {
		const own = await render(SimpleTextField, { label: 'Code', id: 'code' });
		await expect.element(own.getByRole('textbox', { name: 'Code' })).toHaveAttribute('id', 'code');

		const generated = await render(SimpleTextField, { label: 'Name' });
		const input = generated.getByRole('textbox', { name: 'Name' }).element() as HTMLInputElement;
		expect(input.id).not.toBe('');
		expect(generated.container.querySelector('label')?.htmlFor).toBe(input.id);
	});

	test('forwards native attributes to the input and each class to its part', async () => {
		const screen = await render(SimpleTextField, {
			label: 'Name',
			hint: 'As on the ID card',
			autocomplete: 'name',
			maxlength: 20,
			title: 'Full name',
			'data-testid': 'name-input',
			class: { container: 'c', label: 'l', row: 'r', field: 'f', input: 'i', hint: 'h' }
		});
		const input = screen.getByTestId('name-input');
		await expect.element(input).toHaveAttribute('autocomplete', 'name');
		await expect.element(input).toHaveAttribute('maxlength', '20');
		await expect.element(input).toHaveAttribute('title', 'Full name');
		await expect.element(input).toHaveClass('i');
		const root = screen.container.querySelector('.aurora-text-field');
		expect(root?.classList.contains('c')).toBe(true);
		expect(root?.querySelector('label')?.classList.contains('l')).toBe(true);
		expect(root?.querySelector('.aurora-text-field-row')?.classList.contains('r')).toBe(true);
		expect(root?.querySelector('.aurora-text-field-control')?.classList.contains('f')).toBe(true);
		expect(root?.querySelector('.aurora-text-field-hint')?.classList.contains('h')).toBe(true);
	});

	test('hint describes the input; state="error" sets aria-invalid, data-state and an icon', async () => {
		const screen = await render(SimpleTextField, {
			label: 'Phone',
			hint: 'Invalid phone number',
			state: 'error'
		});
		const input = screen.getByRole('textbox', { name: 'Phone' });
		await expect.element(input).toHaveAccessibleDescription('Invalid phone number');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		const root = screen.container.querySelector('.aurora-text-field')!;
		expect(root.getAttribute('data-state')).toBe('error');
		expect(root.querySelector('.aurora-text-field-state-icon')).not.toBeNull();
	});

	test('state="success" shows its icon but is not invalid; no state means no data-state', async () => {
		const screen = await render(SimpleTextField, { label: 'Promo', state: 'success' });
		const input = screen.getByRole('textbox', { name: 'Promo' });
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		await expect.element(input).not.toHaveAttribute('aria-describedby');
		const root = screen.container.querySelector('.aurora-text-field')!;
		expect(root.getAttribute('data-state')).toBe('success');
		expect(root.querySelector('.aurora-text-field-state-icon')).not.toBeNull();

		await screen.rerender({ state: undefined });
		expect(root.hasAttribute('data-state')).toBe(false);
		expect(root.querySelector('.aurora-text-field-state-icon')).toBeNull();
	});

	test('disabled and readonly reach the input and are exposed as data attributes', async () => {
		const disabled = await render(SimpleTextField, { label: 'Branch', value: 'Milan', disabled: true });
		await expect.element(disabled.getByRole('textbox', { name: 'Branch' })).toBeDisabled();
		const disabledRoot = disabled.container.querySelector('.aurora-text-field')!;
		expect(disabledRoot.getAttribute('data-disabled')).toBe('true');
		expect(disabledRoot.hasAttribute('data-readonly')).toBe(false);

		const readonly = await render(SimpleTextField, { label: 'Customer', value: 'C-1', readonly: true });
		const input = readonly.getByRole('textbox', { name: 'Customer' });
		await expect.element(input).toHaveAttribute('readonly');
		expect(
			readonly.container.querySelector('.aurora-text-field')?.getAttribute('data-readonly')
		).toBe('true');
		await input.click();
		await userEvent.keyboard('x');
		await expect.element(input).toHaveValue('C-1');
	});

	test('callbacks receive the native events', async () => {
		const oninput = vi.fn();
		const onchange = vi.fn();
		const onkeydown = vi.fn();
		const onfocus = vi.fn();
		const onblur = vi.fn();
		const target = host('');
		const screen = await render(SimpleTextField, {
			target,
			props: { label: 'Name', oninput, onchange, onkeydown, onfocus, onblur }
		});
		target.append(Object.assign(document.createElement('button'), { textContent: 'Next' }));
		await screen.getByRole('textbox', { name: 'Name' }).click();
		await userEvent.keyboard('ab');
		await userEvent.keyboard('{Tab}');
		expect(onfocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
		expect(oninput).toHaveBeenCalledTimes(2);
		expect(oninput.mock.calls[0][0]).toBeInstanceOf(InputEvent);
		expect(onkeydown.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
		await expect.poll(() => onblur.mock.calls.length).toBe(1);
		expect(onblur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange.mock.calls[0][0].target).toBeInstanceOf(HTMLInputElement);
	});

	test('bind:value follows typing and outside changes', async () => {
		let value: string | number | null | undefined = 'start';
		const screen = await render(SimpleTextField, {
			label: 'Name',
			get value() {
				return value;
			},
			set value(next) {
				value = next;
			}
		});
		const input = screen.getByRole('textbox', { name: 'Name' });
		await expect.element(input).toHaveValue('start');
		await input.fill('typed');
		expect(value).toBe('typed');
		await screen.rerender({ value: 'outside' });
		await expect.element(input).toHaveValue('outside');
	});

	test('passes the native type; a number field binds a number', async () => {
		const email = await render(SimpleTextField, { label: 'Email', type: 'email' });
		await expect.element(email.getByRole('textbox', { name: 'Email' })).toHaveAttribute('type', 'email');

		let value: string | number | null | undefined;
		const number = await render(SimpleTextField, {
			label: 'Age',
			type: 'number',
			get value() {
				return value;
			},
			set value(next) {
				value = next;
			}
		});
		await number.getByRole('spinbutton', { name: 'Age' }).fill('42');
		expect(value).toBe(42);
	});

	test('icon props are SVG paths, outside and inside the field on both sides', async () => {
		const screen = await render(SimpleTextField, {
			label: 'Search',
			prependIcon: mdiStoreOutline,
			prependInnerIcon: mdiMagnify,
			appendInnerIcon: mdiClose,
			appendIcon: mdiHelpCircleOutline
		});
		const d = (element: Element) => element.querySelector('path')?.getAttribute('d');
		const row = screen.container.querySelector('.aurora-text-field-row')!;
		const [outerStart, control, outerEnd] = [...row.children];
		expect(d(outerStart)).toBe(mdiStoreOutline);
		expect(control.classList.contains('aurora-text-field-control')).toBe(true);
		expect(d(outerEnd)).toBe(mdiHelpCircleOutline);
		const [innerStart, input, innerEnd] = [...control.children];
		expect(d(innerStart)).toBe(mdiMagnify);
		expect(input.tagName).toBe('INPUT');
		expect(d(innerEnd)).toBe(mdiClose);
	});

	test('icon size comes from --simple-text-field-icon-size, 18px by default', async () => {
		const plain = await render(SimpleTextField, { label: 'Plain', prependInnerIcon: mdiMagnify });
		const icon = plain.container.querySelector('svg')!;
		expect(getComputedStyle(icon).width).toBe('18px');

		const target = host('--simple-text-field-icon-size: 24px');
		await render(SimpleTextField, {
			target,
			props: { label: 'Sized', prependIcon: mdiStoreOutline, appendInnerIcon: mdiClose }
		});
		for (const svg of target.querySelectorAll('svg')) {
			expect(getComputedStyle(svg).width).toBe('24px');
		}
	});

	test('snippets replace label, icons, hint and state icon, and receive their values', async () => {
		const screen = await render(SimpleTextField, {
			label: 'Notes',
			hint: 'Shown to the staff',
			state: 'error',
			prependIcon: mdiStoreOutline,
			labelSnippet: createRawSnippet<[{ label: string | undefined }]>((args) => ({
				render: () => `<span>${args().label} <em>optional</em></span>`
			})),
			prependSnippet: createRawSnippet<[{ prependIcon: string | undefined }]>((args) => ({
				render: () => `<b data-testid="prepend" data-icon="${args().prependIcon}"></b>`
			})),
			hintSnippet: createRawSnippet<[{ hint: string | undefined }]>((args) => ({
				render: () => `<span>${args().hint}!</span>`
			})),
			stateIconSnippet: createRawSnippet<[{ state: 'error' | 'success' }]>((args) => ({
				render: () => `<i data-testid="state">${args().state}</i>`
			}))
		});
		const input = screen.getByRole('textbox', { name: 'Notes optional' });
		await expect.element(input).toHaveAccessibleDescription('Shown to the staff!');
		await expect
			.element(screen.getByTestId('prepend'))
			.toHaveAttribute('data-icon', mdiStoreOutline);
		await expect.element(screen.getByTestId('state')).toHaveTextContent('error');
		expect(screen.container.querySelector('.aurora-text-field-state-icon')).toBeNull();
		expect(screen.container.querySelector('.aurora-text-field-hint')?.textContent).toBe(
			'Shown to the staff!'
		);
	});

	test('takes part in a form with name, value and required', async () => {
		const form = document.createElement('form');
		document.body.append(form);
		const screen = await render(SimpleTextField, {
			target: form,
			props: { label: 'Email', type: 'email', name: 'email', required: true }
		});
		expect(form.checkValidity()).toBe(false);
		await screen.getByRole('textbox', { name: 'Email' }).fill('anna@salon.com');
		expect(form.checkValidity()).toBe(true);
		expect(new FormData(form).get('email')).toBe('anna@salon.com');
	});

	test('fills the width of its container by default (v4: 280px)', async () => {
		const target = host('width: 500px');
		await render(SimpleTextField, { target, props: { label: 'Name' } });
		expect(getComputedStyle(target.querySelector('.aurora-text-field')!).width).toBe('500px');
	});

	test('instance CSS variables override the defaults', async () => {
		const target = host(
			[
				'--global-duration: 0s',
				'--simple-text-field-width: 200px',
				'--simple-text-field-height: 50px',
				'--simple-text-field-background: rgb(1, 2, 3)',
				'--simple-text-field-border-color: rgb(4, 5, 6)',
				'--simple-text-field-hover-border-color: rgb(4, 5, 6)',
				'--simple-text-field-hint-color: rgb(7, 8, 9)'
			].join(';')
		);
		await render(SimpleTextField, { target, props: { label: 'Name', hint: 'Hint' } });
		const control = getComputedStyle(target.querySelector('.aurora-text-field-control')!);
		expect(getComputedStyle(target.querySelector('.aurora-text-field')!).width).toBe('200px');
		expect(control.height).toBe('50px');
		expect(control.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(control.borderTopColor).toBe('rgb(4, 5, 6)');
		expect(getComputedStyle(target.querySelector('.aurora-text-field-hint')!).color).toBe(
			'rgb(7, 8, 9)'
		);
	});

	test('keeps aria-describedby and aria-invalid passed by the app when hint and state are unused', async () => {
		const screen = await render(SimpleTextField, {
			label: 'Name',
			'aria-describedby': 'external-error',
			'aria-invalid': true
		});
		const input = screen.getByRole('textbox', { name: 'Name' });
		await expect.element(input).toHaveAttribute('aria-describedby', 'external-error');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	});

	test('v4 bug: no range mode; a range is two fields, each with its own accessible name', async () => {
		const v4Range = { range: true, valueTo: '20', placeholderTo: 'To', betweenLabel: '-' } as object;
		const from = await render(SimpleTextField, { label: 'From', ...v4Range });
		expect(from.container.querySelectorAll('input')).toHaveLength(1);
		expect(from.container.textContent).not.toContain('-');

		await render(SimpleTextField, { label: 'To' });
		await expect.element(from.getByRole('textbox', { name: 'From' })).toBeInTheDocument();
		await expect.element(from.getByRole('textbox', { name: 'To' })).toBeInTheDocument();
	});

	test('v4 bug: the native date picker icon is not hidden', async () => {
		const screen = await render(SimpleTextField, { label: 'Day', type: 'date' });
		await expect.element(screen.getByLabelText('Day')).toHaveAttribute('type', 'date');
		const all = [...document.styleSheets].flatMap((sheet) => selectors(sheet.cssRules));
		expect(all.some((selector) => selector.includes('aurora-text-field'))).toBe(true);
		expect(all.filter((selector) => selector.includes('calendar-picker-indicator'))).toEqual([]);
	});

	test('v4 bug: focus is visible, with a ring around the field', async () => {
		const target = host('--global-duration: 0s');
		const screen = await render(SimpleTextField, { target, props: { label: 'Name' } });
		const control = target.querySelector('.aurora-text-field-control')!;
		const before = getComputedStyle(control).boxShadow;
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
		await expect.poll(() => getComputedStyle(control).boxShadow).toMatch(/0px 0px 0px 3px/);
		expect(getComputedStyle(control).boxShadow).not.toBe(before);
	});

	test('keeps the focus border color while the pointer is over the focused field', async () => {
		const target = host(
			[
				'--global-duration: 0s',
				'--simple-text-field-focus-border-color: rgb(1, 2, 3)',
				'--simple-text-field-hover-border-color: rgb(4, 5, 6)'
			].join(';')
		);
		const screen = await render(SimpleTextField, { target, props: { label: 'Name' } });
		const input = screen.getByRole('textbox', { name: 'Name' });
		await input.click();
		await input.hover();
		const control = target.querySelector('.aurora-text-field-control')!;
		expect(getComputedStyle(control).borderTopColor).toBe('rgb(1, 2, 3)');
	});
});
