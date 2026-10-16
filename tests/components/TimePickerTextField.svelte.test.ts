import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TimePickerTextField from '#lib/components/composed/forms/TimePickerTextField.svelte';
import { instantDrawers, renderWithDefaultLocale, snippet, sweepFormatChip } from '../helpers.js';

const CLOCK_ICON =
	'M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z';

function bound<T>(initial?: T) {
	let value = $state(initial);
	return {
		get value() {
			return value;
		},
		set value(next) {
			value = next;
		}
	};
}

function withBound<T extends object>(props: T, bindings: Record<string, { value: unknown }>) {
	for (const [key, state] of Object.entries(bindings))
		Object.defineProperty(props, key, {
			enumerable: true,
			configurable: true,
			get: () => state.value,
			set: (value) => (state.value = value)
		});
	return props;
}

function snippetOf<T>(markup: (params: T) => string) {
	return createRawSnippet<[T]>((params) => ({ render: () => markup(params()) }));
}

function rootOf(container: HTMLElement) {
	return container.querySelector<HTMLElement>('.aurora-time-picker-text-field')!;
}

function option(column: string, name: string) {
	return page.getByRole('listbox', { name: column, exact: true }).getByRole('option', { name, exact: true });
}

function makeForm() {
	const form = document.createElement('form');
	const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
	form.addEventListener('submit', onsubmit);
	document.body.append(form);
	return { form, onsubmit };
}

function paste(element: HTMLInputElement, text: string) {
	element.value = text;
	element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }));
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('TimePickerTextField', () => {
	test('is a labelled combobox that opens a dialog, with the format chip as description', async () => {
		const screen = await render(TimePickerTextField, { label: 'Start', locale: 'en-GB' });
		const input = screen.getByRole('combobox', { name: 'Start' });
		await expect.element(input).toHaveAttribute('type', 'text');
		await expect.element(input).toHaveAttribute('inputmode', 'numeric');
		await expect.element(input).toHaveAttribute('autocomplete', 'off');
		await expect.element(input).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(input).not.toHaveAttribute('aria-controls');
		await expect.element(input).not.toHaveAttribute('name');
		await expect.element(input).toHaveAccessibleDescription('hh:mm');
		const chip = screen.container.querySelector('.aurora-time-picker-text-field-format');
		expect(chip?.textContent?.trim()).toBe('hh:mm');
		expect(chip).toHaveAttribute('aria-hidden', 'true');
		expect(rootOf(screen.container)).toHaveAttribute('data-hour-cycle', '24');
		const icon = screen.getByRole('button', { name: 'Choose time' }).element().querySelector('path');
		expect(icon?.getAttribute('d')).toBe(CLOCK_ICON);
	});

	test('the format chip hides itself before the text gets cut', async () => {
		const screen = await render(TimePickerTextField, { value: '22:30', clearable: true });
		const root = screen.container.querySelector<HTMLElement>('.aurora-time-picker-text-field')!;
		const steps = sweepFormatChip(root, '--time-picker-text-field-width');
		expect(steps[0]).toEqual({ width: 400, chip: true, fits: true });
		expect(steps.filter((step) => step.chip && !step.fits)).toEqual([]);
		expect(steps.some((step) => !step.chip && step.fits)).toBe(true);
		expect(steps.at(-1)!.chip).toBe(false);
	});

	test('the default en locale is a 12-hour clock with letters on the keyboard and an am chip', async () => {
		const screen = await render(TimePickerTextField, { label: 'Start', value: '14:30' });
		const input = screen.getByRole('combobox', { name: 'Start' });
		await expect.element(input).toHaveValue('02:30 PM');
		await expect.element(input).toHaveAttribute('inputmode', 'text');
		await expect.element(input).toHaveAccessibleDescription('hh:mm am');
		expect(rootOf(screen.container)).toHaveAttribute('data-hour-cycle', '12');
	});

	test('hour12 forces the clock; formatLabel and showFormat change the chip', async () => {
		const forced = await render(TimePickerTextField, { label: 'A', locale: 'it', hour12: true, value: '00:15' });
		await expect.element(forced.getByRole('combobox')).toHaveValue('12:15 AM');
		await forced.unmount();
		const label = await render(TimePickerTextField, { label: 'B', hour12: false, value: '00:15', formatLabel: 'HH.mm' });
		await expect.element(label.getByRole('combobox')).toHaveValue('00:15');
		await expect.element(label.getByRole('combobox')).toHaveAccessibleDescription('HH.mm');
		await label.unmount();
		const hidden = await render(TimePickerTextField, { label: 'C', showFormat: false });
		await expect.element(hidden.getByRole('combobox')).not.toHaveAttribute('aria-describedby');
		expect(hidden.container.querySelector('.aurora-time-picker-text-field-format')).toBeNull();
	});

	test('typing keeps digits only, adds the colon, pads, sets value and calls onchange without detail', async () => {
		const onchange = vi.fn();
		const time = bound<string>();
		const screen = await render(
			TimePickerTextField,
			withBound({ label: 'Start', locale: 'en-GB', onchange }, { value: time })
		);
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('ab9');
		await expect.element(input).toHaveValue('09');
		await userEvent.keyboard('x3');
		await expect.element(input).toHaveValue('09:3');
		expect(onchange).not.toHaveBeenCalled();
		await userEvent.keyboard('0');
		await expect.element(input).toHaveValue('09:30');
		expect(time.value).toBe('09:30');
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ value: '09:30' });
		expect(onchange.mock.calls[0][0]).not.toHaveProperty('detail');
		await expect.element(option('Hours', '09')).toHaveAttribute('aria-selected', 'true');
		await userEvent.keyboard('5');
		await expect.element(input).toHaveValue('09:30');

		await userEvent.keyboard('{Backspace}');
		await expect.element(input).toHaveValue('09:3');
		expect(time.value).toBeUndefined();
		expect(onchange).toHaveBeenLastCalledWith({ value: undefined });
	});

	test('a typed colon after one digit pads the hour', async () => {
		const screen = await render(TimePickerTextField, { label: 'Start', locale: 'en-GB' });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('7:');
		await expect.element(input).toHaveValue('07:');
		await userEvent.keyboard('5');
		await expect.element(input).toHaveValue('07:5');
	});

	test('on a 12-hour clock A and P set the period and a whole 24-hour time turns into 12-hour', async () => {
		const time = bound<string>();
		const screen = await render(TimePickerTextField, withBound({ label: 'Start' }, { value: time }));
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('930');
		await expect.element(input).toHaveValue('09:30');
		expect(time.value).toBeUndefined();
		await userEvent.keyboard('p');
		await expect.element(input).toHaveValue('09:30 PM');
		expect(time.value).toBe('21:30');
		await userEvent.keyboard('a');
		await expect.element(input).toHaveValue('09:30 AM');
		expect(time.value).toBe('09:30');
		await userEvent.keyboard('{Backspace}');
		await expect.element(input).toHaveValue('09:30');
		expect(time.value).toBeUndefined();

		await userEvent.fill(input, '');
		await userEvent.keyboard('1430');
		await expect.element(input).toHaveValue('02:30 PM');
		expect(time.value).toBe('14:30');
	});

	test('pasted times are converted to the clock of the field', async () => {
		const time = bound<string>();
		const screen = await render(TimePickerTextField, withBound({ label: 'Start', locale: 'en-GB' }, { value: time }));
		const input = screen.getByRole('combobox');
		paste(input.element() as HTMLInputElement, '2:30 PM');
		await expect.element(input).toHaveValue('14:30');
		expect(time.value).toBe('14:30');
		paste(input.element() as HTMLInputElement, '18:45:00');
		await expect.element(input).toHaveValue('18:45');
		expect(time.value).toBe('18:45');
		await screen.unmount();

		const twelve = bound<string>();
		const other = await render(TimePickerTextField, withBound({ label: 'End' }, { value: twelve }));
		const field = other.getByRole('combobox');
		paste(field.element() as HTMLInputElement, '18:45:00');
		await expect.element(field).toHaveValue('06:45 PM');
		expect(twelve.value).toBe('18:45');
	});

	test('a time that does not exist is an error with invalidText and a custom validity', async () => {
		const { form, onsubmit } = makeForm();
		const time = bound<string>();
		const screen = await render(TimePickerTextField, {
			target: form,
			props: withBound({ label: 'Start', locale: 'en-GB', hint: 'Shop hours' }, { value: time })
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await expect.element(input).toHaveAccessibleDescription('Shop hours hh:mm');
		await input.click();
		await userEvent.keyboard('2500');
		await expect.element(input).toHaveValue('25:00');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		expect(root).toHaveAttribute('data-state', 'error');
		expect(time.value).toBeUndefined();
		await expect.element(input).toHaveAccessibleDescription('Enter a valid time hh:mm');
		const element = input.element() as HTMLInputElement;
		expect(element.validationMessage).toBe('Enter a valid time');
		const oninvalid = vi.fn((event: Event) => event.preventDefault());
		form.addEventListener('invalid', oninvalid, true);
		form.requestSubmit();
		expect(onsubmit).not.toHaveBeenCalled();
		expect(oninvalid).toHaveBeenCalledOnce();

		await userEvent.fill(input, '23:00');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		expect(root).not.toHaveAttribute('data-state');
		expect(time.value).toBe('23:00');
		expect(element.validity.valid).toBe(true);
		form.requestSubmit();
		expect(onsubmit).toHaveBeenCalledOnce();
		form.remove();
	});

	test('min and max make a typed time invalid, also across midnight; invalidText changes the message', async () => {
		const screen = await render(TimePickerTextField, {
			label: 'Shift',
			locale: 'en-GB',
			min: '22:00',
			max: '06:00',
			invalidText: 'From 22:00 to 06:00'
		});
		const input = screen.getByRole('combobox');
		await userEvent.fill(input, '12:00');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await expect.element(screen.getByText('From 22:00 to 06:00')).toBeVisible();
		await userEvent.fill(input, '23:30');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		await userEvent.fill(input, '05:59');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		await userEvent.fill(input, '06:01');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	});

	test('an unfinished time is an error only after the field loses focus', async () => {
		const screen = await render(TimePickerTextField, { label: 'Start', locale: 'en-GB' });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('09:3');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		(input.element() as HTMLInputElement).blur();
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		expect(rootOf(screen.container)).toHaveAttribute('data-state', 'error');
		await expect.element(screen.getByText('Enter a valid time')).toBeVisible();
	});

	test('on a 12-hour clock a time without AM or PM is unfinished', async () => {
		const screen = await render(TimePickerTextField, { label: 'Start' });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('1015');
		await expect.element(input).toHaveValue('10:15');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		(input.element() as HTMLInputElement).blur();
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	});

	test('the state prop overrides the computed state', async () => {
		const screen = await render(TimePickerTextField, {
			label: 'Start',
			locale: 'en-GB',
			hint: 'Checked',
			state: 'success'
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await userEvent.fill(input, '99:99');
		expect(root).toHaveAttribute('data-state', 'success');
		await expect.element(screen.getByText('Checked')).toBeVisible();
		await expect.element(screen.getByText('Enter a valid time')).not.toBeInTheDocument();
		expect(root.querySelector('.aurora-time-picker-text-field-state-icon')).not.toBeNull();

		await screen.rerender({ state: 'error', hint: 'Required' });
		expect(root).toHaveAttribute('data-state', 'error');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await expect.element(screen.getByText('Required')).toBeVisible();
	});

	test('value set from outside updates the text, reads seconds, and undefined empties it', async () => {
		const time = bound<string | undefined>('14:30:00');
		const screen = await render(TimePickerTextField, withBound({ label: 'Start', locale: 'en-GB' }, { value: time }));
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveValue('14:30');
		time.value = '07:05';
		await expect.element(input).toHaveValue('07:05');
		time.value = undefined;
		await expect.element(input).toHaveValue('');
		await userEvent.fill(input, '08:00');
		expect(time.value).toBe('08:00');
		time.value = undefined;
		await expect.element(input).toHaveValue('');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
	});

	test('a locale or hour12 change from outside reformats the text', async () => {
		const locale = bound('en-GB');
		const screen = await render(TimePickerTextField, withBound({ label: 'Start', value: '14:30' }, { locale }));
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveValue('14:30');
		locale.value = 'en';
		await expect.element(input).toHaveValue('02:30 PM');
		await expect.element(input).toHaveAccessibleDescription('hh:mm am');
	});

	describe('desktop panel', () => {
		test('focus opens a dialog with the TimePicker, controlled by the input', async () => {
			const screen = await render(TimePickerTextField, { label: 'Start', locale: 'en-GB', value: '09:30' });
			const input = screen.getByRole('combobox', { name: 'Start' });
			await userEvent.keyboard('{Tab}');
			await expect.element(input).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			const dialog = screen.getByRole('dialog', { name: 'Start' });
			await expect.element(dialog).toBeVisible();
			expect(dialog.element()).toHaveClass('aurora-time-picker');
			expect(dialog.element().closest('.aurora-menu')?.matches(':popover-open')).toBe(true);
			await expect.element(input).toHaveAttribute('aria-controls', dialog.element().id);
			expect(rootOf(screen.container)).toHaveAttribute('data-open');
			await expect.element(option('Hours', '09')).toHaveAttribute('aria-selected', 'true');
			await expect.element(option('Minutes', '30')).toHaveAttribute('aria-selected', 'true');
			await expect.element(input).toHaveFocus();
		});

		test('a click on the input opens it; without label the dialog is named by openLabel', async () => {
			const screen = await render(TimePickerTextField, { openLabel: 'Pick a time' });
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('dialog', { name: 'Pick a time' })).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(input).toHaveFocus();
			await input.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		});

		test('Arrow Down moves the focus to the chosen hour; Escape closes and returns the focus', async () => {
			const screen = await render(TimePickerTextField, { label: 'Start', locale: 'en-GB', value: '09:30' });
			const input = screen.getByRole('combobox');
			await userEvent.keyboard('{Tab}{Escape}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await expect.element(option('Hours', '09')).toHaveFocus();
			await userEvent.keyboard('{Escape}');
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
			await expect.element(input).toHaveFocus();
			await wait(100);
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(rootOf(screen.container)).not.toHaveAttribute('data-open');
		});

		test('with the keyboard: Enter on an hour moves to the minutes, Enter on a minute closes', async () => {
			const onchange = vi.fn();
			const time = bound<string>('09:30');
			const screen = await render(
				TimePickerTextField,
				withBound({ label: 'Start', locale: 'en-GB', onchange }, { value: time })
			);
			const input = screen.getByRole('combobox');
			await input.click();
			await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
			await expect.element(option('Minutes', '30')).toHaveFocus();
			await expect.element(input).toHaveValue('10:30');
			expect(time.value).toBe('10:30');
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await userEvent.keyboard('{ArrowDown}{Enter}');
			await expect.element(input).toHaveValue('10:35');
			await expect.element(input).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(onchange.mock.calls).toEqual([[{ value: '10:30' }], [{ value: '10:35' }]]);
		});

		test('with the mouse: the hour keeps the panel open, the minute closes it and keeps the focus', async () => {
			const time = bound<string>();
			const screen = await render(TimePickerTextField, withBound({ label: 'Start', locale: 'en-GB' }, { value: time }));
			const input = screen.getByRole('combobox');
			await input.click();
			await option('Hours', '18').click();
			await expect.element(input).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			expect(time.value).toBeUndefined();
			await option('Minutes', '45').click();
			await expect.element(input).toHaveValue('18:45');
			expect(time.value).toBe('18:45');
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
			await expect.element(input).toHaveFocus();
		});

		test('on a 12-hour clock the panel closes when AM or PM completes the time', async () => {
			const time = bound<string>();
			const screen = await render(TimePickerTextField, withBound({ label: 'Start' }, { value: time }));
			const input = screen.getByRole('combobox');
			await input.click();
			await option('Hours', '07').click();
			await option('Minutes', '15').click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			expect(time.value).toBeUndefined();
			await option('AM/PM', 'PM').click();
			await expect.element(input).toHaveValue('07:15 PM');
			expect(time.value).toBe('19:15');
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		});

		test('choosing in the panel replaces an invalid typed text', async () => {
			const screen = await render(TimePickerTextField, { label: 'Start', locale: 'en-GB', value: '09:30' });
			const input = screen.getByRole('combobox');
			await userEvent.fill(input, '25:');
			await option('Hours', '10').click();
			await expect.element(input).toHaveValue('25:');
			await option('Minutes', '30').click();
			await expect.element(input).toHaveValue('10:30');
			await expect.element(input).not.toHaveAttribute('aria-invalid');
		});

		test('closeOnSelect={false} keeps the panel open', async () => {
			const screen = await render(TimePickerTextField, {
				label: 'Start',
				locale: 'en-GB',
				value: '09:30',
				closeOnSelect: false
			});
			const input = screen.getByRole('combobox');
			await input.click();
			await option('Minutes', '45').click();
			await expect.element(input).toHaveValue('09:45');
			await wait(100);
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		});

		test('min, max, minuteStep and the column names reach the panel', async () => {
			const screen = await render(TimePickerTextField, {
				label: 'Start',
				locale: 'en-GB',
				min: '08:00',
				max: '09:30',
				minuteStep: 30,
				hoursLabel: 'Ore',
				minutesLabel: 'Minuti'
			});
			await screen.getByRole('combobox').click();
			const minutes = page.getByRole('listbox', { name: 'Minuti' }).getByRole('option');
			await expect.poll(() => minutes.elements().map((node) => node.textContent?.trim())).toEqual(['00', '30']);
			const enabled = page
				.getByRole('listbox', { name: 'Ore' })
				.getByRole('option')
				.elements()
				.filter((node) => node.getAttribute('aria-disabled') !== 'true')
				.map((node) => node.textContent?.trim());
			expect(enabled).toEqual(['08', '09']);
		});

		test('periodLabel names the AM/PM column', async () => {
			const screen = await render(TimePickerTextField, { label: 'Start', periodLabel: 'Mattina o sera' });
			await screen.getByRole('combobox').click();
			await expect.element(page.getByRole('listbox', { name: 'Mattina o sera' })).toBeVisible();
		});

		test('Enter in the input closes the panel without submitting the form', async () => {
			const { form, onsubmit } = makeForm();
			form.append(document.createElement('button'));
			const screen = await render(TimePickerTextField, { target: form, props: { label: 'Start' } });
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(onsubmit).not.toHaveBeenCalled();
			form.remove();
		});

		test('Tab closes the panel and moves on', async () => {
			const screen = await render(TimePickerTextField, { label: 'Start', value: '09:30' });
			const after = document.createElement('button');
			after.textContent = 'After';
			screen.container.append(after);
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await userEvent.keyboard('{Tab}');
			await expect.element(screen.getByRole('button', { name: 'After' })).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		});

		test('reopening while the panel is closing leaves it usable', async () => {
			const target = document.createElement('div');
			target.style.setProperty('--menu-duration', '1s');
			document.body.append(target);
			const screen = await render(TimePickerTextField, {
				target,
				props: { label: 'Start', locale: 'en-GB', value: '09:30' }
			});
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('dialog')).toBeVisible();
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(option('Hours', '09')).toHaveFocus();
			expect(target.querySelector('.aurora-menu')).not.toHaveAttribute('inert');
			target.remove();
		});

		test('a click outside closes the panel', async () => {
			const screen = await render(TimePickerTextField, { label: 'Start' });
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('dialog')).toBeVisible();
			await userEvent.click(document.body, { position: { x: 900, y: 600 } });
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		});

		test('the clock button toggles the panel and keeps the focus on the input', async () => {
			const screen = await render(TimePickerTextField, { label: 'Start' });
			const input = screen.getByRole('combobox');
			const toggle = screen.getByRole('button', { name: 'Choose time' });
			await expect.element(toggle).toHaveAttribute('type', 'button');
			await expect.element(toggle).toHaveAttribute('tabindex', '-1');
			await expect.element(toggle).toHaveAttribute('aria-haspopup', 'dialog');
			await toggle.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			const dialog = screen.getByRole('dialog', { name: 'Start' });
			await expect.element(toggle).toHaveAttribute('aria-controls', dialog.element().id);
			await expect.element(input).toHaveFocus();
			await toggle.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(dialog).not.toBeInTheDocument();
		});

		test('bind:open follows the panel and opens it from outside', async () => {
			const open = bound(false);
			const screen = await render(TimePickerTextField, withBound({ label: 'Start' }, { open }));
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.poll(() => open.value).toBe(true);
			await userEvent.keyboard('{Escape}');
			await expect.poll(() => open.value).toBe(false);
			open.value = true;
			await expect.element(screen.getByRole('dialog')).toBeVisible();
			open.value = false;
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		});

		test('the panel buttons inside a form do not submit it', async () => {
			const { form, onsubmit } = makeForm();
			const screen = await render(TimePickerTextField, { target: form, props: { label: 'Start', locale: 'en-GB' } });
			await screen.getByRole('combobox').click();
			await option('Hours', '10').click();
			await option('Minutes', '00').click();
			expect(onsubmit).not.toHaveBeenCalled();
			form.remove();
		});

		test('every field has its own ids and panel', async () => {
			const first = await render(TimePickerTextField, { label: 'First' });
			const second = await render(TimePickerTextField, { label: 'Second' });
			const ids = [first, second].flatMap((screen) =>
				[...screen.container.querySelectorAll('[id]')].map((element) => element.id)
			);
			expect(new Set(ids).size).toBe(ids.length);
			const a = first.getByRole('combobox', { name: 'First' });
			const b = second.getByRole('combobox', { name: 'Second' });
			await a.click();
			const controls = a.element().getAttribute('aria-controls');
			(b.element() as HTMLInputElement).focus();
			await expect.element(second.getByRole('dialog', { name: 'Second' })).toBeVisible();
			expect(b.element().getAttribute('aria-controls')).not.toBe(controls);
		});
	});

	describe('mobile', () => {
		instantDrawers();

		test('the clock button opens a modal bottom drawer; choosing the minutes closes it', async () => {
			await page.viewport(800, 700);
			try {
				const onchange = vi.fn();
				const screen = await render(TimePickerTextField, {
					label: 'Start',
					locale: 'en-GB',
					value: '09:30',
					onchange
				});
				const input = screen.getByRole('combobox', { name: 'Start' });
				await input.click();
				await expect.element(input).toHaveFocus();
				await wait(100);
				await expect.element(input).toHaveAttribute('aria-expanded', 'false');
				await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();

				await screen.getByRole('button', { name: 'Choose time' }).click();
				const drawer = screen.getByRole('dialog', { name: 'Start' });
				await expect.element(drawer).toBeVisible();
				expect(drawer.element().tagName).toBe('DIALOG');
				expect(drawer.element().matches(':modal')).toBe(true);
				expect(drawer.element()).toHaveAttribute('data-position', 'bottom');
				expect(drawer.element().querySelector('.aurora-time-picker')).not.toBeNull();
				await expect.element(option('Hours', '09')).toHaveFocus();
				await expect.element(input).toHaveAttribute('aria-expanded', 'true');

				await userEvent.keyboard('{ArrowDown}{Enter}');
				await expect.element(option('Minutes', '30')).toHaveFocus();
				await userEvent.keyboard('{ArrowDown}{Enter}');
				await expect.element(drawer).not.toBeInTheDocument();
				await expect.element(input).toHaveValue('10:35');
				await expect.element(input).toHaveAttribute('aria-expanded', 'false');
				expect(onchange).toHaveBeenLastCalledWith({ value: '10:35' });
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('the field stays typable and a click on a minute closes the drawer', async () => {
			await page.viewport(800, 700);
			try {
				const screen = await render(TimePickerTextField, { label: 'Start', locale: 'en-GB' });
				const input = screen.getByRole('combobox');
				await expect.element(input).toHaveAttribute('inputmode', 'numeric');
				await input.click();
				await userEvent.keyboard('1015');
				await expect.element(input).toHaveValue('10:15');
				await expect.element(input).toHaveAttribute('aria-expanded', 'false');
				await screen.getByRole('button', { name: 'Choose time' }).click();
				await expect.element(option('Hours', '10')).toHaveFocus();
				await option('Minutes', '45').click();
				await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
				await expect.element(input).toHaveValue('10:45');
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('drawerTitle names the drawer, whose close button closes it without a change', async () => {
			await page.viewport(800, 700);
			try {
				const onchange = vi.fn();
				const screen = await render(TimePickerTextField, {
					label: 'Start',
					drawerTitle: 'Pick your time',
					closeLabel: 'Done',
					locale: 'en-GB',
					value: '09:30',
					onchange
				});
				await screen.getByRole('button', { name: 'Choose time' }).click();
				const drawer = screen.getByRole('dialog', { name: 'Pick your time' });
				await expect.element(drawer).toBeVisible();
				await drawer.getByRole('button', { name: 'Done' }).click();
				await expect.element(drawer).not.toBeInTheDocument();
				await expect.element(screen.getByRole('combobox')).toHaveValue('09:30');
				expect(onchange).not.toHaveBeenCalled();
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('mobileDrawer={false} keeps the menu on small screens', async () => {
			await page.viewport(800, 700);
			try {
				const screen = await render(TimePickerTextField, { label: 'Start', mobileDrawer: false });
				const input = screen.getByRole('combobox');
				await input.click();
				const dialog = screen.getByRole('dialog', { name: 'Start' });
				await expect.element(dialog).toBeVisible();
				expect(dialog.element().tagName).toBe('DIV');
			} finally {
				await page.viewport(1280, 800);
			}
		});
	});

	test('clearable shows a Clear button that empties the value and calls onchange', async () => {
		const onchange = vi.fn();
		const time = bound<string>('09:30');
		const screen = await render(
			TimePickerTextField,
			withBound({ label: 'Start', locale: 'en-GB', clearable: true, clearLabel: 'Remove time', onchange }, { value: time })
		);
		const input = screen.getByRole('combobox');
		const clear = screen.getByRole('button', { name: 'Remove time' });
		await expect.element(clear).toHaveAttribute('type', 'button');
		await clear.click();
		await expect.element(input).toHaveValue('');
		expect(time.value).toBeUndefined();
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ value: undefined });
		await expect.element(input).toHaveFocus();
		await expect.element(clear).not.toBeInTheDocument();

		await userEvent.keyboard('{Escape}9');
		await screen.getByRole('button', { name: 'Remove time' }).click();
		await expect.element(input).toHaveValue('');
		expect(onchange).toHaveBeenCalledOnce();
	});

	test('disabled blocks opening and editing', async () => {
		const screen = await render(TimePickerTextField, {
			label: 'Start',
			disabled: true,
			clearable: true,
			value: '09:30'
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await expect.element(input).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Choose time' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
		expect(root).toHaveAttribute('data-disabled');
		await userEvent.click(root.querySelector('.aurora-time-picker-text-field-control')!);
		await screen.getByRole('button', { name: 'Choose time' }).click({ force: true });
		await expect.element(input).not.toHaveFocus();
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
	});

	test('readonly shows the time but blocks opening and editing', async () => {
		const onchange = vi.fn();
		const screen = await render(TimePickerTextField, {
			label: 'Start',
			locale: 'en-GB',
			readonly: true,
			clearable: true,
			value: '09:30',
			onchange
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveAttribute('readonly');
		expect(rootOf(screen.container)).toHaveAttribute('data-readonly');
		await expect.element(screen.getByRole('button', { name: 'Choose time' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
		await input.click();
		await userEvent.keyboard('{ArrowDown}1');
		await expect.element(input).toHaveValue('09:30');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		expect(onchange).not.toHaveBeenCalled();
	});

	test('name submits the time as HH:mm in a hidden input, empty without a time; required reaches the input', async () => {
		const { form } = makeForm();
		const screen = await render(TimePickerTextField, {
			target: form,
			props: { label: 'Start', name: 'start', required: true }
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toBeRequired();
		expect([...new FormData(form).entries()]).toEqual([['start', '']]);
		await input.click();
		await userEvent.keyboard('0730p');
		await expect.element(input).toHaveValue('07:30 PM');
		expect([...new FormData(form).entries()]).toEqual([['start', '19:30']]);
		await userEvent.keyboard('{Backspace}');
		expect([...new FormData(form).entries()]).toEqual([['start', '']]);
		form.remove();
	});

	test('a value with seconds is submitted as HH:mm', async () => {
		const { form } = makeForm();
		await render(TimePickerTextField, { target: form, props: { label: 'Start', name: 'start', value: '08:05:30' } });
		expect([...new FormData(form).entries()]).toEqual([['start', '08:05']]);
		form.remove();
	});

	test('id sets the input id, which the label points to', async () => {
		const screen = await render(TimePickerTextField, { label: 'Start', id: 'start-time' });
		await expect.element(screen.getByRole('combobox', { name: 'Start' })).toHaveAttribute('id', 'start-time');
		expect(screen.container.querySelector('label')).toHaveAttribute('for', 'start-time');
	});

	test('native attributes and events reach the input', async () => {
		const handlers = {
			oninput: vi.fn(),
			onfocus: vi.fn(),
			onblur: vi.fn(),
			onclick: vi.fn(),
			onkeydown: vi.fn()
		};
		const screen = await render(TimePickerTextField, {
			label: 'Start',
			title: 'Start time',
			placeholder: '--:--',
			inputmode: 'decimal',
			'data-testid': 'start',
			'aria-describedby': 'external',
			...handlers
		});
		const input = screen.getByTestId('start');
		await expect.element(input).toHaveAttribute('title', 'Start time');
		await expect.element(input).toHaveAttribute('placeholder', '--:--');
		await expect.element(input).toHaveAttribute('inputmode', 'decimal');
		expect(input.element().getAttribute('aria-describedby')?.split(' ')).toContain('external');
		await input.click();
		expect(handlers.onfocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
		expect(handlers.onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
		await userEvent.keyboard('1');
		expect(handlers.onkeydown.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
		expect(handlers.oninput.mock.calls[0][0]).toBeInstanceOf(Event);
		input.element().blur();
		expect(handlers.onblur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
	});

	test('an onkeydown that calls preventDefault stops the built-in keys', async () => {
		const screen = await render(TimePickerTextField, {
			label: 'Start',
			onkeydown: (event: KeyboardEvent) => {
				if (event.key === 'ArrowDown') event.preventDefault();
			}
		});
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('{Escape}{ArrowDown}');
		await expect.element(input).toHaveFocus();
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
	});

	test('the snippets render in their parts', async () => {
		const screen = await render(TimePickerTextField, {
			label: 'Start',
			hint: 'Opening time',
			state: 'success',
			locale: 'en-GB',
			value: '09:30',
			clearable: true,
			labelSnippet: snippetOf<{ label: string | undefined }>(({ label }) => `<b>${label} *</b>`),
			hintSnippet: snippetOf<{ hint: string | undefined }>(({ hint }) => `<i>${hint}!</i>`),
			stateIconSnippet: snippetOf<{ state: string }>(({ state }) => `<i data-testid="state">${state}</i>`),
			iconSnippet: snippet('<i data-testid="icon"></i>'),
			prependSnippet: snippet('<i data-testid="prepend"></i>'),
			appendInnerSnippet: snippet('<i data-testid="append-inner"></i>'),
			appendSnippet: snippet('<i data-testid="append"></i>'),
			clearSnippet: snippet('<i data-testid="clear"></i>'),
			formatSnippet: snippetOf<{ format: string }>(({ format }) => `<i data-testid="format">${format}</i>`),
			optionSnippet: snippetOf<{ label: string; column: string }>(
				({ label, column }) => `<i class="custom-option">${column}-${label}</i>`
			)
		});
		const root = rootOf(screen.container);
		await expect.element(screen.getByRole('combobox', { name: 'Start *' })).toBeVisible();
		expect(root.querySelector('.aurora-time-picker-text-field-hint')?.textContent?.trim()).toBe('Opening time!');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('success');
		await expect.element(screen.getByTestId('format')).toHaveTextContent('hh:mm');
		expect(screen.getByRole('button', { name: 'Choose time' }).element().querySelector('[data-testid="icon"]')).not.toBeNull();
		const control = root.querySelector('.aurora-time-picker-text-field-control')!;
		expect(control.querySelector('.aurora-time-picker-text-field-end [data-testid="append-inner"]')).not.toBeNull();
		expect(control.contains(screen.getByTestId('prepend').element())).toBe(false);
		expect(control.contains(screen.getByTestId('append').element())).toBe(false);
		expect(screen.getByRole('button', { name: 'Clear' }).element().querySelector('[data-testid="clear"]')).not.toBeNull();
		await screen.getByRole('combobox').click();
		await expect.element(option('Hours', 'hours-09')).toBeVisible();
	});

	test('binds the input element', async () => {
		let input: HTMLInputElement | undefined;
		const screen = await render(TimePickerTextField, {
			label: 'Start',
			get input() {
				return input as HTMLInputElement;
			},
			set input(value) {
				input = value;
			}
		});
		expect(input).toBe(screen.getByRole('combobox').element());
	});

	test('class parts go on their elements', async () => {
		const screen = await render(TimePickerTextField, {
			label: 'Start',
			hint: 'Hint',
			class: {
				container: 'app-container',
				label: 'app-label',
				row: 'app-row',
				field: 'app-field',
				input: 'app-input',
				hint: 'app-hint',
				picker: 'app-picker'
			}
		});
		const root = rootOf(screen.container);
		expect(root).toHaveClass('app-container');
		expect(root.querySelector('label')).toHaveClass('aurora-time-picker-text-field-label', 'app-label');
		expect(root.querySelector('.aurora-time-picker-text-field-row')).toHaveClass('app-row');
		expect(root.querySelector('.aurora-time-picker-text-field-control')).toHaveClass('app-field');
		expect(root.querySelector('.aurora-time-picker-text-field-hint')).toHaveClass('app-hint');
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveClass('app-input');
		await input.click();
		await expect.element(screen.getByRole('dialog')).toHaveClass('aurora-time-picker', 'app-picker');
	});

	test('exposes its state as data attributes', async () => {
		const screen = await render(TimePickerTextField, { label: 'Start' });
		const root = rootOf(screen.container);
		for (const name of ['data-state', 'data-disabled', 'data-readonly', 'data-open'])
			expect(root).not.toHaveAttribute(name);
		await screen.getByRole('combobox').click();
		await expect.poll(() => root.hasAttribute('data-open')).toBe(true);
		await screen.rerender({ state: 'success', disabled: true });
		expect(root).toHaveAttribute('data-state', 'success');
		expect(root).toHaveAttribute('data-disabled');
	});

	test('instance CSS variables override the defaults, also on the panel', async () => {
		const target = document.createElement('div');
		target.style.cssText = [
			'--global-duration: 0s',
			'--time-picker-text-field-border-color: rgb(1, 2, 3)',
			'--time-picker-text-field-height: 50px',
			'--time-picker-option-selected-background: rgb(4, 5, 6)'
		].join(';');
		document.body.append(target);
		const screen = await render(TimePickerTextField, { target, props: { label: 'Start', locale: 'en-GB', value: '09:30' } });
		const control = target.querySelector('.aurora-time-picker-text-field-control')!;
		expect(getComputedStyle(control).borderTopColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(control).height).toBe('50px');
		await screen.getByRole('combobox').click();
		await expect.element(option('Hours', '09')).toBeVisible();
		expect(getComputedStyle(option('Hours', '09').element()).backgroundColor).toBe('rgb(4, 5, 6)');
		target.remove();
	});
});

describe('TimePickerTextField texts', () => {
	test('follow locale, also in the panel, and a text prop wins', async () => {
		const italian = await render(TimePickerTextField, { label: 'Ora', locale: 'it' });
		await expect.element(italian.getByRole('button', { name: "Scegli l'ora" })).toBeInTheDocument();
		await italian.getByRole('combobox', { name: 'Ora' }).click();
		await expect.element(page.getByRole('listbox', { name: 'Ore', exact: true })).toBeVisible();
		await italian.unmount();
		const own = await render(TimePickerTextField, { label: 'Ora', locale: 'it', openLabel: 'Orologio' });
		await expect.element(own.getByRole('button', { name: 'Orologio' })).toBeInTheDocument();
	});

	test('setDefaultLocale sets the texts and the clock; the locale prop wins over it', async () => {
		const inherited = await renderWithDefaultLocale('it', TimePickerTextField, { label: 'Ora', value: '14:30' });
		await expect.element(inherited.getByRole('combobox', { name: 'Ora' })).toHaveValue('14:30');
		await expect.element(inherited.getByRole('button', { name: "Scegli l'ora" })).toBeInTheDocument();
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', TimePickerTextField, { label: 'Time', value: '14:30', locale: 'en' });
		await expect.element(own.getByRole('combobox', { name: 'Time' })).toHaveValue('02:30 PM');
		await expect.element(own.getByRole('button', { name: 'Choose time' })).toBeInTheDocument();
	});
});
