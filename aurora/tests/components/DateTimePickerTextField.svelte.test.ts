import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DateTimePickerTextField from '#lib/components/composed/forms/DateTimePickerTextField.svelte';
import { renderWithDefaultLocale, snippet, sweepFormatChip } from '../helpers.js';

const CALENDAR_CLOCK_ICON =
	'M6 1V3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H11.1C12.36 22.24 14.09 23 16 23C19.87 23 23 19.87 23 16C23 14.09 22.24 12.36 21 11.1V5C21 3.9 20.11 3 19 3H18V1H16V3H8V1M5 5H19V7H5M5 9H19V9.67C18.09 9.24 17.07 9 16 9C12.13 9 9 12.13 9 16C9 17.07 9.24 18.09 9.67 19H5M16 11.15C18.68 11.15 20.85 13.32 20.85 16C20.85 18.68 18.68 20.85 16 20.85C13.32 20.85 11.15 18.68 11.15 16C11.15 13.32 13.32 11.15 16 11.15M15 13V16.69L18.19 18.53L18.94 17.23L16.5 15.82V13Z';

const at = (day: number, hours = 0, minutes = 0) => new Date(2026, 8, day, hours, minutes);

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
	return container.querySelector<HTMLElement>('.aurora-date-time-picker-text-field')!;
}

function day(date: Date, locale = 'en-GB') {
	const name = new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date);
	return page.getByRole('gridcell', { name, exact: true });
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

function thisMonth(date: number) {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), date);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('DateTimePickerTextField', () => {
	test('is a labelled combobox that opens a dialog, with the format chip as description', async () => {
		const screen = await render(DateTimePickerTextField, { label: 'Start', locale: 'en-GB' });
		const input = screen.getByRole('combobox', { name: 'Start' });
		await expect.element(input).toHaveAttribute('type', 'text');
		await expect.element(input).toHaveAttribute('inputmode', 'numeric');
		await expect.element(input).toHaveAttribute('autocomplete', 'off');
		await expect.element(input).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(input).not.toHaveAttribute('aria-controls');
		await expect.element(input).not.toHaveAttribute('name');
		await expect.element(input).toHaveAccessibleDescription('dd/mm/yyyy hh:mm');
		const chip = screen.container.querySelector('.aurora-date-time-picker-text-field-format');
		expect(chip?.textContent?.trim()).toBe('dd/mm/yyyy hh:mm');
		expect(chip).toHaveAttribute('aria-hidden', 'true');
		expect(rootOf(screen.container)).toHaveAttribute('data-hour-cycle', '24');
		const icon = screen.getByRole('button', { name: 'Choose date and time' }).element().querySelector('path');
		expect(icon?.getAttribute('d')).toBe(CALENDAR_CLOCK_ICON);
	});

	test('the format chip hides itself before the text gets cut', async () => {
		const screen = await render(DateTimePickerTextField, { value: new Date(2026, 8, 24, 22, 30), clearable: true });
		const root = screen.container.querySelector<HTMLElement>('.aurora-date-time-picker-text-field')!;
		const steps = sweepFormatChip(root, '--date-time-picker-text-field-width');
		expect(steps[0]).toEqual({ width: 400, chip: true, fits: true });
		expect(steps.filter((step) => step.chip && !step.fits)).toEqual([]);
		expect(steps.some((step) => !step.chip && step.fits)).toBe(true);
		expect(steps.at(-1)!.chip).toBe(false);
	});

	test('the default en locale has MM/dd/yyyy, a 12-hour clock, letters on the keyboard and an am chip', async () => {
		const screen = await render(DateTimePickerTextField, { label: 'Start', value: at(24, 14, 30) });
		const input = screen.getByRole('combobox', { name: 'Start' });
		await expect.element(input).toHaveValue('09/24/2026 02:30 PM');
		await expect.element(input).toHaveAttribute('inputmode', 'text');
		await expect.element(input).toHaveAccessibleDescription('mm/dd/yyyy hh:mm am');
		expect(rootOf(screen.container)).toHaveAttribute('data-hour-cycle', '12');
	});

	test('format and hour12 force each part; formatLabel and showFormat change the chip', async () => {
		const forced = await render(DateTimePickerTextField, {
			label: 'A',
			locale: 'it',
			hour12: true,
			format: 'yyyy-MM-dd',
			value: at(24, 0, 15)
		});
		await expect.element(forced.getByRole('combobox')).toHaveValue('2026-09-24 12:15 AM');
		await expect.element(forced.getByRole('combobox')).toHaveAccessibleDescription('aaaa-mm-gg hh:mm am');
		await forced.unmount();
		const label = await render(DateTimePickerTextField, {
			label: 'B',
			hour12: false,
			value: at(24, 0, 15),
			formatLabel: 'MM/DD/YYYY HH.mm'
		});
		await expect.element(label.getByRole('combobox')).toHaveValue('09/24/2026 00:15');
		await expect.element(label.getByRole('combobox')).toHaveAccessibleDescription('MM/DD/YYYY HH.mm');
		await label.unmount();
		const hidden = await render(DateTimePickerTextField, { label: 'C', showFormat: false });
		await expect.element(hidden.getByRole('combobox')).not.toHaveAttribute('aria-describedby');
		expect(hidden.container.querySelector('.aurora-date-time-picker-text-field-format')).toBeNull();
	});

	test('typing keeps digits only, adds every separator, sets value and calls onchange without detail', async () => {
		const onchange = vi.fn();
		const value = bound<Date>();
		const screen = await render(
			DateTimePickerTextField,
			withBound({ label: 'Start', locale: 'en-GB', onchange }, { value })
		);
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('ab2409');
		await expect.element(input).toHaveValue('24/09');
		await userEvent.keyboard('2026');
		await expect.element(input).toHaveValue('24/09/2026');
		await userEvent.keyboard('9');
		await expect.element(input).toHaveValue('24/09/2026 09');
		await userEvent.keyboard('x3');
		await expect.element(input).toHaveValue('24/09/2026 09:3');
		expect(onchange).not.toHaveBeenCalled();
		expect(value.value).toBeUndefined();
		await userEvent.keyboard('0');
		await expect.element(input).toHaveValue('24/09/2026 09:30');
		expect(value.value).toEqual(at(24, 9, 30));
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ value: at(24, 9, 30) });
		expect(onchange.mock.calls[0][0]).not.toHaveProperty('detail');
		await expect.element(day(at(24))).toHaveAttribute('aria-selected', 'true');
		await expect.element(option('Hours', '09')).toHaveAttribute('aria-selected', 'true');
		await expect.element(option('Minutes', '30')).toHaveAttribute('aria-selected', 'true');
		await userEvent.keyboard('5');
		await expect.element(input).toHaveValue('24/09/2026 09:30');

		await userEvent.keyboard('{Backspace}');
		await expect.element(input).toHaveValue('24/09/2026 09:3');
		expect(value.value).toBeUndefined();
		expect(onchange).toHaveBeenLastCalledWith({ value: undefined });
	});

	test('typed separators pad the parts', async () => {
		const value = bound<Date>();
		const screen = await render(DateTimePickerTextField, withBound({ label: 'Start', locale: 'en-GB' }, { value }));
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('4/9/2026 7:');
		await expect.element(input).toHaveValue('04/09/2026 07:');
		await userEvent.keyboard('05');
		await expect.element(input).toHaveValue('04/09/2026 07:05');
		expect(value.value).toEqual(at(4, 7, 5));
	});

	test('on a 12-hour clock A and P set the period and a whole 24-hour time turns into 12-hour', async () => {
		const value = bound<Date>();
		const screen = await render(DateTimePickerTextField, withBound({ label: 'Start' }, { value }));
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('092420260930');
		await expect.element(input).toHaveValue('09/24/2026 09:30');
		expect(value.value).toBeUndefined();
		await userEvent.keyboard('p');
		await expect.element(input).toHaveValue('09/24/2026 09:30 PM');
		expect(value.value).toEqual(at(24, 21, 30));
		await userEvent.keyboard('a');
		await expect.element(input).toHaveValue('09/24/2026 09:30 AM');
		expect(value.value).toEqual(at(24, 9, 30));
		await userEvent.keyboard('{Backspace}');
		await expect.element(input).toHaveValue('09/24/2026 09:30');
		expect(value.value).toBeUndefined();

		await userEvent.fill(input, '');
		await userEvent.keyboard('092420261430');
		await expect.element(input).toHaveValue('09/24/2026 02:30 PM');
		expect(value.value).toEqual(at(24, 14, 30));
	});

	test('pasted ISO values and 12-hour times are converted to the format of the field', async () => {
		const value = bound<Date>();
		const screen = await render(DateTimePickerTextField, withBound({ label: 'Start', locale: 'en-GB' }, { value }));
		const input = screen.getByRole('combobox');
		const element = input.element() as HTMLInputElement;
		paste(element, '2026-09-24T18:45:00');
		await expect.element(input).toHaveValue('24/09/2026 18:45');
		expect(value.value).toEqual(at(24, 18, 45));
		paste(element, '25/09/2026 2:30 PM');
		await expect.element(input).toHaveValue('25/09/2026 14:30');
		expect(value.value).toEqual(at(25, 14, 30));
		paste(element, '2026-09-26');
		await expect.element(input).toHaveValue('26/09/2026 ');
		expect(value.value).toBeUndefined();
		element.focus();
		element.setSelectionRange(11, 11);
		await userEvent.keyboard('0800');
		await expect.element(input).toHaveValue('26/09/2026 08:00');
		expect(value.value).toEqual(at(26, 8));
	});

	test('a date and time that does not exist is an error with invalidText and a custom validity', async () => {
		const { form, onsubmit } = makeForm();
		const value = bound<Date>();
		const screen = await render(DateTimePickerTextField, {
			target: form,
			props: withBound({ label: 'Start', locale: 'en-GB', hint: 'Opening' }, { value })
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await expect.element(input).toHaveAccessibleDescription('Opening dd/mm/yyyy hh:mm');
		await input.click();
		await userEvent.keyboard('310220261000');
		await expect.element(input).toHaveValue('31/02/2026 10:00');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		expect(root).toHaveAttribute('data-state', 'error');
		expect(value.value).toBeUndefined();
		await expect.element(input).toHaveAccessibleDescription('Enter a valid date and time dd/mm/yyyy hh:mm');
		const element = input.element() as HTMLInputElement;
		expect(element.validationMessage).toBe('Enter a valid date and time');
		const oninvalid = vi.fn((event: Event) => event.preventDefault());
		form.addEventListener('invalid', oninvalid, true);
		form.requestSubmit();
		expect(onsubmit).not.toHaveBeenCalled();
		expect(oninvalid).toHaveBeenCalledOnce();

		await userEvent.fill(input, '24/09/2026 25:00');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await userEvent.fill(input, '24/09/2026 23:00');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		expect(root).not.toHaveAttribute('data-state');
		expect(value.value).toEqual(at(24, 23));
		expect(element.validity.valid).toBe(true);
		form.requestSubmit();
		expect(onsubmit).toHaveBeenCalledOnce();
		form.remove();
	});

	test('min and max are instants and isDateDisabled turns days off; invalidText changes the message', async () => {
		const screen = await render(DateTimePickerTextField, {
			label: 'Delivery',
			locale: 'en-GB',
			min: at(22, 8, 30),
			max: at(28, 18, 0),
			isDateDisabled: (date: Date) => date.getDay() === 0,
			invalidText: 'Outside the delivery window'
		});
		const input = screen.getByRole('combobox');
		await userEvent.fill(input, '22/09/2026 08:29');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await expect.element(screen.getByText('Outside the delivery window')).toBeVisible();
		await userEvent.fill(input, '22/09/2026 08:30');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		await userEvent.fill(input, '28/09/2026 18:00');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		await userEvent.fill(input, '28/09/2026 18:01');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await userEvent.fill(input, '27/09/2026 12:00');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await userEvent.fill(input, '21/09/2026 23:59');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	});

	test('an unfinished date and time, also a date alone, is an error only after the field loses focus', async () => {
		const screen = await render(DateTimePickerTextField, { label: 'Start', locale: 'en-GB' });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('24092026');
		await expect.element(input).toHaveValue('24/09/2026');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		(input.element() as HTMLInputElement).blur();
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		expect(rootOf(screen.container)).toHaveAttribute('data-state', 'error');
		await expect.element(screen.getByText('Enter a valid date and time')).toBeVisible();
	});

	test('on a 12-hour clock a date and time without AM or PM is unfinished', async () => {
		const screen = await render(DateTimePickerTextField, { label: 'Start' });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('092420261015');
		await expect.element(input).toHaveValue('09/24/2026 10:15');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		(input.element() as HTMLInputElement).blur();
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	});

	test('the state prop overrides the computed state', async () => {
		const screen = await render(DateTimePickerTextField, {
			label: 'Start',
			locale: 'en-GB',
			hint: 'Checked',
			state: 'success'
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await userEvent.fill(input, '99/99/9999 99:99');
		expect(root).toHaveAttribute('data-state', 'success');
		await expect.element(screen.getByText('Checked')).toBeVisible();
		await expect.element(screen.getByText('Enter a valid date and time')).not.toBeInTheDocument();
		expect(root.querySelector('.aurora-date-time-picker-text-field-state-icon')).not.toBeNull();

		await screen.rerender({ state: 'error', hint: 'Required' });
		expect(root).toHaveAttribute('data-state', 'error');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await expect.element(screen.getByText('Required')).toBeVisible();
	});

	test('value set from outside updates the text, drops the seconds, and undefined or an invalid Date empties it', async () => {
		const value = bound<Date | undefined>(new Date(2026, 8, 24, 14, 30, 45));
		const screen = await render(DateTimePickerTextField, withBound({ label: 'Start', locale: 'en-GB' }, { value }));
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveValue('24/09/2026 14:30');
		value.value = at(1, 7, 5);
		await expect.element(input).toHaveValue('01/09/2026 07:05');
		value.value = undefined;
		await expect.element(input).toHaveValue('');
		await userEvent.fill(input, '02/09/2026 08:00');
		expect(value.value).toEqual(at(2, 8));
		value.value = new Date(Number.NaN);
		await expect.element(input).toHaveValue('');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
	});

	test('a locale or hour12 change from outside reformats the text', async () => {
		const locale = bound('en-GB');
		const screen = await render(DateTimePickerTextField, withBound({ label: 'Start', value: at(24, 14, 30) }, { locale }));
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveValue('24/09/2026 14:30');
		locale.value = 'en';
		await expect.element(input).toHaveValue('09/24/2026 02:30 PM');
		await expect.element(input).toHaveAccessibleDescription('mm/dd/yyyy hh:mm am');
	});

	describe('desktop panel', () => {
		test('focus opens a dialog with the calendar and the time side by side, controlled by the input', async () => {
			const screen = await render(DateTimePickerTextField, { label: 'Start', locale: 'en-GB', value: at(24, 9, 30) });
			const input = screen.getByRole('combobox', { name: 'Start' });
			await userEvent.keyboard('{Tab}');
			await expect.element(input).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			const dialog = screen.getByRole('dialog', { name: 'Start' });
			await expect.element(dialog).toBeVisible();
			expect(dialog.element()).toHaveClass('aurora-date-time-picker-text-field-panel');
			expect(dialog.element().closest('.aurora-menu')?.matches(':popover-open')).toBe(true);
			await expect.element(input).toHaveAttribute('aria-controls', dialog.element().id);
			expect(rootOf(screen.container)).toHaveAttribute('data-open');
			const date = dialog.element().querySelector('.aurora-date-picker')!;
			const time = dialog.element().querySelector('.aurora-time-picker')!;
			expect(date.getBoundingClientRect().right).toBeLessThanOrEqual(time.getBoundingClientRect().left + 1);
			await expect.element(day(at(24))).toHaveAttribute('aria-selected', 'true');
			await expect.element(option('Hours', '09')).toHaveAttribute('aria-selected', 'true');
			await expect.element(option('Minutes', '30')).toHaveAttribute('aria-selected', 'true');
			await expect.element(input).toHaveFocus();
		});

		test('a click on the input opens it; without label the dialog is named by openLabel', async () => {
			const screen = await render(DateTimePickerTextField, { openLabel: 'Pick a moment' });
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('dialog', { name: 'Pick a moment' })).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(input).toHaveFocus();
			await input.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		});

		test('Arrow Down moves the focus to the chosen day; Escape closes and returns the focus', async () => {
			const screen = await render(DateTimePickerTextField, { label: 'Start', locale: 'en-GB', value: at(24, 9, 30) });
			const input = screen.getByRole('combobox');
			await userEvent.keyboard('{Tab}{Escape}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await expect.element(day(at(24))).toHaveFocus();
			await userEvent.keyboard('{Escape}');
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
			await expect.element(input).toHaveFocus();
			await wait(100);
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(rootOf(screen.container)).not.toHaveAttribute('data-open');
		});

		test('with the keyboard: a day keeps the time and moves to the hours, then the minutes close', async () => {
			const onchange = vi.fn();
			const value = bound<Date>(at(24, 9, 30));
			const screen = await render(
				DateTimePickerTextField,
				withBound({ label: 'Start', locale: 'en-GB', onchange }, { value })
			);
			const input = screen.getByRole('combobox');
			await input.click();
			await userEvent.keyboard('{ArrowDown}{ArrowRight}{Enter}');
			await expect.element(option('Hours', '09')).toHaveFocus();
			await expect.element(input).toHaveValue('25/09/2026 09:30');
			expect(value.value).toEqual(at(25, 9, 30));
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await userEvent.keyboard('{ArrowDown}{Enter}');
			await expect.element(option('Minutes', '30')).toHaveFocus();
			await expect.element(input).toHaveValue('25/09/2026 10:30');
			await userEvent.keyboard('{ArrowDown}{Enter}');
			await expect.element(input).toHaveValue('25/09/2026 10:35');
			await expect.element(input).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(onchange.mock.calls).toEqual([
				[{ value: at(25, 9, 30) }],
				[{ value: at(25, 10, 30) }],
				[{ value: at(25, 10, 35) }]
			]);
		});

		test('with the mouse: a day keeps the panel open and the focus on the input, a minute closes it', async () => {
			const value = bound<Date>(at(24, 9, 30));
			const screen = await render(DateTimePickerTextField, withBound({ label: 'Start', locale: 'en-GB' }, { value }));
			const input = screen.getByRole('combobox');
			await input.click();
			await day(at(10)).click();
			await expect.element(input).toHaveValue('10/09/2026 09:30');
			expect(value.value).toEqual(at(10, 9, 30));
			await expect.element(input).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await option('Hours', '18').click();
			await expect.element(input).toHaveValue('10/09/2026 18:30');
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await option('Minutes', '45').click();
			await expect.element(input).toHaveValue('10/09/2026 18:45');
			expect(value.value).toEqual(at(10, 18, 45));
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
			await expect.element(input).toHaveFocus();
		});

		test('without a time, a day starts at 00:00', async () => {
			const value = bound<Date>();
			const screen = await render(DateTimePickerTextField, withBound({ label: 'Start', locale: 'en-GB' }, { value }));
			const input = screen.getByRole('combobox');
			await input.click();
			const target = thisMonth(15);
			await day(target).click();
			expect(value.value).toEqual(target);
			await expect.element(option('Hours', '00')).toHaveAttribute('aria-selected', 'true');
			await expect.element(option('Minutes', '00')).toHaveAttribute('aria-selected', 'true');
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		});

		test('a time chosen before the day waits for it, and the day then closes the panel', async () => {
			const onchange = vi.fn();
			const value = bound<Date>();
			const screen = await render(
				DateTimePickerTextField,
				withBound({ label: 'Start', locale: 'en-GB', onchange }, { value })
			);
			const input = screen.getByRole('combobox');
			await input.click();
			await option('Hours', '08').click();
			await option('Minutes', '15').click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await expect.element(input).toHaveValue('');
			expect(value.value).toBeUndefined();
			expect(onchange).not.toHaveBeenCalled();
			const target = thisMonth(15);
			await day(target).click();
			const expected = new Date(target);
			expected.setHours(8, 15);
			expect(value.value).toEqual(expected);
			expect(onchange).toHaveBeenCalledExactlyOnceWith({ value: expected });
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		});

		test('an hour chosen alone before the day is used with :00', async () => {
			const value = bound<Date>();
			const screen = await render(DateTimePickerTextField, withBound({ label: 'Start', locale: 'en-GB' }, { value }));
			await screen.getByRole('combobox').click();
			await option('Hours', '14').click();
			const target = thisMonth(15);
			await day(target).click();
			const expected = new Date(target);
			expected.setHours(14, 0);
			expect(value.value).toEqual(expected);
			await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
		});

		test('a typed date waits for a time chosen in the panel', async () => {
			const value = bound<Date>();
			const screen = await render(DateTimePickerTextField, withBound({ label: 'Start', locale: 'en-GB' }, { value }));
			const input = screen.getByRole('combobox');
			await input.click();
			await userEvent.keyboard('24092026');
			await expect.element(day(at(24))).toHaveAttribute('aria-selected', 'true');
			await option('Hours', '11').click();
			await expect.element(input).toHaveValue('24/09/2026');
			expect(value.value).toBeUndefined();
			await option('Minutes', '20').click();
			await expect.element(input).toHaveValue('24/09/2026 11:20');
			expect(value.value).toEqual(at(24, 11, 20));
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		});

		test('on a 12-hour clock the panel closes when AM or PM completes the time', async () => {
			const value = bound<Date>(at(24, 7, 15));
			const screen = await render(DateTimePickerTextField, withBound({ label: 'Start' }, { value }));
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(option('AM/PM', 'AM')).toHaveAttribute('aria-selected', 'true');
			await option('AM/PM', 'PM').click();
			await expect.element(input).toHaveValue('09/24/2026 07:15 PM');
			expect(value.value).toEqual(at(24, 19, 15));
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		});

		test('min and max limit the days, and the hours and minutes on their own days; a day moves the time inside', async () => {
			const value = bound<Date>(at(24, 7, 0));
			const screen = await render(
				DateTimePickerTextField,
				withBound(
					{ label: 'Start', locale: 'en-GB', min: at(22, 8, 30), max: at(28, 18, 0), minuteStep: 30 },
					{ value }
				)
			);
			await screen.getByRole('combobox').click();
			await expect.element(day(at(21))).toHaveAttribute('aria-disabled', 'true');
			await expect.element(day(at(29))).toHaveAttribute('aria-disabled', 'true');
			await expect.element(option('Hours', '07')).not.toHaveAttribute('aria-disabled');
			await day(at(22)).click();
			expect(value.value).toEqual(at(22, 8, 30));
			await expect.element(option('Hours', '07')).toHaveAttribute('aria-disabled', 'true');
			await expect.element(option('Hours', '08')).not.toHaveAttribute('aria-disabled');
			await expect.element(option('Minutes', '00')).toHaveAttribute('aria-disabled', 'true');
			await expect.element(option('Minutes', '30')).toHaveAttribute('aria-selected', 'true');
			await option('Hours', '20').click();
			expect(value.value).toEqual(at(22, 20, 30));
			await day(at(28)).click();
			expect(value.value).toEqual(at(28, 18, 0));
			await expect.element(option('Hours', '19')).toHaveAttribute('aria-disabled', 'true');
		});

		test('closeOnSelect={false} keeps the panel open', async () => {
			const screen = await render(DateTimePickerTextField, {
				label: 'Start',
				locale: 'en-GB',
				value: at(24, 9, 30),
				closeOnSelect: false
			});
			const input = screen.getByRole('combobox');
			await input.click();
			await option('Minutes', '45').click();
			await expect.element(input).toHaveValue('24/09/2026 09:45');
			await wait(100);
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		});

		test('minuteStep, the column names and the arrow labels reach the panel', async () => {
			const screen = await render(DateTimePickerTextField, {
				label: 'Start',
				locale: 'en-GB',
				value: at(24, 9, 30),
				minuteStep: 20,
				hoursLabel: 'Ore',
				minutesLabel: 'Minuti',
				previousMonthLabel: 'Mese precedente',
				nextMonthLabel: 'Mese successivo'
			});
			await screen.getByRole('combobox').click();
			const minutes = page.getByRole('listbox', { name: 'Minuti' }).getByRole('option');
			await expect
				.poll(() => minutes.elements().map((node) => node.textContent?.trim()))
				.toEqual(['00', '20', '30', '40']);
			await expect.element(page.getByRole('listbox', { name: 'Ore' })).toBeVisible();
			await expect.element(page.getByRole('button', { name: 'Mese precedente' })).toBeVisible();
			await expect.element(page.getByRole('button', { name: 'Mese successivo' })).toBeVisible();
		});

		test('periodLabel names the AM/PM column', async () => {
			const screen = await render(DateTimePickerTextField, { label: 'Start', periodLabel: 'Prima o dopo mezzogiorno' });
			await screen.getByRole('combobox').click();
			await expect.element(page.getByRole('listbox', { name: 'Prima o dopo mezzogiorno' })).toBeVisible();
		});

		test('Enter in the input closes the panel without submitting the form', async () => {
			const { form, onsubmit } = makeForm();
			form.append(document.createElement('button'));
			const screen = await render(DateTimePickerTextField, { target: form, props: { label: 'Start' } });
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(onsubmit).not.toHaveBeenCalled();
			form.remove();
		});

		test('Tab closes the panel and moves on', async () => {
			const screen = await render(DateTimePickerTextField, { label: 'Start', value: at(24, 9, 30) });
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

		test('Tab moves from the calendar to the time columns inside the panel', async () => {
			const screen = await render(DateTimePickerTextField, { label: 'Start', locale: 'en-GB', value: at(24, 9, 30) });
			const input = screen.getByRole('combobox');
			await input.click();
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(day(at(24))).toHaveFocus();
			await userEvent.keyboard('{Tab}');
			await expect.element(option('Hours', '09')).toHaveFocus();
			await userEvent.keyboard('{Tab}');
			await expect.element(option('Minutes', '30')).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		});

		test('reopening while the panel is closing leaves it usable', async () => {
			const target = document.createElement('div');
			target.style.setProperty('--menu-duration', '1s');
			document.body.append(target);
			const screen = await render(DateTimePickerTextField, {
				target,
				props: { label: 'Start', locale: 'en-GB', value: at(24, 9, 30) }
			});
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('dialog')).toBeVisible();
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(day(at(24))).toHaveFocus();
			expect(target.querySelector('.aurora-menu')).not.toHaveAttribute('inert');
			target.remove();
		});

		test('a click outside closes the panel', async () => {
			const screen = await render(DateTimePickerTextField, { label: 'Start' });
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('dialog')).toBeVisible();
			await userEvent.click(document.body, { position: { x: 1000, y: 700 } });
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		});

		test('the calendar button toggles the panel and keeps the focus on the input', async () => {
			const screen = await render(DateTimePickerTextField, { label: 'Start' });
			const input = screen.getByRole('combobox');
			const toggle = screen.getByRole('button', { name: 'Choose date and time' });
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
			const screen = await render(DateTimePickerTextField, withBound({ label: 'Start' }, { open }));
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
			const screen = await render(DateTimePickerTextField, {
				target: form,
				props: { label: 'Start', locale: 'en-GB', value: at(24, 9, 30) }
			});
			await screen.getByRole('combobox').click();
			await page.getByRole('button', { name: 'Next month' }).click();
			await page.getByRole('button', { name: 'Previous month' }).click();
			await day(at(25)).click();
			await option('Hours', '10').click();
			await option('Minutes', '00').click();
			expect(onsubmit).not.toHaveBeenCalled();
			form.remove();
		});

		test('every field has its own ids and panel', async () => {
			const first = await render(DateTimePickerTextField, { label: 'First' });
			const second = await render(DateTimePickerTextField, { label: 'Second' });
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
		test('the calendar button opens a modal bottom drawer with the time below the calendar', async () => {
			await page.viewport(800, 900);
			try {
				const onchange = vi.fn();
				const screen = await render(DateTimePickerTextField, {
					label: 'Start',
					locale: 'en-GB',
					value: at(24, 9, 30),
					onchange
				});
				const input = screen.getByRole('combobox', { name: 'Start' });
				await input.click();
				await expect.element(input).toHaveFocus();
				await wait(100);
				await expect.element(input).toHaveAttribute('aria-expanded', 'false');
				await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();

				await screen.getByRole('button', { name: 'Choose date and time' }).click();
				const drawer = screen.getByRole('dialog', { name: 'Start' });
				await expect.element(drawer).toBeVisible();
				expect(drawer.element().tagName).toBe('DIALOG');
				expect(drawer.element().matches(':modal')).toBe(true);
				expect(drawer.element()).toHaveAttribute('data-position', 'bottom');
				const date = drawer.element().querySelector('.aurora-date-picker')!;
				const time = drawer.element().querySelector('.aurora-time-picker')!;
				expect(date.getBoundingClientRect().bottom).toBeLessThanOrEqual(time.getBoundingClientRect().top + 1);
				await expect.element(day(at(24))).toHaveFocus();
				await expect.element(input).toHaveAttribute('aria-expanded', 'true');

				await userEvent.keyboard('{ArrowRight}{Enter}');
				await expect.element(option('Hours', '09')).toHaveFocus();
				await userEvent.keyboard('{Enter}');
				await expect.element(option('Minutes', '30')).toHaveFocus();
				await userEvent.keyboard('{ArrowDown}{Enter}');
				await expect.element(drawer).not.toBeInTheDocument();
				await expect.element(input).toHaveValue('25/09/2026 09:35');
				await expect.element(input).toHaveAttribute('aria-expanded', 'false');
				expect(onchange).toHaveBeenLastCalledWith({ value: at(25, 9, 35) });
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('the field stays typable and a click on a minute closes the drawer', async () => {
			await page.viewport(800, 900);
			try {
				const screen = await render(DateTimePickerTextField, { label: 'Start', locale: 'en-GB' });
				const input = screen.getByRole('combobox');
				await expect.element(input).toHaveAttribute('inputmode', 'numeric');
				await input.click();
				await userEvent.keyboard('240920261015');
				await expect.element(input).toHaveValue('24/09/2026 10:15');
				await expect.element(input).toHaveAttribute('aria-expanded', 'false');
				await screen.getByRole('button', { name: 'Choose date and time' }).click();
				await expect.element(day(at(24))).toHaveFocus();
				await option('Minutes', '45').click();
				await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
				await expect.element(input).toHaveValue('24/09/2026 10:45');
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('drawerTitle names the drawer, whose close button closes it without a change', async () => {
			await page.viewport(800, 900);
			try {
				const onchange = vi.fn();
				const screen = await render(DateTimePickerTextField, {
					label: 'Start',
					drawerTitle: 'Pick the start',
					closeLabel: 'Done',
					locale: 'en-GB',
					value: at(24, 9, 30),
					onchange
				});
				await screen.getByRole('button', { name: 'Choose date and time' }).click();
				const drawer = screen.getByRole('dialog', { name: 'Pick the start' });
				await expect.element(drawer).toBeVisible();
				await drawer.getByRole('button', { name: 'Done' }).click();
				await expect.element(drawer).not.toBeInTheDocument();
				await expect.element(screen.getByRole('combobox')).toHaveValue('24/09/2026 09:30');
				expect(onchange).not.toHaveBeenCalled();
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('mobileDrawer={false} keeps the menu on small screens', async () => {
			await page.viewport(800, 900);
			try {
				const screen = await render(DateTimePickerTextField, { label: 'Start', mobileDrawer: false });
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
		const value = bound<Date>(at(24, 9, 30));
		const screen = await render(
			DateTimePickerTextField,
			withBound({ label: 'Start', locale: 'en-GB', clearable: true, clearLabel: 'Remove', onchange }, { value })
		);
		const input = screen.getByRole('combobox');
		const clear = screen.getByRole('button', { name: 'Remove' });
		await expect.element(clear).toHaveAttribute('type', 'button');
		await clear.click();
		await expect.element(input).toHaveValue('');
		expect(value.value).toBeUndefined();
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ value: undefined });
		await expect.element(input).toHaveFocus();
		await expect.element(clear).not.toBeInTheDocument();

		await userEvent.keyboard('{Escape}2');
		await screen.getByRole('button', { name: 'Remove' }).click();
		await expect.element(input).toHaveValue('');
		expect(onchange).toHaveBeenCalledOnce();
	});

	test('disabled blocks opening and editing', async () => {
		const screen = await render(DateTimePickerTextField, {
			label: 'Start',
			disabled: true,
			clearable: true,
			value: at(24, 9, 30)
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await expect.element(input).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Choose date and time' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
		expect(root).toHaveAttribute('data-disabled');
		await userEvent.click(root.querySelector('.aurora-date-time-picker-text-field-control')!);
		await screen.getByRole('button', { name: 'Choose date and time' }).click({ force: true });
		await expect.element(input).not.toHaveFocus();
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
	});

	test('readonly shows the value but blocks opening and editing', async () => {
		const onchange = vi.fn();
		const screen = await render(DateTimePickerTextField, {
			label: 'Start',
			locale: 'en-GB',
			readonly: true,
			clearable: true,
			value: at(24, 9, 30),
			onchange
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveAttribute('readonly');
		expect(rootOf(screen.container)).toHaveAttribute('data-readonly');
		await expect.element(screen.getByRole('button', { name: 'Choose date and time' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
		await input.click();
		await userEvent.keyboard('{ArrowDown}1');
		await expect.element(input).toHaveValue('24/09/2026 09:30');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		expect(onchange).not.toHaveBeenCalled();
	});

	test('name submits the local yyyy-MM-ddTHH:mm in a hidden input, empty without a value; required reaches the input', async () => {
		const { form } = makeForm();
		const screen = await render(DateTimePickerTextField, {
			target: form,
			props: { label: 'Start', name: 'start', required: true }
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toBeRequired();
		expect([...new FormData(form).entries()]).toEqual([['start', '']]);
		await input.click();
		await userEvent.keyboard('092420260730p');
		await expect.element(input).toHaveValue('09/24/2026 07:30 PM');
		expect([...new FormData(form).entries()]).toEqual([['start', '2026-09-24T19:30']]);
		await userEvent.keyboard('{Backspace}');
		expect([...new FormData(form).entries()]).toEqual([['start', '']]);
		form.remove();
	});

	test('id sets the input id, which the label points to', async () => {
		const screen = await render(DateTimePickerTextField, { label: 'Start', id: 'start-at' });
		await expect.element(screen.getByRole('combobox', { name: 'Start' })).toHaveAttribute('id', 'start-at');
		expect(screen.container.querySelector('label')).toHaveAttribute('for', 'start-at');
	});

	test('native attributes and events reach the input', async () => {
		const handlers = {
			oninput: vi.fn(),
			onfocus: vi.fn(),
			onblur: vi.fn(),
			onclick: vi.fn(),
			onkeydown: vi.fn()
		};
		const screen = await render(DateTimePickerTextField, {
			label: 'Start',
			title: 'Start date and time',
			placeholder: 'When?',
			inputmode: 'decimal',
			'data-testid': 'start',
			'aria-describedby': 'external',
			...handlers
		});
		const input = screen.getByTestId('start');
		await expect.element(input).toHaveAttribute('title', 'Start date and time');
		await expect.element(input).toHaveAttribute('placeholder', 'When?');
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
		const screen = await render(DateTimePickerTextField, {
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
		const screen = await render(DateTimePickerTextField, {
			label: 'Start',
			hint: 'Opening',
			state: 'success',
			locale: 'en-GB',
			value: at(24, 9, 30),
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
			daySnippet: snippetOf<{ date: Date }>(({ date }) => `<i class="custom-day">d${date.getDate()}</i>`),
			dayAppendSnippet: snippetOf<{ date: Date }>(({ date }) =>
				date.getDate() === 24 ? '<i data-testid="day-append"></i>' : '<i></i>'
			),
			optionSnippet: snippetOf<{ label: string; column: string }>(
				({ label, column }) => `<i class="custom-option">${column}-${label}</i>`
			)
		});
		const root = rootOf(screen.container);
		await expect.element(screen.getByRole('combobox', { name: 'Start *' })).toBeVisible();
		expect(root.querySelector('.aurora-date-time-picker-text-field-hint')?.textContent?.trim()).toBe('Opening!');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('success');
		await expect.element(screen.getByTestId('format')).toHaveTextContent('dd/MM/yyyy hh:mm');
		expect(
			screen.getByRole('button', { name: 'Choose date and time' }).element().querySelector('[data-testid="icon"]')
		).not.toBeNull();
		const control = root.querySelector('.aurora-date-time-picker-text-field-control')!;
		expect(control.querySelector('.aurora-date-time-picker-text-field-end [data-testid="append-inner"]')).not.toBeNull();
		expect(control.contains(screen.getByTestId('prepend').element())).toBe(false);
		expect(control.contains(screen.getByTestId('append').element())).toBe(false);
		expect(screen.getByRole('button', { name: 'Clear' }).element().querySelector('[data-testid="clear"]')).not.toBeNull();
		await screen.getByRole('combobox').click();
		await expect.element(option('Hours', 'hours-09')).toBeVisible();
		await expect.element(day(at(24))).toHaveTextContent('d24');
		await expect.element(page.getByTestId('day-append')).toBeInTheDocument();
	});

	test('binds the input element', async () => {
		let input: HTMLInputElement | undefined;
		const screen = await render(DateTimePickerTextField, {
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
		const screen = await render(DateTimePickerTextField, {
			label: 'Start',
			hint: 'Hint',
			class: {
				container: 'app-container',
				label: 'app-label',
				row: 'app-row',
				field: 'app-field',
				input: 'app-input',
				hint: 'app-hint',
				panel: 'app-panel',
				datePicker: 'app-date',
				timePicker: 'app-time'
			}
		});
		const root = rootOf(screen.container);
		expect(root).toHaveClass('app-container');
		expect(root.querySelector('label')).toHaveClass('aurora-date-time-picker-text-field-label', 'app-label');
		expect(root.querySelector('.aurora-date-time-picker-text-field-row')).toHaveClass('app-row');
		expect(root.querySelector('.aurora-date-time-picker-text-field-control')).toHaveClass('app-field');
		expect(root.querySelector('.aurora-date-time-picker-text-field-hint')).toHaveClass('app-hint');
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveClass('app-input');
		await input.click();
		const dialog = screen.getByRole('dialog');
		await expect.element(dialog).toHaveClass('app-panel');
		expect(dialog.element().querySelector('.aurora-date-picker')).toHaveClass('app-date');
		expect(dialog.element().querySelector('.aurora-time-picker')).toHaveClass('app-time');
	});

	test('exposes its state as data attributes', async () => {
		const screen = await render(DateTimePickerTextField, { label: 'Start' });
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
			'--date-time-picker-text-field-border-color: rgb(1, 2, 3)',
			'--date-time-picker-text-field-height: 50px',
			'--date-time-picker-text-field-divider-color: rgb(7, 8, 9)',
			'--time-picker-option-selected-background: rgb(4, 5, 6)'
		].join(';');
		document.body.append(target);
		const screen = await render(DateTimePickerTextField, {
			target,
			props: { label: 'Start', locale: 'en-GB', value: at(24, 9, 30) }
		});
		const control = target.querySelector('.aurora-date-time-picker-text-field-control')!;
		expect(getComputedStyle(control).borderTopColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(control).height).toBe('50px');
		await screen.getByRole('combobox').click();
		await expect.element(option('Hours', '09')).toBeVisible();
		expect(getComputedStyle(option('Hours', '09').element()).backgroundColor).toBe('rgb(4, 5, 6)');
		const time = target.querySelector('.aurora-time-picker') ?? document.querySelector('.aurora-time-picker')!;
		expect(getComputedStyle(time).borderInlineStartColor).toBe('rgb(7, 8, 9)');
		target.remove();
	});
});

describe('DateTimePickerTextField texts', () => {
	test('follow locale, with the format letters of the language, and a text prop wins', async () => {
		const italian = await render(DateTimePickerTextField, { label: 'Inizio', locale: 'it' });
		const input = italian.getByRole('combobox', { name: 'Inizio' });
		await expect.element(input).toHaveAccessibleDescription('gg/mm/aaaa hh:mm');
		await expect.element(italian.getByRole('button', { name: 'Scegli data e ora' })).toBeInTheDocument();
		await italian.unmount();
		const own = await render(DateTimePickerTextField, { label: 'Inizio', locale: 'it', openLabel: 'Calendario' });
		await expect.element(own.getByRole('button', { name: 'Calendario' })).toBeInTheDocument();
	});

	test('setDefaultLocale sets the texts and the format; the locale prop wins over it', async () => {
		const value = at(24, 14, 30);
		const inherited = await renderWithDefaultLocale('it', DateTimePickerTextField, { label: 'Inizio', value });
		const input = inherited.getByRole('combobox', { name: 'Inizio' });
		await expect.element(input).toHaveValue('24/09/2026 14:30');
		await expect.element(input).toHaveAccessibleDescription('gg/mm/aaaa hh:mm');
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', DateTimePickerTextField, { label: 'Start', value, locale: 'en' });
		const field = own.getByRole('combobox', { name: 'Start' });
		await expect.element(field).toHaveValue('09/24/2026 02:30 PM');
		await expect.element(own.getByRole('button', { name: 'Choose date and time' })).toBeInTheDocument();
	});
});
