import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Checkbox from '#lib/components/simple/forms/Checkbox.svelte';

function host(style: string) {
	const element = document.createElement('div');
	element.style.cssText = style;
	document.body.append(element);
	return element;
}

describe('Checkbox', () => {
	test('renders a native checkbox inside a label; a click on the text toggles it', async () => {
		const screen = await render(Checkbox, { label: 'Send SMS reminders' });
		const box = screen.getByRole('checkbox', { name: 'Send SMS reminders' });
		await expect.element(box).toHaveAttribute('type', 'checkbox');
		expect(box.element().closest('label')?.classList.contains('aurora-checkbox')).toBe(true);
		await expect.element(box).not.toBeChecked();
		await screen.getByText('Send SMS reminders').click();
		await expect.element(box).toBeChecked();
	});

	test('forwards native attributes to the input and each class to its part', async () => {
		const screen = await render(Checkbox, {
			label: 'Terms',
			id: 'terms',
			name: 'terms',
			value: 'accepted',
			title: 'Accept the terms',
			'aria-describedby': 'terms-help',
			'data-testid': 'terms-box',
			class: { container: 'c', input: 'i', label: 'l' }
		});
		const box = screen.getByTestId('terms-box');
		await expect.element(box).toHaveAttribute('id', 'terms');
		await expect.element(box).toHaveAttribute('name', 'terms');
		await expect.element(box).toHaveAttribute('value', 'accepted');
		await expect.element(box).toHaveAttribute('title', 'Accept the terms');
		await expect.element(box).toHaveAttribute('aria-describedby', 'terms-help');
		await expect.element(box).toHaveClass('aurora-checkbox-box', 'i');
		const root = screen.container.querySelector('label.aurora-checkbox')!;
		expect(root.classList.contains('c')).toBe(true);
		expect(root.querySelector('.aurora-checkbox-label')?.classList.contains('l')).toBe(true);
	});

	test('bind:checked follows clicks and outside changes; data-checked mirrors the prop', async () => {
		let checked: boolean | undefined = true;
		const screen = await render(Checkbox, {
			label: 'Newsletter',
			get checked() {
				return checked;
			},
			set checked(next) {
				checked = next;
			}
		});
		const box = screen.getByRole('checkbox', { name: 'Newsletter' });
		const root = screen.container.querySelector('.aurora-checkbox')!;
		await expect.element(box).toBeChecked();
		expect(root.getAttribute('data-checked')).toBe('true');
		await box.click();
		expect(checked).toBe(false);
		await screen.rerender({ checked: true });
		await expect.element(box).toBeChecked();
		await screen.rerender({ checked: false });
		await expect.element(box).not.toBeChecked();
		expect(root.hasAttribute('data-checked')).toBe(false);
	});

	test('indeterminate shows the partial state; a click clears it and checks the box', async () => {
		let checked: boolean | undefined = false;
		let indeterminate: boolean | undefined = true;
		const screen = await render(Checkbox, {
			label: 'All clients',
			get checked() {
				return checked;
			},
			set checked(next) {
				checked = next;
			},
			get indeterminate() {
				return indeterminate;
			},
			set indeterminate(next) {
				indeterminate = next;
			}
		});
		const box = screen.getByRole('checkbox', { name: 'All clients' });
		await expect.element(box).toBePartiallyChecked();
		expect(
			screen.container.querySelector('.aurora-checkbox')?.getAttribute('data-indeterminate')
		).toBe('true');
		await box.click();
		expect(indeterminate).toBe(false);
		expect(checked).toBe(true);
		await expect.element(box).toBeChecked();
	});

	test('disabled reaches the input: no toggle, no focus, data-disabled', async () => {
		const onchange = vi.fn();
		const screen = await render(Checkbox, { label: 'Locked', disabled: true, onchange });
		const box = screen.getByRole('checkbox', { name: 'Locked' });
		await expect.element(box).toBeDisabled();
		expect(screen.container.querySelector('.aurora-checkbox')?.getAttribute('data-disabled')).toBe(
			'true'
		);
		await screen.getByText('Locked').click({ force: true });
		await expect.element(box).not.toBeChecked();
		expect(onchange).not.toHaveBeenCalled();
		await userEvent.keyboard('{Tab}');
		await expect.element(box).not.toHaveFocus();
	});

	test('onchange receives the native Event and onclick the native MouseEvent', async () => {
		let seen: boolean | undefined;
		const onchange = vi.fn((event: Event) => {
			seen = (event.currentTarget as HTMLInputElement).checked;
		});
		const onclick = vi.fn();
		const screen = await render(Checkbox, { label: 'Reminders', onchange, onclick });
		await screen.getByRole('checkbox', { name: 'Reminders' }).click();
		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange.mock.calls[0][0]).toBeInstanceOf(Event);
		expect(onchange.mock.calls[0][0]).not.toHaveProperty('detail');
		expect(seen).toBe(true);
		expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
	});

	test('is reachable with Tab and toggled with Space; Shift+click sets event.shiftKey', async () => {
		const shift: boolean[] = [];
		const screen = await render(Checkbox, {
			label: 'Row',
			onclick: (event: MouseEvent) => shift.push(event.shiftKey)
		});
		const box = screen.getByRole('checkbox', { name: 'Row' });
		await userEvent.keyboard('{Tab}');
		await expect.element(box).toHaveFocus();
		await userEvent.keyboard(' ');
		await expect.element(box).toBeChecked();
		await userEvent.keyboard('{Shift>}');
		await box.click();
		await userEvent.keyboard('{/Shift}');
		await expect.element(box).not.toBeChecked();
		expect(shift).toEqual([false, true]);
	});

	test.skipIf(navigator.userAgent.includes('Firefox'))(
		'Shift+Space and Shift+click on the label text set event.shiftKey in onclick',
		async () => {
			const shift: boolean[] = [];
			const screen = await render(Checkbox, {
				label: 'Row',
				onclick: (event: MouseEvent) => shift.push(event.shiftKey)
			});
			const box = screen.getByRole('checkbox', { name: 'Row' });
			await userEvent.keyboard('{Tab}');
			await userEvent.keyboard('{Shift>} {/Shift}');
			await expect.element(box).toBeChecked();
			await userEvent.keyboard('{Shift>}');
			await screen.getByText('Row').click();
			await userEvent.keyboard('{/Shift}');
			await expect.element(box).not.toBeChecked();
			expect(shift).toEqual([true, true]);
		}
	);

	test('takes part in a form: the native value is sent only when checked, required blocks', async () => {
		const form = document.createElement('form');
		document.body.append(form);
		const screen = await render(Checkbox, {
			target: form,
			props: { label: 'Terms', name: 'terms', value: 'yes', required: true }
		});
		expect(form.checkValidity()).toBe(false);
		expect(new FormData(form).has('terms')).toBe(false);
		await screen.getByText('Terms').click();
		expect(form.checkValidity()).toBe(true);
		expect(new FormData(form).get('terms')).toBe('yes');
	});

	test('value is the native form value: a v4 value={true} leaves the box unchecked', async () => {
		const screen = await render(Checkbox, { label: 'Legacy', value: true });
		const box = screen.getByRole('checkbox', { name: 'Legacy' });
		await expect.element(box).not.toBeChecked();
		await expect.element(box).toHaveAttribute('value', 'true');
	});

	test('labelSnippet replaces the text and a click on it still toggles', async () => {
		const screen = await render(Checkbox, {
			label: 'terms',
			labelSnippet: createRawSnippet<[{ label: string | undefined }]>((args) => ({
				render: () => `<span>I accept the <b>${args().label}</b></span>`
			}))
		});
		const box = screen.getByRole('checkbox', { name: 'I accept the terms' });
		await screen.getByText('I accept the').click();
		await expect.element(box).toBeChecked();
	});

	test('instance CSS variables override the defaults', async () => {
		const vars = [
			'--checkbox-duration: 0s',
			'--checkbox-size: 24px',
			'--checkbox-border-color: rgb(4, 5, 6)',
			'--checkbox-hover-border-color: rgb(4, 5, 6)',
			'--checkbox-checked-background: rgb(1, 2, 3)'
		].join(';');
		const off = host(vars);
		await render(Checkbox, { target: off, props: { label: 'Off' } });
		const offBox = getComputedStyle(off.querySelector('input')!);
		expect(offBox.width).toBe('24px');
		expect(offBox.borderTopColor).toBe('rgb(4, 5, 6)');

		const on = host(vars);
		await render(Checkbox, { target: on, props: { label: 'On', checked: true } });
		expect(getComputedStyle(on.querySelector('input')!).backgroundColor).toBe('rgb(1, 2, 3)');
	});

	test('v4 bug: no keyboard listeners on window to track Shift', async () => {
		const spy = vi.spyOn(window, 'addEventListener');
		await render(Checkbox, { label: 'One' });
		await render(Checkbox, { label: 'Two' });
		const types = spy.mock.calls.map(([type]) => type);
		spy.mockRestore();
		expect(types.filter((type) => type === 'keydown' || type === 'keyup')).toEqual([]);
	});

	test('v4 bug: keyboard focus shows a focus ring', async () => {
		const screen = await render(Checkbox, { label: 'Remind me' });
		const box = screen.getByRole('checkbox', { name: 'Remind me' });
		await userEvent.keyboard('{Tab}');
		await expect.element(box).toHaveFocus();
		const style = getComputedStyle(box.element());
		expect(style.outlineStyle).toBe('solid');
		expect(style.outlineWidth).toBe('3px');
	});
});
