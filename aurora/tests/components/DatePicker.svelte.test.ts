import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DatePicker from '#lib/components/simple/dates/DatePicker.svelte';
import { parseISODate, toISODate } from '#lib/utils/dates.js';

const fullDate = new Intl.DateTimeFormat('en', { dateStyle: 'full' });

function day(iso: string) {
	return page.getByRole('gridcell', { name: fullDate.format(parseISODate(iso)!), exact: true });
}

function button(name: string) {
	return page.getByRole('button', { name, exact: true });
}

function option(name: string) {
	return page.getByRole('option', { name, exact: true });
}

function picker() {
	return document.querySelector<HTMLElement>('.aurora-date-picker')!;
}

function arrows() {
	return [...picker().querySelectorAll<HTMLElement>('.aurora-date-picker-arrow')];
}

type Bound = {
	selectedDate?: Date;
	selectedDateTo?: Date;
	visibleMonth?: number;
	visibleYear?: number;
	view?: 'day' | 'month' | 'year';
};

function bound(initial: Bound = {}) {
	const state = $state<Bound>(initial);
	return state;
}

function withBound<T extends object>(props: T, state: Bound) {
	for (const key of ['selectedDate', 'selectedDateTo', 'visibleMonth', 'visibleYear', 'view'] as const)
		Object.defineProperty(props, key, {
			enumerable: true,
			configurable: true,
			get: () => state[key],
			set: (value) => (state[key] = value)
		});
	return props as T & Bound;
}

function freezeToday() {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 8, 24, 10));
}

afterEach(() => {
	vi.useRealTimers();
});

describe('DatePicker', () => {
	test('renders the title between two arrows above a Calendar labelled by the title', async () => {
		await render(DatePicker, { selectedDate: new Date(2026, 9, 9) });
		await expect.element(button('Previous month')).toBeInTheDocument();
		await expect.element(button('Next month')).toBeInTheDocument();
		const title = button('October 2026');
		await expect.element(title).toHaveAttribute('aria-live', 'polite');
		await expect.element(page.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
		await expect.element(day('2026-10-09')).toHaveAttribute('aria-selected', 'true');
		expect(picker().dataset.view).toBe('day');
		const header = picker().querySelector('.aurora-date-picker-header')!;
		expect([...header.querySelectorAll('button')].map((node) => node.getAttribute('aria-label') ?? node.textContent?.trim())).toEqual([
			'Previous month',
			'October 2026',
			'Next month'
		]);
	});

	test('without selectedDate it shows the current month', async () => {
		freezeToday();
		await render(DatePicker, {});
		await expect.element(button('September 2026')).toBeInTheDocument();
		await expect.element(day('2026-09-24')).toHaveAttribute('aria-current', 'date');
	});

	test('v4 bug: no button of the panel submits the form around it', async () => {
		const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
		const form = document.createElement('form');
		form.addEventListener('submit', onsubmit);
		document.body.append(form);
		await render(DatePicker, { target: form, props: { selectedDate: new Date(2026, 9, 9) } });
		for (const node of form.querySelectorAll('button')) expect(node.getAttribute('type')).toBe('button');
		await button('Next month').click();
		await button('Previous month').click();
		await day('2026-10-14').click();
		await button('October 2026').click();
		await button('Next year').click();
		await option('March').click();
		await button('March 2027').click();
		await button('2027').click();
		await option('2030').click();
		await option('May').click();
		await userEvent.keyboard('{Enter}');
		expect(onsubmit).not.toHaveBeenCalled();
		form.remove();
	});

	describe('arrows', () => {
		test('in the day view change the month, across years, and update the bound visible month', async () => {
			const state = bound({ selectedDate: new Date(2026, 10, 9) });
			await render(DatePicker, withBound({}, state));
			await button('Next month').click();
			await expect.element(button('December 2026')).toBeInTheDocument();
			await expect.element(page.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
			await button('Next month').click();
			await expect.element(button('January 2027')).toBeInTheDocument();
			expect(state.visibleMonth).toBe(0);
			expect(state.visibleYear).toBe(2027);
			await button('Previous month').click();
			await button('Previous month').click();
			await button('Previous month').click();
			await expect.element(button('October 2026')).toBeInTheDocument();
			expect(state.visibleMonth).toBe(9);
			expect(state.visibleYear).toBe(2026);
			expect(toISODate(state.selectedDate!)).toBe('2026-11-09');
		});

		test('in the month view change the year and are named for it', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9), view: 'month' });
			await render(DatePicker, withBound({}, state));
			await expect.element(button('2026')).toBeInTheDocument();
			await expect.element(page.getByRole('listbox', { name: '2026' })).toBeInTheDocument();
			await button('Next year').click();
			await expect.element(button('2027')).toBeInTheDocument();
			await button('Previous year').click();
			await button('Previous year').click();
			await expect.element(button('2025')).toBeInTheDocument();
			expect(state.visibleYear).toBe(2025);
			expect(state.visibleMonth).toBe(9);
		});

		test('in the year view are hidden and inert', async () => {
			await render(DatePicker, { selectedDate: new Date(2026, 9, 9), view: 'year' });
			await expect.element(page.getByRole('listbox')).toBeInTheDocument();
			for (const arrow of arrows()) {
				expect(arrow.hasAttribute('inert')).toBe(true);
				expect(getComputedStyle(arrow).visibility).toBe('hidden');
			}
			expect(document.querySelector('[aria-label="Previous month"], [aria-label="Previous year"]')).not.toBeNull();
			await expect.element(button('Previous month')).not.toBeInTheDocument();
			await expect.element(button('Previous year')).not.toBeInTheDocument();
		});

		test('custom labels name the arrows', async () => {
			await render(DatePicker, {
				selectedDate: new Date(2026, 9, 9),
				locale: 'it',
				previousMonthLabel: 'Mese precedente',
				nextMonthLabel: 'Mese successivo',
				previousYearLabel: 'Anno precedente',
				nextYearLabel: 'Anno successivo'
			});
			await expect.element(button('Mese precedente')).toBeInTheDocument();
			await expect.element(button('Mese successivo')).toBeInTheDocument();
			await button('Ottobre 2026').click();
			await expect.element(button('Anno precedente')).toBeInTheDocument();
			await expect.element(button('Anno successivo')).toBeInTheDocument();
		});

		test('are disabled beyond min and max, by month in the day view and by year in the month view', async () => {
			await render(DatePicker, {
				selectedDate: new Date(2026, 9, 9),
				min: new Date(2026, 8, 15),
				max: new Date(2026, 10, 10)
			});
			await expect.element(button('Previous month')).toBeEnabled();
			await button('Previous month').click();
			await expect.element(button('September 2026')).toBeInTheDocument();
			await expect.element(button('Previous month')).toBeDisabled();
			await button('Next month').click();
			await button('Next month').click();
			await expect.element(button('November 2026')).toBeInTheDocument();
			await expect.element(button('Next month')).toBeDisabled();
			await expect.element(button('Previous month')).toBeEnabled();
			await button('November 2026').click();
			await expect.element(button('Previous year')).toBeDisabled();
			await expect.element(button('Next year')).toBeDisabled();
		});
	});

	describe('views', () => {
		test('the title goes from days to months to years and back, and view is bound', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9) });
			await render(DatePicker, withBound({}, state));
			await button('October 2026').click();
			expect(state.view).toBe('month');
			expect(picker().dataset.view).toBe('month');
			await expect.element(page.getByRole('listbox', { name: '2026' })).toBeInTheDocument();
			await expect.element(option('October')).toHaveAttribute('aria-selected', 'true');
			await button('2026').click();
			expect(state.view).toBe('year');
			expect(picker().dataset.view).toBe('year');
			await expect.element(option('2026')).toHaveAttribute('aria-selected', 'true');
			await button('2026').click();
			expect(state.view).toBe('day');
			await expect.element(page.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
		});

		test('view drives the panel from outside', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9), view: 'year' });
			await render(DatePicker, withBound({}, state));
			await expect.element(page.getByRole('listbox', { name: '2026' })).toBeInTheDocument();
			await expect.element(option('2026')).toBeInTheDocument();
			state.view = 'month';
			await expect.element(option('October')).toBeInTheDocument();
			state.view = 'day';
			await expect.element(page.getByRole('grid')).toBeInTheDocument();
		});

		test('choosing a year shows its months, choosing a month shows its days', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9), view: 'year' });
			await render(DatePicker, withBound({}, state));
			await option('2030').click();
			expect(state.view).toBe('month');
			expect(state.visibleYear).toBe(2030);
			await expect.element(button('2030')).toBeInTheDocument();
			await expect.element(option('October')).toHaveFocus();
			await option('March').click();
			expect(state.view).toBe('day');
			expect(state.visibleMonth).toBe(2);
			await expect.element(page.getByRole('grid', { name: 'March 2030' })).toBeInTheDocument();
			await expect.element(day('2030-03-01')).toHaveFocus();
			expect(toISODate(state.selectedDate!)).toBe('2026-10-09');
		});

		test('v4 bug: choosing the year already chosen keeps it and shows its months', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9), view: 'year' });
			await render(DatePicker, withBound({}, state));
			await option('2026').click();
			expect(state.view).toBe('month');
			expect(state.visibleYear).toBe(2026);
			await expect.element(button('2026')).toBeInTheDocument();
		});

		test('with the keyboard the focus follows the views', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9), view: 'year' });
			await render(DatePicker, withBound({}, state));
			option('2026').element().focus();
			await userEvent.keyboard('{ArrowRight}{Enter}');
			expect(state.view).toBe('month');
			await expect.element(option('October')).toHaveFocus();
			await userEvent.keyboard('{ArrowDown}{Enter}');
			expect(state.view).toBe('day');
			await expect.element(page.getByRole('grid', { name: 'December 2027' })).toBeInTheDocument();
			await expect.element(day('2027-12-01')).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}{Enter}');
			expect(toISODate(state.selectedDate!)).toBe('2027-12-02');
		});

		test('the selected day is the Tab stop of a month chosen through the views', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9), view: 'month' });
			await render(DatePicker, withBound({}, state));
			await option('August').click();
			await expect.element(day('2026-08-01')).toHaveFocus();
			await button('August 2026').click();
			await option('October').click();
			await expect.element(day('2026-10-09')).toHaveFocus();
		});

		test('the year view scrolls to the visible year', async () => {
			await render(DatePicker, { selectedDate: new Date(2026, 9, 9) });
			await button('October 2026').click();
			await button('2026').click();
			const list = page.getByRole('listbox').element();
			expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
			await expect
				.poll(() => {
					const item = option('2026').element().getBoundingClientRect();
					const box = list.getBoundingClientRect();
					return item.top >= box.top && item.bottom <= box.bottom;
				})
				.toBe(true);
		});

		test('the panel keeps its height when it switches from days to months or years', async () => {
			await render(DatePicker, { selectedDate: new Date(2026, 9, 9) });
			const height = picker().getBoundingClientRect().height;
			await button('October 2026').click();
			await expect.element(option('October')).toBeInTheDocument();
			expect(picker().getBoundingClientRect().height).toBe(height);
			await button('2026').click();
			await expect.element(option('2026')).toBeInTheDocument();
			expect(picker().getBoundingClientRect().height).toBe(height);
		});
	});

	describe('limits', () => {
		test('min and max limit the months and the years', async () => {
			await render(DatePicker, {
				selectedDate: new Date(2026, 9, 9),
				min: new Date(2024, 3, 15),
				max: new Date(2026, 10, 10),
				view: 'month'
			});
			await expect.element(option('November')).not.toHaveAttribute('aria-disabled');
			await expect.element(option('December')).toHaveAttribute('aria-disabled', 'true');
			await button('2026').click();
			expect(page.getByRole('option').elements().map((node) => node.textContent?.trim())).toEqual([
				'2024',
				'2025',
				'2026'
			]);
			await option('2024').click();
			await expect.element(option('March')).toHaveAttribute('aria-disabled', 'true');
			await expect.element(option('April')).not.toHaveAttribute('aria-disabled');
		});

		test('without min and max the years go from 1900 to 2100', async () => {
			await render(DatePicker, { selectedDate: new Date(2026, 9, 9), view: 'year' });
			const years = page.getByRole('option').elements();
			expect(years).toHaveLength(201);
			expect(years[0].textContent?.trim()).toBe('1900');
			expect(years.at(-1)?.textContent?.trim()).toBe('2100');
		});

		test('v4 bug: disabled reaches the arrows, the title and the grids of every view', async () => {
			const onchange = vi.fn();
			const state = bound({ selectedDate: new Date(2026, 9, 9) });
			await render(DatePicker, withBound({ disabled: true, onchange }, state));
			expect(picker().hasAttribute('data-disabled')).toBe(true);
			await expect.element(button('Previous month')).toBeDisabled();
			await expect.element(button('Next month')).toBeDisabled();
			await expect.element(button('October 2026')).toBeDisabled();
			await expect.element(page.getByRole('grid')).toHaveAttribute('aria-disabled', 'true');
			expect(picker().querySelectorAll('[tabindex="0"]')).toHaveLength(0);
			await day('2026-10-14').click({ force: true });
			expect(onchange).not.toHaveBeenCalled();

			state.view = 'month';
			await expect.element(page.getByRole('listbox')).toHaveAttribute('aria-disabled', 'true');
			expect(picker().querySelectorAll('[role="option"][tabindex]')).toHaveLength(0);
			await option('March').click({ force: true });
			expect(state.view).toBe('month');

			state.view = 'year';
			await expect.element(page.getByRole('listbox')).toHaveAttribute('aria-disabled', 'true');
			expect(picker().querySelectorAll('[role="option"][tabindex]')).toHaveLength(0);
			await option('2030').click({ force: true });
			expect(state.view).toBe('year');
			expect(state.visibleYear).toBeUndefined();
		});
	});

	describe('Calendar props', () => {
		test('choosing a day updates selectedDate and calls onchange and ondayClick', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9) });
			const onchange = vi.fn();
			const ondayClick = vi.fn();
			await render(DatePicker, withBound({ onchange, ondayClick }, state));
			await day('2026-10-14').click();
			expect(toISODate(state.selectedDate!)).toBe('2026-10-14');
			expect(onchange).toHaveBeenCalledExactlyOnceWith({ selectedDate: state.selectedDate, selectedDateTo: undefined });
			expect(ondayClick.mock.calls[0][0].outside).toBe(false);
		});

		test('range chooses two days', async () => {
			const state = bound({ visibleMonth: 9, visibleYear: 2026 });
			await render(DatePicker, withBound({ range: true }, state));
			await day('2026-10-20').click();
			await day('2026-10-10').click();
			expect(toISODate(state.selectedDate!)).toBe('2026-10-10');
			expect(toISODate(state.selectedDateTo!)).toBe('2026-10-20');
			await expect.element(day('2026-10-15')).toHaveAttribute('data-range', 'middle');
		});

		test('choosing a day of the next month moves the title to that month', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9) });
			await render(DatePicker, withBound({}, state));
			await day('2026-11-02').click();
			await expect.element(button('November 2026')).toBeInTheDocument();
			expect(state.visibleMonth).toBe(10);
		});

		test('the keyboard navigation of the grid moves the title', async () => {
			await render(DatePicker, { selectedDate: new Date(2026, 9, 9) });
			day('2026-10-09').element().focus();
			await userEvent.keyboard('{PageDown}');
			await expect.element(button('November 2026')).toBeInTheDocument();
			await userEvent.keyboard('{Shift>}{PageUp}{/Shift}');
			await expect.element(button('November 2025')).toBeInTheDocument();
			await expect.element(day('2025-11-09')).toHaveFocus();
		});

		test('a selectedDate changed from outside shows its month', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9) });
			await render(DatePicker, withBound({}, state));
			state.selectedDate = new Date(2027, 4, 20);
			await expect.element(button('May 2027')).toBeInTheDocument();
			await expect.element(day('2027-05-20')).toHaveAttribute('aria-selected', 'true');
		});

		test('locale, weekStart, showWeekdays and isDateDisabled reach the grid', async () => {
			const screen = await render(DatePicker, {
				selectedDate: new Date(2026, 9, 9),
				locale: 'it',
				weekStart: 0,
				isDateDisabled: (date: Date) => date.getDate() === 13
			});
			await expect.element(button('Ottobre 2026')).toBeInTheDocument();
			expect(screen.getByRole('columnheader').elements()[0].getAttribute('aria-label')).toBe('Domenica');
			expect(document.querySelector('[data-date="2026-10-13"]')?.getAttribute('aria-disabled')).toBe('true');
			await screen.unmount();
			const plain = await render(DatePicker, { selectedDate: new Date(2026, 9, 9), showWeekdays: false });
			expect(plain.container.querySelector('[role="columnheader"]')).toBeNull();
		});
	});

	test('titleSnippet replaces the text of the title and receives title, month, year and view', async () => {
		const titleSnippet = createRawSnippet(
			(params: () => { title: string; month: number; year: number; view: string }) => ({
				render: () => '<b class="custom"></b>',
				setup: (node) => {
					$effect(() => {
						const { title, month, year, view } = params();
						node.textContent = `${view}|${month}|${year}|${title}`;
					});
				}
			})
		);
		await render(DatePicker, { selectedDate: new Date(2026, 9, 9), titleSnippet });
		const custom = picker().querySelector('.aurora-date-picker-title .custom')!;
		expect(custom.textContent).toBe('day|9|2026|October 2026');
		await button('day|9|2026|October 2026').click();
		await expect.poll(() => custom.textContent).toBe('month|9|2026|2026');
	});

	test('focus() moves the focus into the grid of the current view', async () => {
		const state = bound({ selectedDate: new Date(2026, 9, 9) });
		const screen = await render(DatePicker, withBound({}, state));
		screen.component.focus();
		await expect.element(day('2026-10-09')).toHaveFocus();
		state.view = 'month';
		await expect.element(option('October')).toBeInTheDocument();
		screen.component.focus();
		await expect.element(option('October')).toHaveFocus();
		state.view = 'year';
		await expect.element(option('2026')).toBeInTheDocument();
		screen.component.focus();
		await expect.element(option('2026')).toHaveFocus();
	});

	test('forwards native attributes to the panel and the class parts to their elements', async () => {
		let element: HTMLDivElement | undefined;
		await render(DatePicker, {
			selectedDate: new Date(2026, 9, 9),
			id: 'picker',
			title: 'Pick a day',
			class: { container: 'app-panel', header: 'app-header', title: 'app-title', calendar: 'app-calendar' },
			get datePickerElement() {
				return element;
			},
			set datePickerElement(value) {
				element = value;
			}
		});
		const root = picker();
		expect(element).toBe(root);
		expect(root.id).toBe('picker');
		expect(root.getAttribute('title')).toBe('Pick a day');
		expect(root.classList).toContain('app-panel');
		expect(root.querySelector('.aurora-date-picker-header')?.classList).toContain('app-header');
		await expect.element(button('October 2026')).toHaveClass('aurora-date-picker-title', 'app-title');
		await expect.element(page.getByRole('grid')).toHaveClass('aurora-calendar', 'app-calendar');
	});

	test('instance CSS variables style the panel', async () => {
		await render(DatePicker, {
			selectedDate: new Date(2026, 9, 9),
			style: '--date-picker-width: 400px; --date-picker-background: rgb(1, 2, 3); --date-picker-title-color: rgb(4, 5, 6)'
		});
		expect(picker().getBoundingClientRect().width).toBe(400);
		expect(getComputedStyle(picker()).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(button('October 2026').element()).color).toBe('rgb(4, 5, 6)');
	});
});
