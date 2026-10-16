import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TimePicker from '#lib/components/simple/dates/TimePicker.svelte';
import { renderWithDefaultLocale } from '../helpers.js';

type Change = { value: string; column: 'hours' | 'minutes' | 'period' };

function column(name: string) {
	return page.getByRole('listbox', { name, exact: true });
}

function option(columnName: string, name: string) {
	return column(columnName).getByRole('option', { name, exact: true });
}

function labels(columnName: string) {
	return column(columnName)
		.getByRole('option')
		.elements()
		.map((element) => element.textContent?.trim());
}

function disabledLabels(columnName: string) {
	return column(columnName)
		.getByRole('option')
		.elements()
		.filter((element) => element.getAttribute('aria-disabled') === 'true')
		.map((element) => element.textContent?.trim());
}

function withValue<T extends object>(props: T, initial?: string) {
	const state = { value: initial };
	Object.defineProperty(props, 'value', {
		enumerable: true,
		configurable: true,
		get: () => state.value,
		set: (value: string | undefined) => (state.value = value)
	});
	return { props: props as T & { value?: string }, state };
}

function freezeNow() {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 8, 24, 10, 7));
}

function centerOffset(element: Element, list: Element) {
	const item = element.getBoundingClientRect();
	const box = list.getBoundingClientRect();
	return Math.abs(item.top + item.height / 2 - (box.top + box.height / 2));
}

afterEach(() => {
	vi.useRealTimers();
});

describe('TimePicker', () => {
	test('is a group of listboxes: hours 12 to 11, minutes every 5 and AM/PM with the default en locale', async () => {
		const screen = await render(TimePicker, { 'aria-label': 'Start time' });
		const group = screen.getByRole('group', { name: 'Start time' });
		await expect.element(group).toHaveClass('aurora-time-picker');
		await expect.element(group).toHaveAttribute('data-hour-cycle', '12');
		expect(labels('Hours')).toEqual(['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']);
		expect(labels('Minutes')).toEqual(['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
		expect(labels('AM/PM')).toEqual(['AM', 'PM']);
		await expect.element(column('Hours')).toHaveAttribute('data-column', 'hours');
		await expect.element(column('AM/PM')).toHaveAttribute('data-column', 'period');
		await expect.element(option('AM/PM', 'PM')).toHaveAttribute('data-value', 'pm');
	});

	test('locale it gives the 24-hour clock without the AM/PM column', async () => {
		const screen = await render(TimePicker, { locale: 'it' });
		await expect.element(screen.getByRole('group')).toHaveAttribute('data-hour-cycle', '24');
		expect(labels('Ore')).toEqual(Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')));
		expect(screen.getByRole('listbox').elements()).toHaveLength(2);
	});

	test('hour12 forces the clock in either direction', async () => {
		const twelve = await render(TimePicker, { locale: 'it', hour12: true });
		expect(twelve.getByRole('listbox').elements()).toHaveLength(3);
		await twelve.unmount();
		const twentyFour = await render(TimePicker, { locale: 'en', hour12: false });
		expect(twentyFour.getByRole('listbox').elements()).toHaveLength(2);
		expect(labels('Hours')).toHaveLength(24);
	});

	test('the names of AM and PM come from the locale', async () => {
		const names = (hours: number) =>
			new Intl.DateTimeFormat('es-US', { hour: 'numeric', hourCycle: 'h12' })
				.formatToParts(new Date(2026, 0, 1, hours))
				.find((part) => part.type === 'dayPeriod')
				?.value.trim();
		await render(TimePicker, { locale: 'es-US', hour12: true });
		expect(labels('AM/PM')).toEqual([names(1), names(13)]);
	});

	test('value marks its options with aria-selected and data-selected, also on a 12-hour clock', async () => {
		const twentyFour = await render(TimePicker, { locale: 'en-GB', value: '14:30' });
		await expect.element(option('Hours', '14')).toHaveAttribute('aria-selected', 'true');
		await expect.element(option('Hours', '14')).toHaveAttribute('data-selected');
		await expect.element(option('Minutes', '30')).toHaveAttribute('aria-selected', 'true');
		await expect.element(option('Hours', '13')).toHaveAttribute('aria-selected', 'false');
		expect(twentyFour.container.querySelectorAll('[aria-selected="true"]')).toHaveLength(2);
		await twentyFour.unmount();

		await render(TimePicker, { value: '14:30:00' });
		await expect.element(option('Hours', '02')).toHaveAttribute('aria-selected', 'true');
		await expect.element(option('Minutes', '30')).toHaveAttribute('aria-selected', 'true');
		await expect.element(option('AM/PM', 'PM')).toHaveAttribute('aria-selected', 'true');
	});

	test('the value is set only when hours and minutes are chosen, then onchange gets { value, column }', async () => {
		const onchange = vi.fn();
		const { props, state } = withValue({ locale: 'en-GB', onchange });
		await render(TimePicker, props);
		await option('Hours', '09').click();
		await expect.element(option('Hours', '09')).toHaveAttribute('aria-selected', 'true');
		expect(state.value).toBeUndefined();
		expect(onchange).not.toHaveBeenCalled();
		await option('Minutes', '30').click();
		expect(state.value).toBe('09:30');
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ value: '09:30', column: 'minutes' });
		expect(onchange.mock.calls[0][0]).not.toHaveProperty('detail');
		await option('Hours', '10').click();
		expect(state.value).toBe('10:30');
		expect(onchange).toHaveBeenLastCalledWith({ value: '10:30', column: 'hours' });
	});

	test('on a 12-hour clock the value waits for AM or PM and stays 24-hour', async () => {
		const onchange = vi.fn<(event: Change) => void>();
		const { props, state } = withValue({ onchange });
		await render(TimePicker, props);
		await option('Hours', '09').click();
		await option('Minutes', '30').click();
		expect(state.value).toBeUndefined();
		await option('AM/PM', 'PM').click();
		expect(state.value).toBe('21:30');
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ value: '21:30', column: 'period' });
		await option('Hours', '12').click();
		expect(state.value).toBe('12:30');
		await option('AM/PM', 'AM').click();
		expect(state.value).toBe('00:30');
	});

	test('choosing the chosen option again calls onchange with the same value', async () => {
		const onchange = vi.fn();
		await render(TimePicker, { locale: 'en-GB', value: '09:30', onchange });
		await option('Minutes', '30').click();
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ value: '09:30', column: 'minutes' });
	});

	test('value set from outside moves the selection', async () => {
		const screen = await render(TimePicker, { locale: 'en-GB', value: '09:30' });
		await screen.rerender({ value: '18:45' });
		await expect.element(option('Hours', '18')).toHaveAttribute('aria-selected', 'true');
		await expect.element(option('Minutes', '45')).toHaveAttribute('aria-selected', 'true');
		await screen.rerender({ value: undefined });
		expect(screen.container.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
	});

	test('minuteStep sets the minutes; a chosen minute off the step stays until another is chosen', async () => {
		const { props, state } = withValue({ locale: 'en-GB', minuteStep: 15 }, '08:10');
		await render(TimePicker, props);
		expect(labels('Minutes')).toEqual(['00', '10', '15', '30', '45']);
		await expect.element(option('Minutes', '10')).toHaveAttribute('aria-selected', 'true');
		await option('Minutes', '15').click();
		expect(state.value).toBe('08:15');
		await expect.poll(() => labels('Minutes')).toEqual(['00', '15', '30', '45']);
	});

	test('min and max disable the hours and, for the chosen hour, the minutes', async () => {
		const onchange = vi.fn();
		const screen = await render(TimePicker, { locale: 'en-GB', min: '08:30', max: '17:00', onchange });
		expect(disabledLabels('Hours')).toEqual(['00', '01', '02', '03', '04', '05', '06', '07', '18', '19', '20', '21', '22', '23']);
		expect(disabledLabels('Minutes')).toEqual([]);
		await expect.element(option('Hours', '07')).toHaveAttribute('data-disabled');
		await option('Hours', '07').click({ force: true });
		await expect.element(option('Hours', '07')).toHaveAttribute('aria-selected', 'false');
		await option('Hours', '08').click();
		expect(disabledLabels('Minutes')).toEqual(['00', '05', '10', '15', '20', '25']);
		await option('Hours', '17').click();
		expect(disabledLabels('Minutes')).toEqual(['05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
		expect(onchange).not.toHaveBeenCalled();
		expect(screen.container.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
	});

	test('choosing an hour moves a minute that would fall outside min and max to the nearest allowed one', async () => {
		const onchange = vi.fn();
		const { props, state } = withValue({ locale: 'en-GB', min: '08:30', onchange }, '09:00');
		await render(TimePicker, props);
		await option('Hours', '08').click();
		expect(state.value).toBe('08:30');
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ value: '08:30', column: 'hours' });
	});

	test('a min later than max crosses midnight', async () => {
		await render(TimePicker, { locale: 'en-GB', min: '22:00', max: '06:00' });
		expect(disabledLabels('Hours')).toEqual(['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']);
	});

	test('on a 12-hour clock min and max also disable AM or PM', async () => {
		await render(TimePicker, { max: '11:00' });
		expect(disabledLabels('AM/PM')).toEqual(['PM']);
		await option('Hours', '11').click();
		expect(disabledLabels('Minutes')).toEqual(['05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
	});

	test('disabled shows the options without letting anyone choose them, out of the Tab order', async () => {
		const onchange = vi.fn();
		const { props, state } = withValue({ locale: 'en-GB', disabled: true, onchange }, '09:30');
		const screen = await render(TimePicker, props);
		await expect.element(screen.getByRole('group')).toHaveAttribute('data-disabled');
		await expect.element(column('Hours')).toHaveAttribute('aria-disabled', 'true');
		expect(screen.container.querySelectorAll('[role="option"][tabindex]')).toHaveLength(0);
		await option('Hours', '10').click({ force: true });
		expect(state.value).toBe('09:30');
		expect(onchange).not.toHaveBeenCalled();
	});

	test('scrolls each column so the chosen option is in the middle', async () => {
		await render(TimePicker, { locale: 'en-GB', value: '00:55' });
		for (const [name, label] of [
			['Hours', '00'],
			['Minutes', '55']
		]) {
			const list = column(name).element();
			await expect.poll(() => centerOffset(option(name, label).element(), list)).toBeLessThan(2);
		}
	});

	test('without a value the columns show the current time', async () => {
		freezeNow();
		await render(TimePicker, {});
		await expect.element(option('Hours', '10')).toHaveAttribute('tabindex', '0');
		await expect.element(option('Minutes', '05')).toHaveAttribute('tabindex', '0');
		await expect.element(option('AM/PM', 'AM')).toHaveAttribute('tabindex', '0');
		await expect.poll(() => centerOffset(option('Hours', '10').element(), column('Hours').element())).toBeLessThan(2);
	});

	describe('keyboard', () => {
		test('each column is one Tab stop, on the chosen option', async () => {
			const screen = await render(TimePicker, { value: '14:30' });
			expect(screen.container.querySelectorAll('[tabindex="0"]')).toHaveLength(3);
			await userEvent.keyboard('{Tab}');
			await expect.element(option('Hours', '02')).toHaveFocus();
			await userEvent.keyboard('{Tab}');
			await expect.element(option('Minutes', '30')).toHaveFocus();
			await userEvent.keyboard('{Tab}');
			await expect.element(option('AM/PM', 'PM')).toHaveFocus();
		});

		test('the scrolling columns themselves are not Tab stops (Firefox focuses scroll containers)', async () => {
			const container = document.createElement('div');
			const after = document.createElement('button');
			after.textContent = 'After';
			document.body.append(container, after);
			await render(TimePicker, { target: container, props: { locale: 'en-GB', value: '09:30' } });
			await userEvent.keyboard('{Tab}{Tab}');
			await expect.element(option('Minutes', '30')).toHaveFocus();
			await userEvent.keyboard('{Tab}');
			expect(document.activeElement).toBe(after);
			after.remove();
			container.remove();
		});

		test('arrows, Home, End, Page Up and Page Down move in a column and skip disabled options', async () => {
			await render(TimePicker, { locale: 'en-GB', value: '09:30', min: '08:00', max: '20:59' });
			await userEvent.keyboard('{Tab}{ArrowDown}');
			await expect.element(option('Hours', '10')).toHaveFocus();
			await userEvent.keyboard('{ArrowUp}{ArrowUp}');
			await expect.element(option('Hours', '08')).toHaveFocus();
			await userEvent.keyboard('{ArrowUp}');
			await expect.element(option('Hours', '08')).toHaveFocus();
			await userEvent.keyboard('{PageDown}');
			await expect.element(option('Hours', '13')).toHaveFocus();
			await userEvent.keyboard('{End}');
			await expect.element(option('Hours', '20')).toHaveFocus();
			await userEvent.keyboard('{PageUp}');
			await expect.element(option('Hours', '15')).toHaveFocus();
			await userEvent.keyboard('{Home}');
			await expect.element(option('Hours', '08')).toHaveFocus();
			await expect.element(option('Hours', '08')).toHaveAttribute('tabindex', '0');
			await expect.element(option('Hours', '09')).toHaveAttribute('aria-selected', 'true');
		});

		test('Arrow Right and Arrow Left move between the columns', async () => {
			await render(TimePicker, { value: '14:30' });
			await userEvent.keyboard('{Tab}{ArrowRight}');
			await expect.element(option('Minutes', '30')).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}');
			await expect.element(option('AM/PM', 'PM')).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}');
			await expect.element(option('AM/PM', 'PM')).toHaveFocus();
			await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
			await expect.element(option('Hours', '02')).toHaveFocus();
		});

		test('Enter and Space choose the focused option and move to the next column', async () => {
			const onchange = vi.fn();
			const { props, state } = withValue({ locale: 'en-GB', onchange }, '09:30');
			await render(TimePicker, props);
			await userEvent.keyboard('{Tab}{ArrowDown}{Enter}');
			expect(state.value).toBe('10:30');
			await expect.element(option('Minutes', '30')).toHaveFocus();
			await userEvent.keyboard('{ArrowDown} ');
			expect(state.value).toBe('10:35');
			await expect.element(option('Minutes', '35')).toHaveFocus();
			expect(onchange).toHaveBeenCalledTimes(2);
			expect(onchange).toHaveBeenLastCalledWith({ value: '10:35', column: 'minutes' });
		});

		test('typing digits goes to the matching option; A and P go to AM and PM', async () => {
			await render(TimePicker, { value: '09:30' });
			await userEvent.keyboard('{Tab}1');
			await expect.element(option('Hours', '01')).toHaveFocus();
			await userEvent.keyboard('1');
			await expect.element(option('Hours', '11')).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}4');
			await expect.element(option('Minutes', '40')).toHaveFocus();
			await userEvent.keyboard('5');
			await expect.element(option('Minutes', '45')).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}p');
			await expect.element(option('AM/PM', 'PM')).toHaveFocus();
			await userEvent.keyboard('a');
			await expect.element(option('AM/PM', 'AM')).toHaveFocus();
			await expect.element(option('Hours', '09')).toHaveAttribute('aria-selected', 'true');
		});

		test('typing two digits in the 24-hour clock goes to that hour', async () => {
			await render(TimePicker, { locale: 'en-GB', value: '09:30' });
			await userEvent.keyboard('{Tab}17');
			await expect.element(option('Hours', '17')).toHaveFocus();
		});

		test('focus() moves the focus to the hours Tab stop', async () => {
			const screen = await render(TimePicker, { locale: 'en-GB', value: '06:15' });
			screen.component.focus();
			await expect.element(option('Hours', '06')).toHaveFocus();
		});

		test('an onkeydown that calls preventDefault stops the built-in keys', async () => {
			const { props, state } = withValue(
				{ locale: 'en-GB', onkeydown: (event: KeyboardEvent) => event.preventDefault() },
				'09:30'
			);
			await render(TimePicker, props);
			await userEvent.keyboard('{Tab}{ArrowDown}{Enter}');
			await expect.element(option('Hours', '09')).toHaveFocus();
			expect(state.value).toBe('09:30');
		});
	});

	test('the column names are props, for translations', async () => {
		await render(TimePicker, {
			hoursLabel: 'Ore',
			minutesLabel: 'Minuti',
			periodLabel: 'Mattina/sera'
		});
		await expect.element(column('Ore')).toBeInTheDocument();
		await expect.element(column('Minuti')).toBeInTheDocument();
		await expect.element(column('Mattina/sera')).toBeInTheDocument();
	});

	test('optionSnippet replaces the text and the option can still be chosen', async () => {
		const optionSnippet = createRawSnippet(
			(params: () => { value: number | string; label: string; column: string; selected: boolean; disabled: boolean }) => {
				const { value, label, column, selected, disabled } = params();
				return {
					render: () => `<b class="custom">${column}:${value}:${label}${selected ? '*' : ''}${disabled ? '!' : ''}</b>`
				};
			}
		);
		const { props, state } = withValue({ optionSnippet, max: '11:55' }, '09:30');
		const screen = await render(TimePicker, props);
		const texts = () => [...screen.container.querySelectorAll('.custom')].map((node) => node.textContent);
		expect(texts()).toContain('hours:9:09*');
		expect(texts()).toContain('minutes:30:30*');
		expect(texts()).toContain('period:am:AM*');
		expect(texts()).toContain('period:pm:PM!');
		const ten = [...screen.container.querySelectorAll<HTMLElement>('.custom')].find((node) => node.textContent === 'hours:10:10')!;
		ten.click();
		expect(state.value).toBe('10:30');
	});

	test('forwards native attributes to the group and the class parts to their elements', async () => {
		let element: HTMLDivElement | undefined;
		const screen = await render(TimePicker, {
			locale: 'en-GB',
			id: 'shift',
			'aria-label': 'Shift start',
			'data-testid': 'picker',
			class: { container: 'app-picker', column: 'app-column', option: 'app-option' },
			get timePickerElement() {
				return element;
			},
			set timePickerElement(value) {
				element = value;
			}
		});
		const group = screen.getByTestId('picker');
		await expect.element(group).toHaveAttribute('id', 'shift');
		await expect.element(group).toHaveAccessibleName('Shift start');
		await expect.element(group).toHaveClass('aurora-time-picker', 'app-picker');
		expect(element).toBe(group.element());
		expect(screen.container.querySelectorAll('.app-column')).toHaveLength(2);
		expect(screen.container.querySelectorAll('.app-option')).toHaveLength(36);
	});

	test('instance CSS variables style the columns and the options', async () => {
		await render(TimePicker, {
			locale: 'en-GB',
			value: '09:30',
			style:
				'--time-picker-column-height: 120px; --time-picker-column-width: 80px; --time-picker-option-selected-background: rgb(1, 2, 3); --time-picker-option-color: rgb(4, 5, 6)'
		});
		const hours = column('Hours').element();
		expect(hours.getBoundingClientRect().height).toBe(120);
		expect(hours.getBoundingClientRect().width).toBe(80);
		expect(getComputedStyle(option('Hours', '09').element()).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(option('Hours', '10').element()).color).toBe('rgb(4, 5, 6)');
	});
});

describe('TimePicker texts', () => {
	test('follow locale, and a text prop wins', async () => {
		const italian = await render(TimePicker, { locale: 'it' });
		await expect.element(column('Ore')).toBeVisible();
		await expect.element(column('Minuti')).toBeVisible();
		await italian.unmount();
		await render(TimePicker, { locale: 'it', hoursLabel: 'Ora' });
		await expect.element(column('Ora')).toBeVisible();
	});

	test('follow setDefaultLocale, also for the clock; the locale prop wins over it', async () => {
		const inherited = await renderWithDefaultLocale('it', TimePicker);
		await expect.element(column('Ore')).toBeVisible();
		expect(inherited.container.querySelector('.aurora-time-picker')).toHaveAttribute('data-hour-cycle', '24');
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', TimePicker, { locale: 'en' });
		await expect.element(column('Hours')).toBeVisible();
		await expect.element(column('AM/PM')).toBeVisible();
		expect(own.container.querySelector('.aurora-time-picker')).toHaveAttribute('data-hour-cycle', '12');
	});
});
