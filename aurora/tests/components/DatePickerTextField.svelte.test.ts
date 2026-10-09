import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { CalendarDay } from '#lib/components/simple/dates/Calendar.svelte';
import DatePickerTextField from '#lib/components/composed/forms/DatePickerTextField.svelte';
import { snippet } from '../helpers.js';

type Change = { selectedDate: Date | undefined; selectedDateTo: Date | undefined };

const fullDate = new Intl.DateTimeFormat('en', { dateStyle: 'full' });

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
	return container.querySelector<HTMLElement>('.aurora-date-picker-text-field')!;
}

function day(date: Date) {
	return page.getByRole('gridcell', { name: fullDate.format(date), exact: true });
}

function makeForm() {
	const form = document.createElement('form');
	const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
	form.addEventListener('submit', onsubmit);
	document.body.append(form);
	return { form, onsubmit };
}

describe('DatePickerTextField', () => {
	test('is a labelled combobox that opens a dialog, with the format chip as description', async () => {
		const screen = await render(DatePickerTextField, { label: 'Booking' });
		const input = screen.getByRole('combobox', { name: 'Booking' });
		await expect.element(input).toHaveAttribute('type', 'text');
		await expect.element(input).toHaveAttribute('inputmode', 'numeric');
		await expect.element(input).toHaveAttribute('autocomplete', 'off');
		await expect.element(input).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(input).not.toHaveAttribute('aria-controls');
		await expect.element(input).not.toHaveAttribute('name');
		await expect.element(input).toHaveAccessibleDescription('mm/dd/yyyy');
		const chip = screen.container.querySelector('.aurora-date-picker-text-field-format');
		expect(chip?.textContent?.trim()).toBe('mm/dd/yyyy');
		expect(chip).toHaveAttribute('aria-hidden', 'true');
		expect(screen.getByLabelText('Booking').element()).toBe(input.element());
	});

	test('locale decides the format of the text and of the chip; format overrides it', async () => {
		const date = new Date(2026, 9, 9);
		const cases = [
			[{ locale: 'en' }, '10/09/2026', 'mm/dd/yyyy'],
			[{ locale: 'it' }, '09/10/2026', 'dd/mm/yyyy'],
			[{ locale: 'en-GB' }, '09/10/2026', 'dd/mm/yyyy'],
			[{ locale: 'it', format: 'yyyy-MM-dd' }, '2026-10-09', 'yyyy-mm-dd'],
			[{ format: 'dd.MM.yyyy', formatLabel: 'tt.mm.jjjj' }, '09.10.2026', 'tt.mm.jjjj']
		] as const;
		for (const [props, value, chip] of cases) {
			const screen = await render(DatePickerTextField, { ...props, label: 'Day', selectedDate: date });
			const input = screen.getByRole('combobox', { name: 'Day' });
			await expect.element(input).toHaveValue(value);
			await expect.element(input).toHaveAccessibleDescription(chip);
			const shown = screen.container.querySelector('.aurora-date-picker-text-field-format');
			expect(shown?.textContent?.trim()).toBe(chip);
			await screen.unmount();
		}
	});

	test('showFormat={false} hides the chip and its description', async () => {
		const screen = await render(DatePickerTextField, { label: 'Booking', showFormat: false });
		const input = screen.getByRole('combobox', { name: 'Booking' });
		await expect.element(input).not.toHaveAttribute('aria-describedby');
		expect(screen.container.querySelector('.aurora-date-picker-text-field-format')).toBeNull();
	});

	test('typing keeps digits only, adds the separators and pads the parts', async () => {
		const screen = await render(DatePickerTextField, { label: 'Booking' });
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('ab2/3');
		await expect.element(input).toHaveValue('02/3');
		await userEvent.keyboard('/');
		await expect.element(input).toHaveValue('02/03/');
		await userEvent.keyboard('2x0y26');
		await expect.element(input).toHaveValue('02/03/2026');
	});

	test('editing a part in the middle keeps the other parts', async () => {
		const date = bound<Date>(new Date(2026, 9, 10));
		const screen = await render(
			DatePickerTextField,
			withBound({ label: 'Booking', locale: 'it' }, { selectedDate: date })
		);
		const input = screen.getByRole('combobox');
		const node = input.element() as HTMLInputElement;
		await input.click();
		node.setSelectionRange(0, 2);
		await userEvent.keyboard('15');
		await expect.element(input).toHaveValue('15/10/2026');
		expect(date.value).toEqual(new Date(2026, 9, 15));
		node.setSelectionRange(3, 5);
		await userEvent.keyboard('12');
		await expect.element(input).toHaveValue('15/12/2026');
		expect(date.value).toEqual(new Date(2026, 11, 15));
		node.setSelectionRange(5, 5);
		await userEvent.keyboard('{Backspace}');
		await expect.element(input).toHaveValue('15/1/2026');
		expect(date.value).toBeUndefined();
		await userEvent.keyboard('1');
		await expect.element(input).toHaveValue('15/11/2026');
		expect(date.value).toEqual(new Date(2026, 10, 15));
	});

	test('a whole valid date sets selectedDate and calls onchange without detail', async () => {
		const onchange = vi.fn();
		const date = bound<Date>();
		const screen = await render(
			DatePickerTextField,
			withBound({ label: 'Booking', onchange }, { selectedDate: date })
		);
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('1009202');
		expect(onchange).not.toHaveBeenCalled();
		expect(date.value).toBeUndefined();
		await userEvent.keyboard('6');
		await expect.element(input).toHaveValue('10/09/2026');
		expect(date.value).toEqual(new Date(2026, 9, 9));
		expect(onchange).toHaveBeenCalledExactlyOnceWith({
			selectedDate: new Date(2026, 9, 9),
			selectedDateTo: undefined
		});
		expect(onchange.mock.calls[0][0]).not.toHaveProperty('detail');
		await expect.element(day(new Date(2026, 9, 9))).toHaveAttribute('aria-selected', 'true');
		expect(rootOf(screen.container)).not.toHaveAttribute('data-state');

		await userEvent.keyboard('{Backspace}');
		await expect.element(input).toHaveValue('10/09/202');
		expect(date.value).toBeUndefined();
		expect(onchange).toHaveBeenLastCalledWith({ selectedDate: undefined, selectedDateTo: undefined });
		expect(onchange).toHaveBeenCalledTimes(2);
	});

	test('a date that does not exist is an error with invalidText and a custom validity', async () => {
		const { form, onsubmit } = makeForm();
		const onchange = vi.fn();
		const screen = await render(DatePickerTextField, {
			target: form,
			props: { label: 'Booking', hint: 'Pick a weekday', onchange }
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await expect.element(input).toHaveAccessibleDescription('Pick a weekday mm/dd/yyyy');
		await userEvent.fill(input, '02/30/2026');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		expect(root).toHaveAttribute('data-state', 'error');
		await expect.element(screen.getByText('Enter a valid date')).toBeVisible();
		await expect.element(input).toHaveAccessibleDescription('Enter a valid date mm/dd/yyyy');
		const element = input.element() as HTMLInputElement;
		expect(element.validity.customError).toBe(true);
		expect(element.validationMessage).toBe('Enter a valid date');
		expect(onchange).not.toHaveBeenCalled();
		const oninvalid = vi.fn((event: Event) => event.preventDefault());
		form.addEventListener('invalid', oninvalid, true);
		form.requestSubmit();
		expect(onsubmit).not.toHaveBeenCalled();
		expect(oninvalid).toHaveBeenCalledOnce();
		expect(oninvalid.mock.calls[0][0].target).toBe(input.element());

		await userEvent.fill(input, '02/28/2026');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		expect(root).not.toHaveAttribute('data-state');
		await expect.element(screen.getByText('Pick a weekday')).toBeVisible();
		expect(element.validity.valid).toBe(true);
		form.requestSubmit();
		expect(onsubmit).toHaveBeenCalledOnce();
		form.remove();
	});

	test('min, max and isDateDisabled make a typed date invalid; invalidText changes the message', async () => {
		const date = bound<Date>();
		const screen = await render(
			DatePickerTextField,
			withBound(
				{
					label: 'Booking',
					min: new Date(2026, 8, 1),
					max: new Date(2026, 11, 31),
					isDateDisabled: (value: Date) => value.getDay() === 0,
					invalidText: 'Closed or out of season'
				},
				{ selectedDate: date }
			)
		);
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		for (const text of ['08/31/2026', '01/01/2027', '10/11/2026']) {
			await userEvent.fill(input, text);
			await expect.element(input).toHaveAttribute('aria-invalid', 'true');
			expect(root).toHaveAttribute('data-state', 'error');
			expect(date.value).toBeUndefined();
			await expect.element(screen.getByText('Closed or out of season')).toBeVisible();
		}
		await userEvent.fill(input, '10/12/2026');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		expect(date.value).toEqual(new Date(2026, 9, 12));
	});

	test('an unfinished date is an error only after the field loses focus', async () => {
		const screen = await render(DatePickerTextField, { label: 'Booking' });
		const after = document.createElement('button');
		after.textContent = 'After';
		screen.container.append(after);
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('10/0');
		await expect.element(input).toHaveValue('10/0');
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		expect(rootOf(screen.container)).not.toHaveAttribute('data-state');
		expect((input.element() as HTMLInputElement).validity.valid).toBe(true);

		await userEvent.keyboard('{Tab}');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		expect(rootOf(screen.container)).toHaveAttribute('data-state', 'error');
		expect((input.element() as HTMLInputElement).validationMessage).toBe('Enter a valid date');
	});

	test('the state prop overrides the computed state', async () => {
		const screen = await render(DatePickerTextField, {
			label: 'Booking',
			hint: 'Checked by the clinic',
			state: 'success'
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		expect(root).toHaveAttribute('data-state', 'success');
		await userEvent.fill(input, '02/30/2026');
		expect(root).toHaveAttribute('data-state', 'success');
		await expect.element(screen.getByText('Checked by the clinic')).toBeVisible();
		await expect.element(screen.getByText('Enter a valid date')).not.toBeInTheDocument();
		expect(root.querySelector('.aurora-date-picker-text-field-state-icon')).not.toBeNull();

		await screen.rerender({ state: 'error', hint: 'Required' });
		expect(root).toHaveAttribute('data-state', 'error');
		await expect.element(screen.getByText('Required')).toBeVisible();
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	});

	test('paste and autofill of yyyy-mm-dd are converted to the format', async () => {
		const date = bound<Date>();
		const screen = await render(
			DatePickerTextField,
			withBound({ label: 'Booking', locale: 'it' }, { selectedDate: date })
		);
		const input = screen.getByRole('combobox');
		await userEvent.fill(input, '2026-10-09');
		await expect.element(input).toHaveValue('09/10/2026');
		expect(date.value).toEqual(new Date(2026, 9, 9));

		const element = input.element() as HTMLInputElement;
		element.value = '2026-12-25T10:00:00Z';
		element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }));
		await expect.element(input).toHaveValue('25/12/2026');
		expect(date.value).toEqual(new Date(2026, 11, 25));
	});

	test('v4 bug: paste and autofill are parsed on input, with no keydown', async () => {
		const onchange = vi.fn();
		const screen = await render(DatePickerTextField, { label: 'Booking', onchange });
		const input = screen.getByRole('combobox');
		await userEvent.fill(input, '10/09/2026');
		expect(onchange).toHaveBeenLastCalledWith({
			selectedDate: new Date(2026, 9, 9),
			selectedDateTo: undefined
		});
		const element = input.element() as HTMLInputElement;
		element.value = '12/24/2026';
		element.dispatchEvent(new Event('input', { bubbles: true }));
		expect(onchange).toHaveBeenLastCalledWith({
			selectedDate: new Date(2026, 11, 24),
			selectedDateTo: undefined
		});
		await expect.element(input).toHaveValue('12/24/2026');
	});

	test('v4 bug: a 1950 date can be typed when there is no min', async () => {
		const date = bound<Date>();
		const screen = await render(DatePickerTextField, withBound({ label: 'Birth date' }, { selectedDate: date }));
		const input = screen.getByRole('combobox');
		await input.click();
		await userEvent.keyboard('05121950');
		await expect.element(input).toHaveValue('05/12/1950');
		expect(date.value).toEqual(new Date(1950, 4, 12));
		await expect.element(input).not.toHaveAttribute('aria-invalid');
		await expect.element(screen.getByRole('button', { name: 'May 1950' })).toBeVisible();
	});

	test('v4 bug: the default locale is English, and locale changes format and calendar', async () => {
		const screen = await render(DatePickerTextField, {
			label: 'Booking',
			selectedDate: new Date(2026, 9, 9)
		});
		const input = screen.getByRole('combobox', { name: 'Booking' });
		await expect.element(input).toHaveValue('10/09/2026');
		await input.click();
		await expect.element(screen.getByRole('button', { name: 'October 2026' })).toBeVisible();
		const weekdays = screen.getByRole('columnheader').elements();
		expect(weekdays[0]).toHaveAttribute('aria-label', 'Sunday');
		await screen.unmount();

		const italian = await render(DatePickerTextField, {
			label: 'Prenotazione',
			locale: 'it',
			selectedDate: new Date(2026, 9, 9)
		});
		const field = italian.getByRole('combobox', { name: 'Prenotazione' });
		await expect.element(field).toHaveValue('09/10/2026');
		await field.click();
		await expect.element(italian.getByRole('button', { name: 'Ottobre 2026' })).toBeVisible();
		expect(italian.getByRole('columnheader').elements()[0]).toHaveAttribute('aria-label', 'Lunedì');
	});

	test('a format or locale change from outside reformats the text', async () => {
		const locale = bound('en');
		const screen = await render(
			DatePickerTextField,
			withBound({ label: 'Booking', selectedDate: new Date(2026, 9, 9) }, { locale })
		);
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveValue('10/09/2026');
		locale.value = 'it';
		await expect.element(input).toHaveValue('09/10/2026');
		await expect.element(input).toHaveAccessibleDescription('dd/mm/yyyy');
	});

	test('selectedDate set from outside updates the text, and undefined empties it', async () => {
		const date = bound<Date | undefined>(new Date(2026, 9, 9));
		const screen = await render(DatePickerTextField, withBound({ label: 'Booking' }, { selectedDate: date }));
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveValue('10/09/2026');
		date.value = new Date(2026, 11, 25);
		await expect.element(input).toHaveValue('12/25/2026');
		date.value = undefined;
		await expect.element(input).toHaveValue('');
	});

	describe('range', () => {
		test('has a start and an end input named after the label', async () => {
			const screen = await render(DatePickerTextField, { label: 'Stay', range: true, required: true });
			const start = screen.getByRole('combobox', { name: 'Stay Start date' });
			const end = screen.getByRole('combobox', { name: 'Stay End date' });
			await expect.element(start).toBeRequired();
			await expect.element(end).toBeRequired();
			expect(start.element().id).not.toBe(end.element().id);
			expect(rootOf(screen.container)).toHaveAttribute('data-range');
			expect(screen.container.querySelector('label')?.htmlFor).toBe(start.element().id);
			await screen.unmount();

			const custom = await render(DatePickerTextField, {
				label: 'Stay',
				range: true,
				startLabel: 'Check-in',
				endLabel: 'Check-out'
			});
			await expect.element(custom.getByRole('combobox', { name: 'Stay Check-in' })).toBeVisible();
			await expect.element(custom.getByRole('combobox', { name: 'Stay Check-out' })).toBeVisible();
			await custom.unmount();

			const unlabelled = await render(DatePickerTextField, { range: true });
			await expect
				.element(unlabelled.getByRole('combobox', { name: 'Start date', exact: true }))
				.toBeVisible();
			await expect
				.element(unlabelled.getByRole('combobox', { name: 'End date', exact: true }))
				.toBeVisible();
		});

		test('typing sets both ends; an end before the start, or a start after the end, is invalid', async () => {
			const from = bound<Date>();
			const to = bound<Date>();
			const onchange = vi.fn();
			const screen = await render(
				DatePickerTextField,
				withBound({ label: 'Stay', range: true, onchange }, { selectedDate: from, selectedDateTo: to })
			);
			const start = screen.getByRole('combobox', { name: 'Stay Start date' });
			const end = screen.getByRole('combobox', { name: 'Stay End date' });
			const root = rootOf(screen.container);
			await userEvent.fill(start, '10/12/2026');
			expect(from.value).toEqual(new Date(2026, 9, 12));

			await userEvent.fill(end, '10/05/2026');
			await expect.element(end).toHaveAttribute('aria-invalid', 'true');
			await expect.element(start).not.toHaveAttribute('aria-invalid');
			expect(root).toHaveAttribute('data-state', 'error');
			expect(to.value).toBeUndefined();
			expect((end.element() as HTMLInputElement).validationMessage).toBe('Enter a valid date');

			await userEvent.fill(end, '10/15/2026');
			await expect.element(end).not.toHaveAttribute('aria-invalid');
			expect(root).not.toHaveAttribute('data-state');
			expect(to.value).toEqual(new Date(2026, 9, 15));
			expect(onchange).toHaveBeenLastCalledWith({
				selectedDate: new Date(2026, 9, 12),
				selectedDateTo: new Date(2026, 9, 15)
			});

			await userEvent.fill(start, '10/20/2026');
			await expect.element(start).toHaveAttribute('aria-invalid', 'true');
			expect(from.value).toBeUndefined();
			expect(to.value).toEqual(new Date(2026, 9, 15));
		});

		test('the calendar stays open after the start and closes after the end', async () => {
			const onchange = vi.fn();
			const screen = await render(DatePickerTextField, {
				label: 'Stay',
				range: true,
				selectedDate: new Date(2026, 9, 1),
				selectedDateTo: new Date(2026, 9, 3),
				onchange
			});
			const start = screen.getByRole('combobox', { name: 'Stay Start date' });
			const end = screen.getByRole('combobox', { name: 'Stay End date' });
			await start.click();
			await day(new Date(2026, 9, 12)).click();
			await expect.element(start).toHaveValue('10/12/2026');
			await expect.element(end).toHaveValue('');
			await expect.element(start).toHaveAttribute('aria-expanded', 'true');
			expect(onchange).toHaveBeenLastCalledWith({
				selectedDate: new Date(2026, 9, 12),
				selectedDateTo: undefined
			});

			await day(new Date(2026, 9, 15)).click();
			await expect.element(end).toHaveValue('10/15/2026');
			await expect.element(start).toHaveAttribute('aria-expanded', 'false');
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
			await expect.element(end).toHaveFocus();
			expect(onchange).toHaveBeenLastCalledWith({
				selectedDate: new Date(2026, 9, 12),
				selectedDateTo: new Date(2026, 9, 15)
			});
		});

		test('Escape returns the focus to the input the calendar was opened from', async () => {
			const screen = await render(DatePickerTextField, {
				label: 'Stay',
				range: true,
				selectedDate: new Date(2026, 9, 1),
				selectedDateTo: new Date(2026, 9, 3)
			});
			const start = screen.getByRole('combobox', { name: 'Stay Start date' });
			const end = screen.getByRole('combobox', { name: 'Stay End date' });
			await start.click();
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(day(new Date(2026, 9, 1))).toHaveFocus();
			await userEvent.keyboard('{Escape}');
			await expect.element(start).toHaveFocus();
			await expect.element(start).toHaveAttribute('aria-expanded', 'false');

			await screen.rerender({ selectedDate: new Date(2026, 9, 1), selectedDateTo: undefined });
			await end.click();
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(day(new Date(2026, 9, 1))).toHaveFocus();
			await userEvent.keyboard('{Escape}');
			await expect.element(end).toHaveFocus();
		});

		test('Tab from the start to the end input keeps the calendar open and usable', async () => {
			const screen = await render(DatePickerTextField, {
				label: 'Stay',
				range: true,
				selectedDate: new Date(2026, 9, 1)
			});
			const start = screen.getByRole('combobox', { name: 'Stay Start date' });
			const end = screen.getByRole('combobox', { name: 'Stay End date' });
			await start.click();
			await expect.element(screen.getByRole('dialog')).toBeVisible();
			await userEvent.keyboard('{Tab}');
			await expect.element(end).toHaveFocus();
			await expect.element(end).toHaveAttribute('aria-expanded', 'true');
			await expect.element(screen.getByRole('dialog')).toBeVisible();
			await new Promise((resolve) => setTimeout(resolve, 300));
			expect(screen.container.querySelector('.aurora-menu')).not.toHaveAttribute('inert');
			await day(new Date(2026, 9, 20)).click();
			await expect.element(end).toHaveValue('10/20/2026');
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		});

		test('name and nameTo submit both ends as yyyy-MM-dd', async () => {
			const { form } = makeForm();
			await render(DatePickerTextField, {
				target: form,
				props: {
					label: 'Stay',
					range: true,
					name: 'from',
					nameTo: 'to',
					selectedDate: new Date(2026, 9, 9)
				}
			});
			const data = new FormData(form);
			expect([...data.entries()]).toEqual([
				['from', '2026-10-09'],
				['to', '']
			]);
			form.remove();
		});

		test('clear empties both ends', async () => {
			const onchange = vi.fn();
			const screen = await render(DatePickerTextField, {
				label: 'Stay',
				range: true,
				clearable: true,
				selectedDate: new Date(2026, 9, 1),
				selectedDateTo: new Date(2026, 9, 3),
				onchange
			});
			await screen.getByRole('button', { name: 'Clear' }).click();
			await expect.element(screen.getByRole('combobox', { name: 'Stay Start date' })).toHaveValue('');
			await expect.element(screen.getByRole('combobox', { name: 'Stay End date' })).toHaveValue('');
			expect(onchange).toHaveBeenCalledExactlyOnceWith({
				selectedDate: undefined,
				selectedDateTo: undefined
			});
		});
	});

	describe('desktop calendar', () => {
		test('focus opens a dialog with the DatePicker, controlled by the input', async () => {
			const screen = await render(DatePickerTextField, {
				label: 'Booking',
				selectedDate: new Date(2026, 9, 9)
			});
			const input = screen.getByRole('combobox', { name: 'Booking' });
			await userEvent.keyboard('{Tab}');
			await expect.element(input).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			const dialog = screen.getByRole('dialog', { name: 'Booking' });
			await expect.element(dialog).toBeVisible();
			expect(dialog.element()).toHaveClass('aurora-date-picker');
			expect(dialog.element().closest('.aurora-menu')?.matches(':popover-open')).toBe(true);
			await expect.element(input).toHaveAttribute('aria-controls', dialog.element().id);
			expect(rootOf(screen.container)).toHaveAttribute('data-open');
			await expect.element(day(new Date(2026, 9, 9))).toHaveAttribute('aria-selected', 'true');
			await expect.element(input).toHaveFocus();
		});

		test('a click on the input opens it; without label the dialog is named by openLabel', async () => {
			const screen = await render(DatePickerTextField, { openLabel: 'Pick a day' });
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('dialog', { name: 'Pick a day' })).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(input).toHaveFocus();
			await input.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		});

		test('Arrow Down moves the focus to the selected day; Escape closes and returns the focus', async () => {
			const screen = await render(DatePickerTextField, {
				label: 'Booking',
				selectedDate: new Date(2026, 9, 9)
			});
			const input = screen.getByRole('combobox');
			await userEvent.keyboard('{Tab}');
			await userEvent.keyboard('{Escape}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');

			await userEvent.keyboard('{ArrowDown}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await expect.element(day(new Date(2026, 9, 9))).toHaveFocus();

			await userEvent.keyboard('{Escape}');
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
			await expect.element(input).toHaveFocus();
			await new Promise((resolve) => setTimeout(resolve, 100));
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(rootOf(screen.container)).not.toHaveAttribute('data-open');
		});

		test('choosing a day with the keyboard closes and returns the focus to the input', async () => {
			const onchange = vi.fn();
			const screen = await render(DatePickerTextField, {
				label: 'Booking',
				selectedDate: new Date(2026, 9, 9),
				onchange
			});
			const input = screen.getByRole('combobox');
			await input.click();
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(day(new Date(2026, 9, 9))).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}');
			await expect.element(day(new Date(2026, 9, 10))).toHaveFocus();
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveValue('10/10/2026');
			await expect.element(input).toHaveFocus();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(onchange).toHaveBeenCalledExactlyOnceWith({
				selectedDate: new Date(2026, 9, 10),
				selectedDateTo: undefined
			});
		});

		test('v4 bug: choosing a day with the mouse closes the calendar', async () => {
			const date = bound<Date>(new Date(2026, 9, 9));
			const screen = await render(DatePickerTextField, withBound({ label: 'Booking' }, { selectedDate: date }));
			const input = screen.getByRole('combobox');
			await input.click();
			await day(new Date(2026, 9, 21)).click();
			await expect.element(input).toHaveValue('10/21/2026');
			expect(date.value).toEqual(new Date(2026, 9, 21));
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(input).toHaveFocus();
		});

		test('closeOnSelect={false} keeps the calendar open', async () => {
			const screen = await render(DatePickerTextField, {
				label: 'Booking',
				selectedDate: new Date(2026, 9, 9),
				closeOnSelect: false
			});
			const input = screen.getByRole('combobox');
			await input.click();
			await day(new Date(2026, 9, 21)).click();
			await expect.element(input).toHaveValue('10/21/2026');
			await new Promise((resolve) => setTimeout(resolve, 100));
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await expect.element(screen.getByRole('dialog')).toBeVisible();
		});

		test('Enter in the input closes the calendar without submitting the form', async () => {
			const { form, onsubmit } = makeForm();
			const submit = document.createElement('button');
			form.append(submit);
			const screen = await render(DatePickerTextField, { target: form, props: { label: 'Booking' } });
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(input).toHaveFocus();
			expect(onsubmit).not.toHaveBeenCalled();
			form.remove();
		});

		test('Tab closes the calendar and moves on', async () => {
			const screen = await render(DatePickerTextField, {
				label: 'Booking',
				selectedDate: new Date(2026, 9, 9)
			});
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

		test('reopening while the calendar is closing leaves it usable', async () => {
			const target = document.createElement('div');
			target.style.setProperty('--menu-duration', '1s');
			document.body.append(target);
			const screen = await render(DatePickerTextField, {
				target,
				props: { label: 'Booking', selectedDate: new Date(2026, 9, 9) }
			});
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('dialog')).toBeVisible();
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(day(new Date(2026, 9, 9))).toHaveFocus();
			expect(target.querySelector('.aurora-menu')).not.toHaveAttribute('inert');
			target.remove();
		});

		test('a click outside closes the calendar', async () => {
			const screen = await render(DatePickerTextField, { label: 'Booking' });
			const outside = document.createElement('button');
			outside.textContent = 'Outside';
			screen.container.prepend(outside);
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.element(screen.getByRole('dialog')).toBeVisible();
			await screen.getByRole('button', { name: 'Outside' }).click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		});

		test('the calendar button toggles the calendar and keeps the focus on the input', async () => {
			const screen = await render(DatePickerTextField, { label: 'Booking' });
			const input = screen.getByRole('combobox');
			const toggle = screen.getByRole('button', { name: 'Choose date' });
			await expect.element(toggle).toHaveAttribute('type', 'button');
			await expect.element(toggle).toHaveAttribute('tabindex', '-1');
			await expect.element(toggle).toHaveAttribute('aria-haspopup', 'dialog');
			await toggle.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
			const dialog = screen.getByRole('dialog', { name: 'Booking' });
			await expect.element(toggle).toHaveAttribute('aria-controls', dialog.element().id);
			await expect.element(input).toHaveFocus();
			await toggle.click();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(dialog).not.toBeInTheDocument();
			await expect.element(input).toHaveFocus();
		});

		test('bind:open follows the calendar and opens it from outside', async () => {
			const open = bound(false);
			const screen = await render(DatePickerTextField, withBound({ label: 'Booking' }, { open }));
			const input = screen.getByRole('combobox');
			await input.click();
			await expect.poll(() => open.value).toBe(true);
			await userEvent.keyboard('{Escape}');
			await expect.poll(() => open.value).toBe(false);
			open.value = true;
			await expect.element(screen.getByRole('dialog', { name: 'Booking' })).toBeVisible();
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			open.value = false;
			await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		});

		test('v4 bug: the calendar buttons inside a form do not submit it', async () => {
			const { form, onsubmit } = makeForm();
			const screen = await render(DatePickerTextField, {
				target: form,
				props: { label: 'Booking', clearable: true, selectedDate: new Date(2026, 9, 9) }
			});
			await screen.getByRole('button', { name: 'Choose date' }).click();
			await screen.getByRole('button', { name: 'Next month' }).click();
			await expect.element(screen.getByRole('button', { name: 'November 2026' })).toBeVisible();
			await screen.getByRole('button', { name: 'Previous month' }).click();
			await screen.getByRole('button', { name: 'October 2026' }).click();
			await expect.element(screen.getByRole('button', { name: 'Next year' })).toBeVisible();
			await screen.getByRole('button', { name: 'Clear' }).click();
			expect(onsubmit).not.toHaveBeenCalled();
			for (const button of form.querySelectorAll('button')) expect(button.type).toBe('button');
			form.remove();
		});
	});

	describe('mobile', () => {
		test('the calendar button opens a modal bottom drawer; choosing a day closes it', async () => {
			await page.viewport(800, 700);
			try {
				const onchange = vi.fn();
				const screen = await render(DatePickerTextField, {
					label: 'Booking',
					selectedDate: new Date(2026, 9, 9),
					onchange
				});
				const input = screen.getByRole('combobox', { name: 'Booking' });
				await input.click();
				await expect.element(input).toHaveFocus();
				await new Promise((resolve) => setTimeout(resolve, 100));
				await expect.element(input).toHaveAttribute('aria-expanded', 'false');
				await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();

				await screen.getByRole('button', { name: 'Choose date' }).click();
				const drawer = screen.getByRole('dialog', { name: 'Booking' });
				await expect.element(drawer).toBeVisible();
				expect(drawer.element().tagName).toBe('DIALOG');
				expect(drawer.element().matches(':modal')).toBe(true);
				expect(drawer.element()).toHaveAttribute('data-position', 'bottom');
				expect(drawer.element().querySelector('.aurora-date-picker')).not.toBeNull();
				await expect.element(day(new Date(2026, 9, 9))).toHaveFocus();
				await expect.element(input).toHaveAttribute('aria-expanded', 'true');

				await userEvent.keyboard('{ArrowRight}{Enter}');
				await expect.element(drawer).not.toBeInTheDocument();
				await expect.element(input).toHaveValue('10/10/2026');
				await expect.element(input).toHaveAttribute('aria-expanded', 'false');
				expect(onchange).toHaveBeenCalledExactlyOnceWith({
					selectedDate: new Date(2026, 9, 10),
					selectedDateTo: undefined
				});
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('the field stays typable and a click on a day closes the drawer', async () => {
			await page.viewport(800, 700);
			try {
				const screen = await render(DatePickerTextField, { label: 'Booking' });
				const input = screen.getByRole('combobox');
				await input.click();
				await userEvent.keyboard('10092026');
				await expect.element(input).toHaveValue('10/09/2026');
				await expect.element(input).toHaveAttribute('aria-expanded', 'false');
				await screen.getByRole('button', { name: 'Choose date' }).click();
				await expect.element(day(new Date(2026, 9, 9))).toHaveFocus();
				await day(new Date(2026, 9, 14)).click();
				await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
				await expect.element(input).toHaveValue('10/14/2026');
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('drawerTitle names the drawer, whose close button closes it without a change', async () => {
			await page.viewport(800, 700);
			try {
				const onchange = vi.fn();
				const screen = await render(DatePickerTextField, {
					label: 'Booking',
					drawerTitle: 'Pick your day',
					closeLabel: 'Done',
					selectedDate: new Date(2026, 9, 9),
					onchange
				});
				await screen.getByRole('button', { name: 'Choose date' }).click();
				const drawer = screen.getByRole('dialog', { name: 'Pick your day' });
				await expect.element(drawer).toBeVisible();
				await drawer.getByRole('button', { name: 'Done' }).click();
				await expect.element(drawer).not.toBeInTheDocument();
				await expect.element(screen.getByRole('combobox')).toHaveValue('10/09/2026');
				expect(onchange).not.toHaveBeenCalled();
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('mobileDrawer={false} keeps the menu on small screens', async () => {
			await page.viewport(800, 700);
			try {
				const screen = await render(DatePickerTextField, { label: 'Booking', mobileDrawer: false });
				const input = screen.getByRole('combobox');
				await input.click();
				const dialog = screen.getByRole('dialog', { name: 'Booking' });
				await expect.element(dialog).toBeVisible();
				expect(dialog.element().tagName).toBe('DIV');
			} finally {
				await page.viewport(1280, 800);
			}
		});
	});

	test('clearable shows a Clear button that empties the value and calls onchange', async () => {
		const onchange = vi.fn();
		const date = bound<Date>(new Date(2026, 9, 9));
		const screen = await render(
			DatePickerTextField,
			withBound({ label: 'Booking', clearable: true, clearLabel: 'Remove date', onchange }, { selectedDate: date })
		);
		const input = screen.getByRole('combobox');
		const clear = screen.getByRole('button', { name: 'Remove date' });
		await expect.element(clear).toHaveAttribute('type', 'button');
		await clear.click();
		await expect.element(input).toHaveValue('');
		expect(date.value).toBeUndefined();
		expect(onchange).toHaveBeenCalledExactlyOnceWith({
			selectedDate: undefined,
			selectedDateTo: undefined
		});
		await expect.element(input).toHaveFocus();
		await expect.element(clear).not.toBeInTheDocument();
	});

	test('disabled blocks opening and editing', async () => {
		const screen = await render(DatePickerTextField, {
			label: 'Booking',
			disabled: true,
			clearable: true,
			selectedDate: new Date(2026, 9, 9)
		});
		const input = screen.getByRole('combobox');
		const root = rootOf(screen.container);
		await expect.element(input).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Choose date' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
		expect(root).toHaveAttribute('data-disabled');
		await userEvent.click(root.querySelector('.aurora-date-picker-text-field-control')!);
		await screen.getByRole('button', { name: 'Choose date' }).click({ force: true });
		await userEvent.keyboard('{Tab}');
		await expect.element(input).not.toHaveFocus();
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
	});

	test('readonly shows the date but blocks opening and editing', async () => {
		const onchange = vi.fn();
		const screen = await render(DatePickerTextField, {
			label: 'Booking',
			readonly: true,
			clearable: true,
			selectedDate: new Date(2026, 9, 9),
			onchange
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveAttribute('readonly');
		expect(rootOf(screen.container)).toHaveAttribute('data-readonly');
		await expect.element(screen.getByRole('button', { name: 'Choose date' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
		await input.click();
		await expect.element(input).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}1');
		await expect.element(input).toHaveValue('10/09/2026');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
		expect(onchange).not.toHaveBeenCalled();
	});

	test('name submits the date as yyyy-MM-dd in a hidden input, empty without a date', async () => {
		const { form } = makeForm();
		const screen = await render(DatePickerTextField, {
			target: form,
			props: { label: 'Booking', name: 'booking', required: true }
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toBeRequired();
		await expect.element(input).not.toHaveAttribute('name');
		expect([...new FormData(form).entries()]).toEqual([['booking', '']]);
		await userEvent.fill(input, '10/09/2026');
		expect([...new FormData(form).entries()]).toEqual([['booking', '2026-10-09']]);
		form.remove();
	});

	test('id sets the input id, which the label points to', async () => {
		const screen = await render(DatePickerTextField, { label: 'Booking', id: 'booking-date' });
		const input = screen.getByRole('combobox', { name: 'Booking' });
		await expect.element(input).toHaveAttribute('id', 'booking-date');
		expect(screen.container.querySelector('label')).toHaveAttribute('for', 'booking-date');
	});

	test('v4 bug: ids are not fixed to from and to, so two range fields do not collide', async () => {
		const first = await render(DatePickerTextField, { label: 'First', range: true });
		const second = await render(DatePickerTextField, { label: 'Second', range: true });
		const ids = [first, second].flatMap((screen) =>
			[...screen.container.querySelectorAll('[id]')].map((element) => element.id)
		);
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids).not.toContain('from');
		expect(ids).not.toContain('to');
		const a = first.getByRole('combobox', { name: 'First Start date' });
		const b = second.getByRole('combobox', { name: 'Second Start date' });
		expect(first.container.querySelector('label')?.htmlFor).toBe(a.element().id);
		expect(second.container.querySelector('label')?.htmlFor).toBe(b.element().id);
		await a.click();
		await expect.element(a).toHaveAttribute('aria-expanded', 'true');
		const controls = a.element().getAttribute('aria-controls');
		(b.element() as HTMLInputElement).focus();
		await expect.element(b).toHaveAttribute('aria-expanded', 'true');
		await expect.element(a).toHaveAttribute('aria-expanded', 'false');
		expect(b.element().getAttribute('aria-controls')).not.toBe(controls);
	});

	test('native attributes and events reach the input', async () => {
		const handlers = {
			oninput: vi.fn(),
			onfocus: vi.fn(),
			onblur: vi.fn(),
			onclick: vi.fn(),
			onkeydown: vi.fn()
		};
		const screen = await render(DatePickerTextField, {
			label: 'Booking',
			title: 'Booking date',
			autocomplete: 'bday',
			'data-testid': 'booking',
			'aria-describedby': 'external',
			...handlers
		});
		const input = screen.getByTestId('booking');
		await expect.element(input).toHaveAttribute('title', 'Booking date');
		await expect.element(input).toHaveAttribute('autocomplete', 'bday');
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
		const screen = await render(DatePickerTextField, {
			label: 'Booking',
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
		const screen = await render(DatePickerTextField, {
			label: 'Booking',
			hint: 'Weekdays only',
			state: 'error',
			selectedDate: new Date(2026, 9, 9),
			clearable: true,
			labelSnippet: snippetOf<{ label: string | undefined }>(({ label }) => `<b>${label} *</b>`),
			hintSnippet: snippetOf<{ hint: string | undefined }>(({ hint }) => `<i>${hint}!</i>`),
			stateIconSnippet: snippetOf<{ state: string }>(({ state }) => `<i data-testid="state">${state}</i>`),
			iconSnippet: snippet('<i data-testid="icon"></i>'),
			prependSnippet: snippet('<i data-testid="prepend"></i>'),
			appendInnerSnippet: snippet('<i data-testid="append-inner"></i>'),
			appendSnippet: snippet('<i data-testid="append"></i>'),
			clearSnippet: snippet('<i data-testid="clear"></i>'),
			formatSnippet: snippetOf<{ format: string }>(({ format }) => `<span>${format}</span>`),
			dayAppendSnippet: snippetOf<CalendarDay>(({ selected }) => `<i class="dot">${selected ? 'x' : ''}</i>`)
		});
		const root = rootOf(screen.container);
		const input = screen.getByRole('combobox', { name: 'Booking *' });
		await expect.element(input).toBeVisible();
		expect(root.querySelector('.aurora-date-picker-text-field-hint')?.textContent?.trim()).toBe('Weekdays only!');
		await expect.element(screen.getByTestId('state')).toHaveTextContent('error');
		expect(screen.getByRole('button', { name: 'Choose date' }).element().querySelector('[data-testid="icon"]')).not.toBeNull();
		const control = root.querySelector('.aurora-date-picker-text-field-control')!;
		expect(control.contains(screen.getByTestId('prepend').element())).toBe(false);
		expect(control.contains(screen.getByTestId('append').element())).toBe(false);
		expect(control.querySelector('.aurora-date-picker-text-field-end [data-testid="append-inner"]')).not.toBeNull();
		expect(screen.getByRole('button', { name: 'Clear' }).element().querySelector('[data-testid="clear"]')).not.toBeNull();
		expect(root.querySelector('.aurora-date-picker-text-field-format')?.textContent?.trim()).toBe('MM/dd/yyyy');
		await input.click();
		const dots = screen.getByRole('dialog').element().querySelectorAll('.dot');
		expect(dots).toHaveLength(42);
		expect([...dots].filter((dot) => dot.textContent === 'x')).toHaveLength(1);
	});

	test('binds the input elements', async () => {
		let input: HTMLInputElement | undefined;
		let inputTo: HTMLInputElement | undefined;
		const screen = await render(DatePickerTextField, {
			label: 'Stay',
			range: true,
			placeholder: 'From',
			placeholderTo: 'To',
			get input() {
				return input as HTMLInputElement;
			},
			set input(value) {
				input = value;
			},
			get inputTo() {
				return inputTo as HTMLInputElement;
			},
			set inputTo(value) {
				inputTo = value;
			}
		});
		expect(input).toBe(screen.getByRole('combobox', { name: 'Stay Start date' }).element());
		expect(inputTo).toBe(screen.getByRole('combobox', { name: 'Stay End date' }).element());
		expect(input?.placeholder).toBe('From');
		expect(inputTo?.placeholder).toBe('To');
	});

	test('class parts go on their elements', async () => {
		const screen = await render(DatePickerTextField, {
			label: 'Booking',
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
		expect(root.querySelector('label')).toHaveClass('aurora-date-picker-text-field-label', 'app-label');
		expect(root.querySelector('.aurora-date-picker-text-field-row')).toHaveClass('app-row');
		expect(root.querySelector('.aurora-date-picker-text-field-control')).toHaveClass('app-field');
		expect(root.querySelector('.aurora-date-picker-text-field-hint')).toHaveClass('app-hint');
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveClass('app-input');
		await input.click();
		await expect.element(screen.getByRole('dialog')).toHaveClass('aurora-date-picker', 'app-picker');
	});

	test('exposes its state as data attributes', async () => {
		const screen = await render(DatePickerTextField, { label: 'Booking' });
		const root = rootOf(screen.container);
		for (const name of ['data-state', 'data-disabled', 'data-readonly', 'data-open', 'data-range'])
			expect(root).not.toHaveAttribute(name);
		await screen.getByRole('combobox').click();
		await expect.poll(() => root.hasAttribute('data-open')).toBe(true);
		await screen.rerender({ state: 'error', disabled: true });
		expect(root).toHaveAttribute('data-state', 'error');
		expect(root).toHaveAttribute('data-disabled');
	});

	test('instance CSS variables override the defaults', async () => {
		const target = document.createElement('div');
		target.style.cssText = [
			'--global-duration: 0s',
			'--date-picker-text-field-border-color: rgb(1, 2, 3)',
			'--date-picker-text-field-height: 50px',
			'--date-picker-text-field-format-color: rgb(4, 5, 6)'
		].join(';');
		document.body.append(target);
		await render(DatePickerTextField, { target, props: { label: 'Booking' } });
		const control = target.querySelector('.aurora-date-picker-text-field-control')!;
		expect(getComputedStyle(control).borderTopColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(control).height).toBe('50px');
		const chip = target.querySelector('.aurora-date-picker-text-field-format')!;
		expect(getComputedStyle(chip).color).toBe('rgb(4, 5, 6)');
		target.remove();
	});
});
