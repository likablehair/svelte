import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Textarea from '#lib/components/simple/forms/Textarea.svelte';

function host(style: string) {
	const element = document.createElement('div');
	element.style.cssText = style;
	document.body.append(element);
	return element;
}

describe('Textarea', () => {
	test('renders a textarea linked to its label, with 3 rows by default', async () => {
		const screen = await render(Textarea, { label: 'Notes', placeholder: 'Allergies…' });
		const textarea = screen.getByRole('textbox', { name: 'Notes' });
		await expect.element(textarea).toHaveAttribute('rows', '3');
		await expect.element(textarea).toHaveAttribute('placeholder', 'Allergies…');
		expect(textarea.element().tagName).toBe('TEXTAREA');
		await screen.getByText('Notes').click();
		await expect.element(textarea).toHaveFocus();
	});

	test('forwards native attributes to the textarea and each class to its part', async () => {
		const screen = await render(Textarea, {
			label: 'Notes',
			hint: 'Visible to the staff',
			counter: true,
			id: 'notes',
			rows: 5,
			maxlength: 200,
			spellcheck: false,
			'data-testid': 'notes-textarea',
			class: { container: 'c', label: 'l', field: 'f', textarea: 't', hint: 'h', counter: 'n' }
		});
		const textarea = screen.getByTestId('notes-textarea');
		await expect.element(textarea).toHaveAttribute('id', 'notes');
		await expect.element(textarea).toHaveAttribute('rows', '5');
		await expect.element(textarea).toHaveAttribute('maxlength', '200');
		await expect.element(textarea).toHaveAttribute('spellcheck', 'false');
		await expect.element(textarea).toHaveClass('t');
		const root = screen.container.querySelector('.aurora-textarea')!;
		expect(root.classList.contains('c')).toBe(true);
		expect(root.querySelector('label')?.classList.contains('l')).toBe(true);
		expect(root.querySelector('label')?.htmlFor).toBe('notes');
		expect(root.querySelector('.aurora-textarea-control')?.classList.contains('f')).toBe(true);
		expect(root.querySelector('.aurora-textarea-hint')?.classList.contains('h')).toBe(true);
		expect(root.querySelector('.aurora-textarea-counter')?.classList.contains('n')).toBe(true);
	});

	test('hint and counter describe the textarea; state="error" sets aria-invalid and an icon', async () => {
		const screen = await render(Textarea, {
			label: 'Reason',
			value: 'ok',
			hint: 'Write at least 20 characters',
			counter: true,
			state: 'error'
		});
		const textarea = screen.getByRole('textbox', { name: 'Reason' });
		await expect.element(textarea).toHaveAccessibleDescription('Write at least 20 characters 2');
		await expect.element(textarea).toHaveAttribute('aria-invalid', 'true');
		const root = screen.container.querySelector('.aurora-textarea')!;
		expect(root.getAttribute('data-state')).toBe('error');
		expect(root.querySelector('.aurora-textarea-state-icon')).not.toBeNull();

		await screen.rerender({ state: 'success', hint: undefined, counter: false });
		await expect.element(textarea).not.toHaveAttribute('aria-invalid');
		await expect.element(textarea).not.toHaveAttribute('aria-describedby');
		expect(root.getAttribute('data-state')).toBe('success');
		expect(root.querySelector('.aurora-textarea-footer')).toBeNull();
	});

	test('counter shows the length, against maxlength when set, and follows typing', async () => {
		const screen = await render(Textarea, {
			label: 'Notes',
			value: 'Hello',
			counter: true,
			maxlength: 20
		});
		const counter = screen.container.querySelector('.aurora-textarea-counter')!;
		expect(counter.textContent?.trim()).toBe('5 / 20');
		await screen.getByRole('textbox', { name: 'Notes' }).fill('Hello world');
		await expect.poll(() => counter.textContent?.trim()).toBe('11 / 20');

		const unlimited = await render(Textarea, { label: 'Memo', value: 'Hi', counter: true });
		expect(
			unlimited.container.querySelector('.aurora-textarea-counter')?.textContent?.trim()
		).toBe('2');
	});

	test('disabled and readonly reach the textarea and are exposed as data attributes', async () => {
		const disabled = await render(Textarea, { label: 'Archived', value: 'Old', disabled: true });
		await expect.element(disabled.getByRole('textbox', { name: 'Archived' })).toBeDisabled();
		const disabledRoot = disabled.container.querySelector('.aurora-textarea')!;
		expect(disabledRoot.getAttribute('data-disabled')).toBe('true');
		expect(disabledRoot.hasAttribute('data-readonly')).toBe(false);

		const readonly = await render(Textarea, { label: 'Signed', value: 'Agreed', readonly: true });
		const textarea = readonly.getByRole('textbox', { name: 'Signed' });
		await expect.element(textarea).toHaveAttribute('readonly');
		expect(readonly.container.querySelector('.aurora-textarea')?.getAttribute('data-readonly')).toBe(
			'true'
		);
		await textarea.click();
		await userEvent.keyboard('x');
		await expect.element(textarea).toHaveValue('Agreed');
	});

	test('callbacks receive the native events', async () => {
		const oninput = vi.fn();
		const onchange = vi.fn();
		const onkeydown = vi.fn();
		const onfocus = vi.fn();
		const onblur = vi.fn();
		const target = host('');
		const screen = await render(Textarea, {
			target,
			props: { label: 'Notes', oninput, onchange, onkeydown, onfocus, onblur }
		});
		target.append(Object.assign(document.createElement('button'), { textContent: 'Next' }));
		await screen.getByRole('textbox', { name: 'Notes' }).click();
		await userEvent.keyboard('ab');
		await userEvent.keyboard('{Tab}');
		expect(onfocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
		expect(oninput).toHaveBeenCalledTimes(2);
		expect(oninput.mock.calls[0][0]).toBeInstanceOf(InputEvent);
		expect(onkeydown.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
		await expect.poll(() => onblur.mock.calls.length).toBe(1);
		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange.mock.calls[0][0].target).toBeInstanceOf(HTMLTextAreaElement);
	});

	test('bind:value follows typing and outside changes; Enter adds a line', async () => {
		let value: string | null | undefined = 'start';
		const screen = await render(Textarea, {
			label: 'Notes',
			get value() {
				return value;
			},
			set value(next) {
				value = next;
			}
		});
		const textarea = screen.getByRole('textbox', { name: 'Notes' });
		await expect.element(textarea).toHaveValue('start');
		await textarea.fill('one');
		await userEvent.keyboard('{Enter}two');
		expect(value).toBe('one\ntwo');
		await screen.rerender({ value: 'outside' });
		await expect.element(textarea).toHaveValue('outside');
	});

	test('snippets replace label, hint, counter and state icon, and receive their values', async () => {
		const screen = await render(Textarea, {
			label: 'Notes',
			value: 'abc',
			hint: 'Shown to the staff',
			maxlength: 50,
			counter: true,
			state: 'success',
			labelSnippet: createRawSnippet<[{ label: string | undefined }]>((args) => ({
				render: () => `<span>${args().label} <em>optional</em></span>`
			})),
			hintSnippet: createRawSnippet<[{ hint: string | undefined }]>((args) => ({
				render: () => `<span>${args().hint}!</span>`
			})),
			counterSnippet: createRawSnippet<[{ length: number; maxlength: number | undefined }]>(
				(args) => ({ render: () => `<span>${args().length} of ${args().maxlength}</span>` })
			),
			stateIconSnippet: createRawSnippet<[{ state: 'error' | 'success' }]>((args) => ({
				render: () => `<i data-testid="state">${args().state}</i>`
			}))
		});
		const textarea = screen.getByRole('textbox', { name: 'Notes optional' });
		await expect.element(textarea).toHaveAccessibleDescription('Shown to the staff! 3 of 50');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('success');
		expect(screen.container.querySelector('.aurora-textarea-state-icon')).toBeNull();
	});

	test('takes part in a form with name, value and required', async () => {
		const form = document.createElement('form');
		document.body.append(form);
		const screen = await render(Textarea, {
			target: form,
			props: { label: 'Message', name: 'message', required: true }
		});
		expect(form.checkValidity()).toBe(false);
		await screen.getByRole('textbox', { name: 'Message' }).fill('Hello');
		expect(form.checkValidity()).toBe(true);
		expect(new FormData(form).get('message')).toBe('Hello');
	});

	test('is resizable vertically by default; --textarea-resize: none turns it off', async () => {
		const resizable = await render(Textarea, { label: 'Resizable' });
		const element = resizable.getByRole('textbox', { name: 'Resizable' }).element();
		expect(getComputedStyle(element).resize).toBe('vertical');

		const target = host('--textarea-resize: none');
		await render(Textarea, { target, props: { label: 'Fixed' } });
		expect(getComputedStyle(target.querySelector('textarea')!).resize).toBe('none');
	});

	test('autoGrow grows with the content up to --textarea-max-height, without manual resize', async () => {
		const target = host('width: 300px; --textarea-max-height: 120px');
		const screen = await render(Textarea, {
			target,
			props: { label: 'Message', rows: 1, autoGrow: true }
		});
		const textarea = screen.getByRole('textbox', { name: 'Message' });
		const element = textarea.element() as HTMLTextAreaElement;
		expect(target.querySelector('.aurora-textarea')?.getAttribute('data-auto-grow')).toBe('true');
		expect(getComputedStyle(element).resize).toBe('none');
		const start = element.getBoundingClientRect().height;
		await textarea.fill('one\ntwo\nthree');
		await expect.poll(() => element.getBoundingClientRect().height).toBeGreaterThan(start * 2);
		await textarea.fill('1\n2\n3\n4\n5\n6\n7\n8\n9\n10');
		await expect.poll(() => element.getBoundingClientRect().height).toBe(120);
		await textarea.fill('x');
		await expect.poll(() => element.getBoundingClientRect().height).toBe(start);
	});

	test('instance CSS variables override the defaults; the height is the text area only', async () => {
		const target = host(
			[
				'--global-duration: 0s',
				'--textarea-width: 250px',
				'--textarea-height: 100px',
				'--textarea-padding: 10px',
				'--textarea-background: rgb(1, 2, 3)',
				'--textarea-border-color: rgb(4, 5, 6)',
				'--textarea-hover-border-color: rgb(4, 5, 6)',
				'--textarea-color: rgb(7, 8, 9)'
			].join(';')
		);
		await render(Textarea, { target, props: { label: 'Notes' } });
		const textarea = target.querySelector('textarea')!;
		const control = target.querySelector('.aurora-textarea-control')!;
		expect(getComputedStyle(target.querySelector('.aurora-textarea')!).width).toBe('250px');
		expect(getComputedStyle(textarea).height).toBe('100px');
		expect(getComputedStyle(textarea).color).toBe('rgb(7, 8, 9)');
		expect(control.getBoundingClientRect().height).toBeGreaterThanOrEqual(120);
		expect(getComputedStyle(control).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(control).borderTopColor).toBe('rgb(4, 5, 6)');
	});

	test('keeps aria-describedby and aria-invalid passed by the app when hint, counter and state are unused', async () => {
		const screen = await render(Textarea, {
			label: 'Notes',
			'aria-describedby': 'external-error',
			'aria-invalid': true
		});
		const textarea = screen.getByRole('textbox', { name: 'Notes' });
		await expect.element(textarea).toHaveAttribute('aria-describedby', 'external-error');
		await expect.element(textarea).toHaveAttribute('aria-invalid', 'true');
	});

	test('keeps the focus border color while the pointer is over the focused field', async () => {
		const target = host(
			[
				'--global-duration: 0s',
				'--textarea-focus-border-color: rgb(1, 2, 3)',
				'--textarea-hover-border-color: rgb(4, 5, 6)'
			].join(';')
		);
		const screen = await render(Textarea, { target, props: { label: 'Notes' } });
		const textarea = screen.getByRole('textbox', { name: 'Notes' });
		await textarea.click();
		await textarea.hover();
		const control = target.querySelector('.aurora-textarea-control')!;
		expect(getComputedStyle(control).borderTopColor).toBe('rgb(1, 2, 3)');
	});

	test('v4 bug: ids come from $props.id(): each label points to its own textarea', async () => {
		const first = await render(Textarea, { label: 'First' });
		await render(Textarea, { label: 'Second' });
		const a = first.getByRole('textbox', { name: 'First' }).element();
		const b = first.getByRole('textbox', { name: 'Second' }).element();
		expect(a.id).not.toBe('');
		expect(a.id).not.toBe(b.id);
		const id = a.id;
		await first.rerender({ hint: 'Changed' });
		expect(a.id).toBe(id);
	});

	test('v4 bug: focus is visible, with a ring around the field', async () => {
		const target = host('--global-duration: 0s');
		const screen = await render(Textarea, { target, props: { label: 'Notes' } });
		const control = target.querySelector('.aurora-textarea-control')!;
		const before = getComputedStyle(control).boxShadow;
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('textbox', { name: 'Notes' })).toHaveFocus();
		await expect.poll(() => getComputedStyle(control).boxShadow).toMatch(/0px 0px 0px 3px/);
		expect(getComputedStyle(control).boxShadow).not.toBe(before);
	});

	test('v4 bug: the label is a block above the field, spaced by --textarea-gap', async () => {
		const target = host('--textarea-gap: 10px');
		await render(Textarea, { target, props: { label: 'Notes' } });
		const label = target.querySelector('label')!.getBoundingClientRect();
		const control = target.querySelector('.aurora-textarea-control')!.getBoundingClientRect();
		expect(control.top - label.bottom).toBeCloseTo(10, 0);
		expect(label.left).toBeCloseTo(control.left, 0);
	});

	test('v4 bug: the textarea does not stretch to the height of its parent', async () => {
		const target = host('height: 600px');
		await render(Textarea, { target, props: { label: 'Notes' } });
		expect(target.querySelector('textarea')!.getBoundingClientRect().height).toBeLessThan(100);
	});
});
