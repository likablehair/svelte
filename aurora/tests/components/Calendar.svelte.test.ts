import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Calendar, { type CalendarDay } from '#lib/components/simple/dates/Calendar.svelte';
import { parseISODate, toISODate } from '#lib/utils/dates.js';

const fullDate = new Intl.DateTimeFormat('en', { dateStyle: 'full' });

function day(iso: string) {
	return page.getByRole('gridcell', { name: fullDate.format(parseISODate(iso)!), exact: true });
}

function cell(iso: string, outside = false) {
	return document.querySelector<HTMLElement>(
		`[data-date="${iso}"]${outside ? '[data-outside]' : ':not([data-outside])'}`
	)!;
}

function dates(selector: string) {
	return [...document.querySelectorAll<HTMLElement>(selector)].map((node) => node.dataset.date);
}

type Bound = {
	selectedDate?: Date;
	selectedDateTo?: Date;
	visibleMonth?: number;
	visibleYear?: number;
};

function bound(initial: Bound = {}) {
	const state = $state<Bound>(initial);
	return state;
}

function withBound<T extends object>(props: T, state: Bound) {
	for (const key of ['selectedDate', 'selectedDateTo', 'visibleMonth', 'visibleYear'] as const)
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

describe('Calendar', () => {
	test('renders an ARIA grid labelled with the month, with weekday headers and 6 rows of 7 days', async () => {
		const screen = await render(Calendar, { visibleMonth: 9, visibleYear: 2026 });
		const grid = screen.getByRole('grid', { name: 'October 2026' });
		await expect.element(grid).toHaveClass('aurora-calendar');
		await expect.element(screen.getByRole('columnheader')).toHaveLength(7);
		await expect.element(screen.getByRole('row')).toHaveLength(7);
		await expect.element(screen.getByRole('gridcell')).toHaveLength(42);
		for (const row of screen.getByRole('row').elements().slice(1))
			expect(row.querySelectorAll('[role="gridcell"]')).toHaveLength(7);
		await expect.element(grid).not.toHaveAttribute('aria-multiselectable');
	});

	test('always shows 6 rows, also for a month that fits in 4', async () => {
		await render(Calendar, { visibleMonth: 1, visibleYear: 2026 });
		await expect.element(page.getByRole('gridcell')).toHaveLength(42);
		const all = dates('[data-date]');
		expect(all[0]).toBe('2026-02-01');
		expect(all.at(-1)).toBe('2026-03-14');
	});

	test('v4 bug: in English October 2026 starts with Sunday 27 September', async () => {
		const screen = await render(Calendar, { visibleMonth: 9, visibleYear: 2026 });
		const headers = screen.getByRole('columnheader').elements();
		expect(headers[0].textContent?.trim()).toBe('Sun');
		expect(headers[0].getAttribute('aria-label')).toBe('Sunday');
		expect(headers[6].getAttribute('aria-label')).toBe('Saturday');
		const all = dates('[data-date]');
		expect(all.slice(0, 5)).toEqual(['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']);
		expect(all.at(-1)).toBe('2026-11-07');
		await expect.element(day('2026-09-27')).toHaveAttribute('data-outside');
	});

	test('v4 bug: February 2100 has 28 days', async () => {
		await render(Calendar, { visibleMonth: 1, visibleYear: 2100 });
		const inside = dates('[data-date]:not([data-outside])');
		expect(inside).toHaveLength(28);
		expect(inside.at(-1)).toBe('2100-02-28');
		expect(document.querySelector('[data-date="2100-02-29"]')).toBeNull();
		expect(cell('2100-03-01', true)).not.toBeNull();
	});

	test('the locale translates the names and sets the first day of the week', async () => {
		const screen = await render(Calendar, { visibleMonth: 9, visibleYear: 2026, locale: 'it' });
		await expect.element(screen.getByRole('grid', { name: 'Ottobre 2026' })).toBeInTheDocument();
		const headers = screen.getByRole('columnheader').elements();
		expect(headers[0].textContent?.trim()).toBe('Lun');
		expect(headers[0].getAttribute('aria-label')).toBe('Lunedì');
		expect(headers[6].getAttribute('aria-label')).toBe('Domenica');
		expect(dates('[data-date]')[0]).toBe('2026-09-28');
		expect(cell('2026-10-09').textContent).toContain('venerdì 9 ottobre 2026');
	});

	test('weekStart overrides the first day of the locale', async () => {
		const screen = await render(Calendar, { visibleMonth: 9, visibleYear: 2026, weekStart: 1 });
		expect(screen.getByRole('columnheader').elements()[0].getAttribute('aria-label')).toBe('Monday');
		expect(dates('[data-date]')[0]).toBe('2026-09-28');
	});

	test('weekdayFormat sets the length of the weekday names, screen readers read the full name', async () => {
		const narrow = await render(Calendar, { visibleMonth: 9, visibleYear: 2026, weekdayFormat: 'narrow' });
		const header = narrow.getByRole('columnheader').elements()[1];
		expect(header.textContent?.trim()).toBe('M');
		expect(header.getAttribute('aria-label')).toBe('Monday');
		await narrow.unmount();
		const long = await render(Calendar, { visibleMonth: 9, visibleYear: 2026, weekdayFormat: 'long' });
		expect(long.getByRole('columnheader').elements()[1].textContent?.trim()).toBe('Monday');
	});

	test('every day has a hidden full-date label; the number is hidden from screen readers', async () => {
		await render(Calendar, { visibleMonth: 9, visibleYear: 2026 });
		await expect.element(day('2026-10-09')).toBeInTheDocument();
		const node = cell('2026-10-09');
		expect(node.querySelector('.aurora-calendar-day-content')?.getAttribute('aria-hidden')).toBe('true');
		expect(node.querySelector('.aurora-calendar-day-content')?.textContent?.trim()).toBe('9');
		const label = node.querySelector('.aurora-calendar-label')!;
		expect(label.textContent).toBe('Friday, October 9, 2026');
		expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
	});

	test('the month comes from selectedDate when visibleMonth is not set', async () => {
		await render(Calendar, { selectedDate: new Date(2027, 2, 5) });
		await expect.element(page.getByRole('grid', { name: 'March 2027' })).toBeInTheDocument();
		await expect.element(day('2027-03-05')).toHaveAttribute('aria-selected', 'true');
	});

	test('without selectedDate and visibleMonth it shows the current month', async () => {
		freezeToday();
		await render(Calendar, {});
		await expect.element(page.getByRole('grid', { name: 'September 2026' })).toBeInTheDocument();
	});

	describe('today', () => {
		test('is marked with aria-current="date" and data-today, and is the Tab stop', async () => {
			freezeToday();
			await render(Calendar, { visibleMonth: 8, visibleYear: 2026 });
			const today = day('2026-09-24');
			await expect.element(today).toHaveAttribute('aria-current', 'date');
			await expect.element(today).toHaveAttribute('data-today');
			await expect.element(today).toHaveAttribute('tabindex', '0');
			expect(document.querySelectorAll('[aria-current]')).toHaveLength(1);
			expect(document.querySelectorAll('[data-today]')).toHaveLength(1);
		});

		test('is computed after mount, on the client only', () => {
			freezeToday();
			const target = document.createElement('div');
			document.body.append(target);
			const component = mount(Calendar, { target, props: { visibleMonth: 8, visibleYear: 2026 } });
			expect(target.querySelector('[data-today]')).toBeNull();
			flushSync();
			expect(target.querySelector('[data-today]')?.getAttribute('data-date')).toBe('2026-09-24');
			unmount(component);
			target.remove();
		});
	});

	describe('choosing a day', () => {
		test('a click selects the day and calls onchange and ondayClick (no detail wrapper)', async () => {
			const state = bound();
			const onchange = vi.fn();
			const ondayClick = vi.fn((event: { date: Date }) => {
				expect(state.selectedDate).toBe(event.date);
			});
			await render(Calendar, withBound({ visibleMonth: 9, visibleYear: 2026, onchange, ondayClick }, state));
			await day('2026-10-14').click();
			expect(toISODate(state.selectedDate!)).toBe('2026-10-14');
			expect(state.selectedDate!.getHours()).toBe(0);
			await expect.element(day('2026-10-14')).toHaveAttribute('aria-selected', 'true');
			await expect.element(day('2026-10-14')).toHaveAttribute('data-selected');
			await expect.element(day('2026-10-13')).toHaveAttribute('aria-selected', 'false');
			expect(onchange).toHaveBeenCalledExactlyOnceWith({ selectedDate: state.selectedDate, selectedDateTo: undefined });
			expect(ondayClick).toHaveBeenCalledOnce();
			const argument = ondayClick.mock.calls[0][0] as unknown as {
				date: Date;
				outside: boolean;
				nativeEvent: Event;
				detail?: unknown;
			};
			expect(toISODate(argument.date)).toBe('2026-10-14');
			expect(argument.outside).toBe(false);
			expect(argument.nativeEvent).toBeInstanceOf(MouseEvent);
			expect(argument.detail).toBeUndefined();
		});

		test('selectedDate selects its day', async () => {
			await render(Calendar, { selectedDate: new Date(2026, 9, 9) });
			await expect.element(day('2026-10-09')).toHaveAttribute('aria-selected', 'true');
			expect(dates('[data-selected]')).toEqual(['2026-10-09']);
		});

		test('v4 bug: a selectedDate with a time of day still selects its day', async () => {
			await render(Calendar, {
				selectedDate: new Date(2026, 9, 9, 15, 30),
				min: new Date(2026, 9, 9, 18),
				max: new Date(2026, 9, 20, 6)
			});
			await expect.element(day('2026-10-09')).toHaveAttribute('aria-selected', 'true');
			await expect.element(day('2026-10-09')).not.toHaveAttribute('aria-disabled');
			await expect.element(day('2026-10-20')).not.toHaveAttribute('aria-disabled');
			await expect.element(day('2026-10-21')).toHaveAttribute('aria-disabled', 'true');
		});

		test('clicking an outside day selects it and shows its month', async () => {
			const state = bound({ visibleMonth: 9, visibleYear: 2026 });
			const ondayClick = vi.fn();
			await render(Calendar, withBound({ ondayClick }, state));
			await expect.element(day('2026-11-02')).toHaveAttribute('data-outside');
			await day('2026-11-02').click();
			expect(toISODate(state.selectedDate!)).toBe('2026-11-02');
			expect(state.visibleMonth).toBe(10);
			expect(state.visibleYear).toBe(2026);
			await expect.element(page.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
			await expect.element(day('2026-11-02')).not.toHaveAttribute('data-outside');
			await expect.element(day('2026-11-02')).toHaveAttribute('aria-selected', 'true');
			expect(ondayClick.mock.calls[0][0].outside).toBe(true);
		});

		test('the visible month follows selectedDate when it changes to another month', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 9) });
			await render(Calendar, withBound({}, state));
			await expect.element(page.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
			state.selectedDate = new Date(2027, 2, 5);
			await expect.element(page.getByRole('grid', { name: 'March 2027' })).toBeInTheDocument();
			expect(state.visibleMonth).toBe(2);
			expect(state.visibleYear).toBe(2027);
			await expect.element(day('2027-03-05')).toHaveAttribute('aria-selected', 'true');
		});

		test('visibleMonth and visibleYear drive the grid from outside', async () => {
			const state = bound({ visibleMonth: 9, visibleYear: 2026 });
			await render(Calendar, withBound({}, state));
			state.visibleMonth = 0;
			state.visibleYear = 2027;
			await expect.element(page.getByRole('grid', { name: 'January 2027' })).toBeInTheDocument();
			expect(dates('[data-date]:not([data-outside])')[0]).toBe('2027-01-01');
		});
	});

	describe('range', () => {
		test('the first click sets the start, the second the end, the third starts again', async () => {
			const state = bound({ visibleMonth: 9, visibleYear: 2026 });
			const onchange = vi.fn();
			const screen = await render(Calendar, withBound({ range: true, onchange }, state));
			await expect.element(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true');
			await day('2026-10-10').click();
			expect(toISODate(state.selectedDate!)).toBe('2026-10-10');
			expect(state.selectedDateTo).toBeUndefined();
			await day('2026-10-14').click();
			expect(toISODate(state.selectedDate!)).toBe('2026-10-10');
			expect(toISODate(state.selectedDateTo!)).toBe('2026-10-14');
			expect(onchange).toHaveBeenLastCalledWith({
				selectedDate: state.selectedDate,
				selectedDateTo: state.selectedDateTo
			});
			await day('2026-10-20').click();
			expect(toISODate(state.selectedDate!)).toBe('2026-10-20');
			expect(state.selectedDateTo).toBeUndefined();
			expect(onchange).toHaveBeenCalledTimes(3);
		});

		test('the ends swap when the second day is earlier', async () => {
			const state = bound({ visibleMonth: 9, visibleYear: 2026 });
			await render(Calendar, withBound({ range: true }, state));
			await day('2026-10-20').click();
			await day('2026-10-10').click();
			expect(toISODate(state.selectedDate!)).toBe('2026-10-10');
			expect(toISODate(state.selectedDateTo!)).toBe('2026-10-20');
		});

		test('v4 bug: the same day twice is a one-day range', async () => {
			const state = bound({ visibleMonth: 9, visibleYear: 2026 });
			await render(Calendar, withBound({ range: true }, state));
			await day('2026-10-10').click();
			await day('2026-10-10').click();
			expect(toISODate(state.selectedDate!)).toBe('2026-10-10');
			expect(toISODate(state.selectedDateTo!)).toBe('2026-10-10');
			await userEvent.unhover(day('2026-10-10'));
			await expect.element(day('2026-10-10')).toHaveAttribute('data-range', 'single');
			await expect.element(day('2026-10-10')).not.toHaveAttribute('data-preview');
			await expect.element(day('2026-10-10')).toHaveAttribute('aria-selected', 'true');
		});

		test('marks the ends and the days between with data-range and aria-selected', async () => {
			await render(Calendar, {
				range: true,
				selectedDate: new Date(2026, 9, 10),
				selectedDateTo: new Date(2026, 9, 13)
			});
			await expect.element(day('2026-10-10')).toHaveAttribute('data-range', 'start');
			await expect.element(day('2026-10-11')).toHaveAttribute('data-range', 'middle');
			await expect.element(day('2026-10-12')).toHaveAttribute('data-range', 'middle');
			await expect.element(day('2026-10-13')).toHaveAttribute('data-range', 'end');
			await expect.element(day('2026-10-14')).not.toHaveAttribute('data-range');
			expect(dates('[data-selected]')).toEqual(['2026-10-10', '2026-10-13']);
			expect(dates('[aria-selected="true"]')).toEqual(['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13']);
			expect(document.querySelectorAll('[data-preview]')).toHaveLength(0);
		});

		test('a range given in the wrong order is shown in the right one', async () => {
			await render(Calendar, {
				range: true,
				selectedDate: new Date(2026, 9, 13),
				selectedDateTo: new Date(2026, 9, 10)
			});
			await expect.element(day('2026-10-10')).toHaveAttribute('data-range', 'start');
			await expect.element(day('2026-10-13')).toHaveAttribute('data-range', 'end');
		});

		test('while choosing the end, hovering a day previews the range', async () => {
			await render(Calendar, { range: true, visibleMonth: 9, visibleYear: 2026 });
			await day('2026-10-10').click();
			await day('2026-10-13').hover();
			await expect.element(day('2026-10-10')).toHaveAttribute('data-range', 'start');
			await expect.element(day('2026-10-12')).toHaveAttribute('data-range', 'middle');
			await expect.element(day('2026-10-13')).toHaveAttribute('data-range', 'end');
			expect(dates('[data-preview]')).toEqual(['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13']);
			expect(dates('[aria-selected="true"]')).toEqual(['2026-10-10']);
			await day('2026-10-07').hover();
			await expect.element(day('2026-10-07')).toHaveAttribute('data-range', 'start');
			await expect.element(day('2026-10-10')).toHaveAttribute('data-range', 'end');
		});

		test('the preview ends when the pointer leaves the grid and does not reach disabled days', async () => {
			const after = document.createElement('button');
			after.textContent = 'After';
			document.body.append(after);
			await render(Calendar, {
				range: true,
				visibleMonth: 9,
				visibleYear: 2026,
				max: new Date(2026, 9, 20)
			});
			await day('2026-10-10').click();
			await day('2026-10-25').hover();
			await expect.element(day('2026-10-25')).toHaveAttribute('aria-disabled', 'true');
			expect(document.querySelectorAll('[data-preview]')).toHaveLength(0);
			await day('2026-10-12').hover();
			await expect.element(day('2026-10-12')).toHaveAttribute('data-preview');
			after.focus();
			await userEvent.hover(page.getByRole('button', { name: 'After' }));
			await expect.poll(() => document.querySelectorAll('[data-preview]').length).toBe(0);
			after.remove();
		});

		test('moving the focus with the keyboard previews the range', async () => {
			await render(Calendar, { range: true, selectedDate: new Date(2026, 9, 10) });
			await userEvent.keyboard('{Tab}');
			await expect.element(day('2026-10-10')).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}{ArrowRight}');
			await expect.element(day('2026-10-12')).toHaveFocus();
			await expect.element(day('2026-10-12')).toHaveAttribute('data-range', 'end');
			await expect.element(day('2026-10-12')).toHaveAttribute('data-preview');
			await expect.element(day('2026-10-11')).toHaveAttribute('data-range', 'middle');
		});

		test('fillOpenRange highlights the days after a lone start or before a lone end', async () => {
			const start = await render(Calendar, {
				range: true,
				fillOpenRange: true,
				selectedDate: new Date(2026, 9, 28)
			});
			await expect.element(day('2026-10-28')).toHaveAttribute('data-range', 'start');
			await expect.element(day('2026-10-31')).toHaveAttribute('data-range', 'middle');
			await expect.element(day('2026-11-07')).toHaveAttribute('data-range', 'middle');
			await expect.element(day('2026-10-27')).not.toHaveAttribute('data-range');
			expect(document.querySelectorAll('[data-preview]')).toHaveLength(0);
			await start.unmount();

			await render(Calendar, { range: true, fillOpenRange: true, selectedDateTo: new Date(2026, 9, 3) });
			await expect.element(day('2026-10-03')).toHaveAttribute('data-range', 'end');
			await expect.element(day('2026-10-01')).toHaveAttribute('data-range', 'middle');
			await expect.element(day('2026-09-27')).toHaveAttribute('data-range', 'middle');
			await expect.element(day('2026-10-04')).not.toHaveAttribute('data-range');
		});

		test('without fillOpenRange a lone start has no band', async () => {
			await render(Calendar, { range: true, selectedDate: new Date(2026, 9, 28) });
			await expect.element(day('2026-10-28')).toHaveAttribute('data-selected');
			expect(document.querySelectorAll('[data-range]')).toHaveLength(0);
		});

		test('without range selectedDateTo is ignored', async () => {
			await render(Calendar, { selectedDate: new Date(2026, 9, 10), selectedDateTo: new Date(2026, 9, 13) });
			expect(dates('[data-selected]')).toEqual(['2026-10-10']);
			expect(document.querySelectorAll('[data-range]')).toHaveLength(0);
		});
	});

	describe('limits', () => {
		test('min, max and isDateDisabled disable days, which cannot be chosen', async () => {
			const state = bound({ visibleMonth: 9, visibleYear: 2026 });
			const onchange = vi.fn();
			const ondayClick = vi.fn();
			await render(
				Calendar,
				withBound(
					{
						min: new Date(2026, 9, 5),
						max: new Date(2026, 9, 20),
						isDateDisabled: (date: Date) => date.getDay() === 0,
						onchange,
						ondayClick
					},
					state
				)
			);
			await expect.element(day('2026-10-04')).toHaveAttribute('aria-disabled', 'true');
			await expect.element(day('2026-10-04')).toHaveAttribute('data-disabled');
			await expect.element(day('2026-10-05')).not.toHaveAttribute('aria-disabled');
			await expect.element(day('2026-10-20')).not.toHaveAttribute('aria-disabled');
			await expect.element(day('2026-10-21')).toHaveAttribute('aria-disabled', 'true');
			await expect.element(day('2026-10-11')).toHaveAttribute('aria-disabled', 'true');
			await day('2026-10-21').click({ force: true });
			await day('2026-10-11').click({ force: true });
			expect(state.selectedDate).toBeUndefined();
			expect(onchange).not.toHaveBeenCalled();
			expect(ondayClick).not.toHaveBeenCalled();
		});

		test('the keyboard reaches disabled days but cannot choose them', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 20) });
			await render(Calendar, withBound({ max: new Date(2026, 9, 20) }, state));
			await userEvent.keyboard('{Tab}{ArrowRight}');
			await expect.element(day('2026-10-21')).toHaveFocus();
			await userEvent.keyboard('{Enter}');
			expect(toISODate(state.selectedDate!)).toBe('2026-10-20');
		});

		test('disabled shows the days without letting anyone choose them; the grid leaves the Tab order', async () => {
			const before = document.createElement('button');
			before.textContent = 'Before';
			const after = document.createElement('button');
			after.textContent = 'After';
			const container = document.createElement('div');
			document.body.append(before, container, after);
			const onchange = vi.fn();
			const screen = await render(Calendar, {
				target: container,
				props: { selectedDate: new Date(2026, 9, 9), disabled: true, onchange }
			});
			const grid = screen.getByRole('grid');
			await expect.element(grid).toHaveAttribute('aria-disabled', 'true');
			await expect.element(grid).toHaveAttribute('data-disabled');
			expect(container.querySelectorAll('[tabindex]')).toHaveLength(0);
			await day('2026-10-14').click({ force: true });
			expect(onchange).not.toHaveBeenCalled();
			await expect.element(day('2026-10-09')).toHaveAttribute('aria-selected', 'true');
			before.focus();
			await userEvent.keyboard('{Tab}');
			expect(document.activeElement).toBe(after);
			before.remove();
			after.remove();
		});
	});

	describe('display options', () => {
		test('showOutsideDays={false} leaves the outside cells empty, still 6 rows', async () => {
			await render(Calendar, { visibleMonth: 9, visibleYear: 2026, showOutsideDays: false });
			await expect.element(page.getByRole('gridcell')).toHaveLength(42);
			expect(document.querySelectorAll('[data-outside]')).toHaveLength(0);
			const empty = document.querySelectorAll('.aurora-calendar-day-empty');
			expect(empty).toHaveLength(42 - 31);
			expect(empty[0].textContent).toBe('');
			expect(empty[0].hasAttribute('tabindex')).toBe(false);
		});

		test('outside days are faded and out of the Tab order', async () => {
			await render(Calendar, { visibleMonth: 9, visibleYear: 2026 });
			const outside = cell('2026-09-27', true);
			expect(outside.hasAttribute('tabindex')).toBe(false);
			const content = outside.querySelector('.aurora-calendar-day-content')!;
			expect(Number(getComputedStyle(content).opacity)).toBeLessThan(1);
			expect(getComputedStyle(cell('2026-10-01').querySelector('.aurora-calendar-day-content')!).opacity).toBe('1');
		});

		test('showWeekdays={false} removes the weekday row', async () => {
			const screen = await render(Calendar, { visibleMonth: 9, visibleYear: 2026, showWeekdays: false });
			expect(screen.container.querySelector('[role="columnheader"]')).toBeNull();
			await expect.element(screen.getByRole('row')).toHaveLength(6);
		});

		test('variant is exposed as data-variant, compact by default', async () => {
			const compact = await render(Calendar, { visibleMonth: 9, visibleYear: 2026 });
			await expect.element(compact.getByRole('grid')).toHaveAttribute('data-variant', 'compact');
			await compact.unmount();
			const grid = await render(Calendar, { visibleMonth: 9, visibleYear: 2026, variant: 'grid' });
			await expect.element(grid.getByRole('grid')).toHaveAttribute('data-variant', 'grid');
		});
	});

	describe('snippets', () => {
		test('daySnippet replaces the number; the cell keeps click, state and the full-date label', async () => {
			const daySnippet = createRawSnippet((params: () => CalendarDay) => ({
				render: () => '<b class="custom"></b>',
				setup: (node) => {
					$effect(() => {
						const { date, selected, outside, today, disabled } = params();
						const flags = [selected && 'S', outside && 'O', today && 'T', disabled && 'D'].filter(Boolean);
						node.textContent = `${date.getDate()}${flags.join('')}`;
					});
				}
			}));
			freezeToday();
			const state = bound({ selectedDate: new Date(2026, 8, 9) });
			await render(
				Calendar,
				withBound({ daySnippet, isDateDisabled: (date: Date) => date.getDate() === 15 }, state)
			);
			await expect.poll(() => cell('2026-09-24').querySelector('.custom')?.textContent).toBe('24T');
			expect(cell('2026-09-09').querySelector('.custom')?.textContent).toBe('9S');
			expect(cell('2026-08-30', true).querySelector('.custom')?.textContent).toBe('30O');
			expect(cell('2026-09-15').querySelector('.custom')?.textContent).toBe('15D');
			await expect.element(day('2026-09-14')).toBeInTheDocument();
			cell('2026-09-14').querySelector<HTMLElement>('.custom')!.click();
			expect(toISODate(state.selectedDate!)).toBe('2026-09-14');
			await expect.poll(() => cell('2026-09-14').querySelector('.custom')?.textContent).toBe('14S');
			expect(cell('2026-09-09').querySelector('.custom')?.textContent).toBe('9');
		});

		test('dayAppendSnippet adds content after the number', async () => {
			const dayAppendSnippet = createRawSnippet((params: () => CalendarDay) => ({
				render: () => `<i class="event">${params().date.getDate() === 9 ? 'Meeting' : ''}</i>`
			}));
			await render(Calendar, { visibleMonth: 9, visibleYear: 2026, dayAppendSnippet, variant: 'grid' });
			const append = cell('2026-10-09').querySelector('.aurora-calendar-day-append');
			expect(append?.textContent).toBe('Meeting');
			expect(cell('2026-10-09').lastElementChild).toBe(append);
		});

		test('weekdaySnippet replaces the weekday names and receives label, name and day', async () => {
			const weekdaySnippet = createRawSnippet((params: () => { label: string; name: string; day: number }) => ({
				render: () => `<abbr title="${params().name}">${params().day}:${params().label}</abbr>`
			}));
			const screen = await render(Calendar, { visibleMonth: 9, visibleYear: 2026, weekdaySnippet });
			const headers = screen.getByRole('columnheader').elements();
			expect(headers[0].textContent?.trim()).toBe('0:Sun');
			expect(headers[1].querySelector('abbr')?.getAttribute('title')).toBe('Monday');
		});
	});

	describe('keyboard', () => {
		test('v4 bug: the days are a keyboard-operable ARIA grid', async () => {
			freezeToday();
			const state = bound({ visibleMonth: 9, visibleYear: 2026 });
			await render(Calendar, withBound({}, state));
			await expect.element(page.getByRole('grid')).toBeInTheDocument();
			await userEvent.keyboard('{Tab}');
			await expect.element(day('2026-10-01')).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}{Enter}');
			expect(toISODate(state.selectedDate!)).toBe('2026-10-02');
		});

		test('the grid is one Tab stop, on the chosen day', async () => {
			await render(Calendar, { selectedDate: new Date(2026, 9, 14) });
			const stops = document.querySelectorAll('[role="gridcell"][tabindex="0"]');
			expect(stops).toHaveLength(1);
			expect((stops[0] as HTMLElement).dataset.date).toBe('2026-10-14');
			expect(document.querySelectorAll('[role="gridcell"][tabindex="-1"]')).toHaveLength(31 - 1);
			await userEvent.keyboard('{Tab}');
			await expect.element(day('2026-10-14')).toHaveFocus();
		});

		test('without a chosen day or today in view the Tab stop is the first of the month', async () => {
			freezeToday();
			await render(Calendar, { visibleMonth: 9, visibleYear: 2026 });
			await expect.element(day('2026-10-01')).toHaveAttribute('tabindex', '0');
		});

		test('arrows move by day and by week', async () => {
			await render(Calendar, { selectedDate: new Date(2026, 9, 14) });
			await userEvent.keyboard('{Tab}{ArrowRight}');
			await expect.element(day('2026-10-15')).toHaveFocus();
			await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
			await expect.element(day('2026-10-13')).toHaveFocus();
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(day('2026-10-20')).toHaveFocus();
			await userEvent.keyboard('{ArrowUp}{ArrowUp}');
			await expect.element(day('2026-10-06')).toHaveFocus();
			await expect.element(day('2026-10-06')).toHaveAttribute('tabindex', '0');
			await expect.element(day('2026-10-14')).toHaveAttribute('tabindex', '-1');
			await expect.element(day('2026-10-14')).toHaveAttribute('aria-selected', 'true');
		});

		test('Home and End go to the start and the end of the week of the locale', async () => {
			const english = await render(Calendar, { selectedDate: new Date(2026, 9, 14) });
			await userEvent.keyboard('{Tab}{Home}');
			await expect.element(day('2026-10-11')).toHaveFocus();
			await userEvent.keyboard('{End}');
			await expect.element(day('2026-10-17')).toHaveFocus();
			await english.unmount();
			await render(Calendar, { selectedDate: new Date(2026, 9, 14), locale: 'it' });
			await userEvent.keyboard('{Tab}{Home}');
			expect((document.activeElement as HTMLElement).dataset.date).toBe('2026-10-12');
			await userEvent.keyboard('{End}');
			expect((document.activeElement as HTMLElement).dataset.date).toBe('2026-10-18');
		});

		test('PageUp and PageDown change month, clamping the day; with Shift, year', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 31) });
			await render(Calendar, withBound({}, state));
			await userEvent.keyboard('{Tab}{PageDown}');
			await expect.element(day('2026-11-30')).toHaveFocus();
			await expect.element(page.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
			expect(state.visibleMonth).toBe(10);
			await userEvent.keyboard('{PageUp}{PageUp}');
			await expect.element(day('2026-09-30')).toHaveFocus();
			await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
			await expect.element(day('2027-09-30')).toHaveFocus();
			expect(state.visibleYear).toBe(2027);
			await userEvent.keyboard('{Shift>}{PageUp}{PageUp}{/Shift}');
			await expect.element(day('2025-09-30')).toHaveFocus();
			await expect.element(page.getByRole('grid', { name: 'September 2025' })).toBeInTheDocument();
			expect(toISODate(state.selectedDate!)).toBe('2026-10-31');
		});

		test('moving past the end of the month shows the next month', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 31) });
			const screen = await render(Calendar, withBound({}, state));
			await userEvent.keyboard('{Tab}{ArrowRight}');
			await expect.element(day('2026-11-01')).toHaveFocus();
			await expect.element(day('2026-11-01')).not.toHaveAttribute('data-outside');
			await expect.element(screen.getByRole('grid')).toHaveAttribute('aria-label', 'November 2026');
			await expect.element(screen.getByRole('grid')).toHaveAttribute('data-direction', 'next');
			expect(state.visibleMonth).toBe(10);
			await userEvent.keyboard('{ArrowUp}');
			await expect.element(day('2026-10-25')).toHaveFocus();
			await expect.element(screen.getByRole('grid')).toHaveAttribute('data-direction', 'previous');
		});

		test('Enter and Space choose the focused day and call the callbacks with the keyboard event', async () => {
			const state = bound({ selectedDate: new Date(2026, 9, 14) });
			const ondayClick = vi.fn();
			const onchange = vi.fn();
			await render(Calendar, withBound({ ondayClick, onchange }, state));
			await userEvent.keyboard('{Tab}{ArrowRight}{Enter}');
			expect(toISODate(state.selectedDate!)).toBe('2026-10-15');
			await userEvent.keyboard('{ArrowRight} ');
			expect(toISODate(state.selectedDate!)).toBe('2026-10-16');
			expect(onchange).toHaveBeenCalledTimes(2);
			expect(ondayClick).toHaveBeenCalledTimes(2);
			expect(ondayClick.mock.calls[1][0].nativeEvent).toBeInstanceOf(KeyboardEvent);
			expect(ondayClick.mock.calls[1][0].outside).toBe(false);
		});

		test('Space does not scroll the page', async () => {
			const spacer = document.createElement('div');
			spacer.style.height = '3000px';
			document.body.append(spacer);
			await render(Calendar, { selectedDate: new Date(2026, 9, 14) });
			await userEvent.keyboard('{Tab}');
			const scroll = window.scrollY;
			await userEvent.keyboard(' ');
			expect(window.scrollY).toBe(scroll);
			spacer.remove();
		});

		test('in a right-to-left page ArrowLeft goes to the next day', async () => {
			const container = document.createElement('div');
			container.dir = 'rtl';
			document.body.append(container);
			await render(Calendar, { target: container, props: { selectedDate: new Date(2026, 9, 14) } });
			await userEvent.keyboard('{Tab}{ArrowLeft}');
			await expect.element(day('2026-10-15')).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}{ArrowRight}');
			await expect.element(day('2026-10-13')).toHaveFocus();
			container.remove();
		});

		test('leaving the grid and coming back focuses the last focused day', async () => {
			const container = document.createElement('div');
			const after = document.createElement('button');
			after.textContent = 'After';
			document.body.append(container, after);
			await render(Calendar, { target: container, props: { selectedDate: new Date(2026, 9, 14) } });
			await userEvent.keyboard('{Tab}{ArrowDown}');
			await expect.element(day('2026-10-21')).toHaveFocus();
			await userEvent.keyboard('{Tab}');
			expect(document.activeElement).toBe(after);
			await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
			await expect.element(day('2026-10-21')).toHaveFocus();
			after.remove();
			container.remove();
		});

		test('an onkeydown that calls preventDefault stops the navigation', async () => {
			const onkeydown = vi.fn((event: KeyboardEvent) => {
				if (event.key === 'ArrowRight') event.preventDefault();
			});
			await render(Calendar, { selectedDate: new Date(2026, 9, 14), onkeydown });
			await userEvent.keyboard('{Tab}{ArrowRight}');
			expect(onkeydown).toHaveBeenCalled();
			await expect.element(day('2026-10-14')).toHaveFocus();
			await userEvent.keyboard('{ArrowLeft}');
			await expect.element(day('2026-10-13')).toHaveFocus();
		});

		test('focus() moves the focus to the Tab stop', async () => {
			const screen = await render(Calendar, { selectedDate: new Date(2026, 9, 14) });
			screen.component.focus();
			await expect.element(day('2026-10-14')).toHaveFocus();
		});
	});

	test('forwards native attributes to the grid and the class parts to their elements', async () => {
		let element: HTMLDivElement | undefined;
		const screen = await render(Calendar, {
			visibleMonth: 9,
			visibleYear: 2026,
			id: 'agenda',
			'data-testid': 'calendar',
			'aria-label': 'Delivery day',
			class: { container: 'app-grid', weekday: 'app-weekday', day: 'app-day' },
			get calendarElement() {
				return element;
			},
			set calendarElement(value) {
				element = value;
			}
		});
		const grid = screen.getByRole('grid', { name: 'Delivery day' });
		await expect.element(grid).toHaveAttribute('id', 'agenda');
		await expect.element(grid).toHaveClass('aurora-calendar', 'app-grid');
		expect(element).toBe(grid.element());
		expect(screen.container.querySelectorAll('.app-weekday')).toHaveLength(7);
		expect(screen.container.querySelectorAll('.app-day')).toHaveLength(42);
		expect(cell('2026-10-09').classList).toContain('aurora-calendar-day');
	});

	test('aria-labelledby replaces the default label', async () => {
		const heading = document.createElement('h2');
		heading.id = 'heading';
		heading.textContent = 'Pick a day';
		document.body.append(heading);
		const screen = await render(Calendar, { visibleMonth: 9, visibleYear: 2026, 'aria-labelledby': 'heading' });
		await expect.element(screen.getByRole('grid', { name: 'Pick a day' })).toBeInTheDocument();
		await expect.element(screen.getByRole('grid')).not.toHaveAttribute('aria-label');
		heading.remove();
	});

	test('instance CSS variables style the days', async () => {
		await render(Calendar, {
			selectedDate: new Date(2026, 9, 9),
			style: '--calendar-day-height: 50px; --calendar-selected-day-background: rgb(1, 2, 3); --calendar-selected-day-color: rgb(4, 5, 6)'
		});
		expect(getComputedStyle(cell('2026-10-14')).height).toBe('50px');
		const selected = cell('2026-10-09').querySelector('.aurora-calendar-day-content')!;
		expect(getComputedStyle(selected).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(selected).color).toBe('rgb(4, 5, 6)');
	});
});
