import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Switch from '#lib/components/simple/forms/Switch.svelte';

function host(style: string) {
	const element = document.createElement('div');
	element.style.cssText = style;
	document.body.append(element);
	return element;
}

const thumbOffset = (input: Element) =>
	new DOMMatrix(getComputedStyle(input, '::after').transform).m41;

describe('Switch', () => {
	test('renders a checkbox input with role="switch" inside a label', async () => {
		const screen = await render(Switch, { label: 'Online booking' });
		const toggle = screen.getByRole('switch', { name: 'Online booking' });
		await expect.element(toggle).toHaveAttribute('type', 'checkbox');
		await expect.element(toggle).not.toBeChecked();
		expect(toggle.element().closest('label')?.classList.contains('aurora-switch')).toBe(true);
	});

	test('forwards native attributes to the input and each class to its part', async () => {
		const screen = await render(Switch, {
			label: 'SMS',
			id: 'sms',
			name: 'sms',
			value: 'on-sms',
			title: 'SMS reminders',
			'aria-describedby': 'sms-help',
			'data-testid': 'sms-switch',
			class: { container: 'c', input: 'i', label: 'l' }
		});
		const toggle = screen.getByTestId('sms-switch');
		await expect.element(toggle).toHaveAttribute('id', 'sms');
		await expect.element(toggle).toHaveAttribute('name', 'sms');
		await expect.element(toggle).toHaveAttribute('value', 'on-sms');
		await expect.element(toggle).toHaveAttribute('title', 'SMS reminders');
		await expect.element(toggle).toHaveAttribute('aria-describedby', 'sms-help');
		await expect.element(toggle).toHaveClass('aurora-switch-track', 'i');
		const root = screen.container.querySelector('label.aurora-switch')!;
		expect(root.classList.contains('c')).toBe(true);
		expect(root.querySelector('.aurora-switch-label')?.classList.contains('l')).toBe(true);
	});

	test('bind:checked follows clicks and outside changes; data-checked mirrors the prop', async () => {
		let checked: boolean | undefined = true;
		const screen = await render(Switch, {
			label: 'Holiday mode',
			get checked() {
				return checked;
			},
			set checked(next) {
				checked = next;
			}
		});
		const toggle = screen.getByRole('switch', { name: 'Holiday mode' });
		const root = screen.container.querySelector('.aurora-switch')!;
		await expect.element(toggle).toBeChecked();
		expect(root.getAttribute('data-checked')).toBe('true');
		await toggle.click();
		expect(checked).toBe(false);
		await screen.rerender({ checked: true });
		await expect.element(toggle).toBeChecked();
		await screen.rerender({ checked: false });
		await expect.element(toggle).not.toBeChecked();
		expect(root.hasAttribute('data-checked')).toBe(false);
	});

	test('size is md (36×20) by default and lg (46×26), exposed as data-size', async () => {
		const md = await render(Switch, { label: 'Medium' });
		const mdTrack = md.getByRole('switch', { name: 'Medium' }).element();
		expect(md.container.querySelector('.aurora-switch')?.getAttribute('data-size')).toBe('md');
		expect(mdTrack.getBoundingClientRect().width).toBe(36);
		expect(mdTrack.getBoundingClientRect().height).toBe(20);

		const lg = await render(Switch, { label: 'Large', size: 'lg' });
		const lgTrack = lg.getByRole('switch', { name: 'Large' }).element();
		expect(lg.container.querySelector('.aurora-switch')?.getAttribute('data-size')).toBe('lg');
		expect(lgTrack.getBoundingClientRect().width).toBe(46);
		expect(lgTrack.getBoundingClientRect().height).toBe(26);
	});

	test('disabled reaches the input: no toggle, no focus, data-disabled', async () => {
		const onchange = vi.fn();
		const screen = await render(Switch, { label: 'Locked', disabled: true, onchange });
		const toggle = screen.getByRole('switch', { name: 'Locked' });
		await expect.element(toggle).toBeDisabled();
		expect(screen.container.querySelector('.aurora-switch')?.getAttribute('data-disabled')).toBe(
			'true'
		);
		await screen.getByText('Locked').click({ force: true });
		await expect.element(toggle).not.toBeChecked();
		expect(onchange).not.toHaveBeenCalled();
		await userEvent.keyboard('{Tab}');
		await expect.element(toggle).not.toHaveFocus();
	});

	test('onchange receives the native event: currentTarget.checked is the new value', async () => {
		const values: boolean[] = [];
		const onchange = vi.fn((event: Event) => {
			values.push((event.currentTarget as HTMLInputElement).checked);
		});
		const screen = await render(Switch, { label: 'Reviews', onchange });
		const toggle = screen.getByRole('switch', { name: 'Reviews' });
		await toggle.click();
		await toggle.click();
		expect(onchange).toHaveBeenCalledTimes(2);
		expect(onchange.mock.calls[0][0]).toBeInstanceOf(Event);
		expect(onchange.mock.calls[0][0]).not.toHaveProperty('detail');
		expect(values).toEqual([true, false]);
	});

	test('takes part in a form: name and value are sent only when on', async () => {
		const form = document.createElement('form');
		document.body.append(form);
		const screen = await render(Switch, {
			target: form,
			props: { label: 'Newsletter', name: 'newsletter', value: 'yes' }
		});
		expect(new FormData(form).has('newsletter')).toBe(false);
		await screen.getByRole('switch', { name: 'Newsletter' }).click();
		expect(new FormData(form).get('newsletter')).toBe('yes');
	});

	test('labelSnippet replaces the text and a click on it still toggles', async () => {
		const screen = await render(Switch, {
			label: 'SMS reminders',
			labelSnippet: createRawSnippet<[{ label: string | undefined }]>((args) => ({
				render: () => `<span><b>${args().label}</b> 24 hours before</span>`
			}))
		});
		const toggle = screen.getByRole('switch', { name: 'SMS reminders 24 hours before' });
		await screen.getByText('24 hours before').click();
		await expect.element(toggle).toBeChecked();
	});

	test('the thumb travels width − height, mirrored in RTL; --switch-translate-x overrides it', async () => {
		const ltr = host('--switch-duration: 0s');
		await render(Switch, { target: ltr, props: { label: 'LTR', checked: true } });
		await expect.poll(() => thumbOffset(ltr.querySelector('input')!)).toBe(16);

		const lg = host('--switch-duration: 0s');
		await render(Switch, { target: lg, props: { label: 'Large', size: 'lg', checked: true } });
		await expect.poll(() => thumbOffset(lg.querySelector('input')!)).toBe(20);

		const rtl = host('--switch-duration: 0s');
		rtl.dir = 'rtl';
		await render(Switch, { target: rtl, props: { label: 'RTL', checked: true } });
		await expect.poll(() => thumbOffset(rtl.querySelector('input')!)).toBe(-16);

		const custom = host('--switch-duration: 0s; --switch-translate-x: 10px');
		await render(Switch, { target: custom, props: { label: 'Custom', checked: true } });
		await expect.poll(() => thumbOffset(custom.querySelector('input')!)).toBe(10);
	});

	test('instance CSS variables override the defaults', async () => {
		const vars = [
			'--switch-duration: 0s',
			'--switch-width: 50px',
			'--switch-height: 30px',
			'--switch-background: rgb(4, 5, 6)',
			'--switch-checked-background: rgb(1, 2, 3)'
		].join(';');
		const off = host(vars);
		await render(Switch, { target: off, props: { label: 'Off' } });
		const offTrack = off.querySelector('input')!;
		expect(offTrack.getBoundingClientRect().width).toBe(50);
		expect(offTrack.getBoundingClientRect().height).toBe(30);
		expect(getComputedStyle(offTrack).backgroundColor).toBe('rgb(4, 5, 6)');

		const on = host(vars);
		await render(Switch, { target: on, props: { label: 'On', checked: true } });
		expect(getComputedStyle(on.querySelector('input')!).backgroundColor).toBe('rgb(1, 2, 3)');
	});

	test('v4 bug: the switch is focusable with Tab, shows a focus ring and toggles with Space', async () => {
		const screen = await render(Switch, { label: 'Online booking' });
		const toggle = screen.getByRole('switch', { name: 'Online booking' });
		await userEvent.keyboard('{Tab}');
		await expect.element(toggle).toHaveFocus();
		expect(getComputedStyle(toggle.element()).outlineStyle).toBe('solid');
		await userEvent.keyboard(' ');
		await expect.element(toggle).toBeChecked();
		await userEvent.keyboard(' ');
		await expect.element(toggle).not.toBeChecked();
	});

	test('v4 bug: a real label names the switch and a click on its text toggles it', async () => {
		const screen = await render(Switch, { label: 'Email receipts' });
		const toggle = screen.getByRole('switch', { name: 'Email receipts' });
		await expect.element(toggle).toHaveAccessibleName('Email receipts');
		await screen.getByText('Email receipts').click();
		await expect.element(toggle).toBeChecked();
	});
});
