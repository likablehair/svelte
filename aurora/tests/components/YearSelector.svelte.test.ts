import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import YearSelector from '#lib/components/simple/dates/YearSelector.svelte';

function year(value: number) {
	return page.getByRole('option', { name: String(value), exact: true });
}

function freezeToday() {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 8, 24, 10));
}

afterEach(() => {
	vi.useRealTimers();
});

function bound(initial: { year?: number }) {
	const state = $state(initial);
	return state;
}

function withSelected<T extends object>(props: T, state: { year?: number }) {
	return Object.defineProperty(props, 'selectedYear', {
		enumerable: true,
		configurable: true,
		get: () => state.year,
		set: (value: number | undefined) => (state.year = value)
	}) as T & { selectedYear?: number };
}

function isInside(element: Element, list: Element) {
	const item = element.getBoundingClientRect();
	const box = list.getBoundingClientRect();
	return item.top >= box.top - 1 && item.bottom <= box.bottom + 1;
}

describe('YearSelector', () => {
	test('renders a listbox of the years from 1900 to 2100 by default', async () => {
		const screen = await render(YearSelector, {});
		await expect.element(screen.getByRole('listbox', { name: 'Year' })).toHaveClass('aurora-year-selector');
		const options = screen.getByRole('option').elements();
		expect(options).toHaveLength(201);
		expect(options[0].textContent?.trim()).toBe('1900');
		expect(options.at(-1)?.textContent?.trim()).toBe('2100');
	});

	test('min and max set the first and the last year, in either order', async () => {
		const screen = await render(YearSelector, { min: 2020, max: 2030 });
		expect(screen.getByRole('option').elements().map((option) => Number(option.dataset.year))).toEqual(
			Array.from({ length: 11 }, (_, index) => 2020 + index)
		);
		await screen.unmount();
		const reversed = await render(YearSelector, { min: 2030, max: 2020 });
		const options = reversed.getByRole('option').elements();
		expect(options).toHaveLength(11);
		expect(options[0].dataset.year).toBe('2020');
	});

	test('selectedYear marks its year with aria-selected and data-selected', async () => {
		const screen = await render(YearSelector, { selectedYear: 2026 });
		await expect.element(year(2026)).toHaveAttribute('aria-selected', 'true');
		await expect.element(year(2026)).toHaveAttribute('data-selected');
		await expect.element(year(2025)).toHaveAttribute('aria-selected', 'false');
		expect(screen.container.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
	});

	test('a click chooses the year and calls onchange with { year }', async () => {
		const state = bound({ year: 2026 });
		const onchange = vi.fn();
		await render(YearSelector, withSelected({ min: 2020, max: 2030, onchange }, state));
		await year(2028).click();
		expect(state.year).toBe(2028);
		await expect.element(year(2028)).toHaveAttribute('aria-selected', 'true');
		await expect.element(year(2026)).toHaveAttribute('aria-selected', 'false');
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ year: 2028 });
	});

	test('v4 bug: clicking the chosen year again keeps it', async () => {
		const state = bound({ year: 2026 });
		const onchange = vi.fn();
		await render(YearSelector, withSelected({ min: 2020, max: 2030, onchange }, state));
		await year(2026).click();
		expect(state.year).toBe(2026);
		await expect.element(year(2026)).toHaveAttribute('aria-selected', 'true');
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ year: 2026 });
	});

	test('the current year has data-current and aria-current', async () => {
		freezeToday();
		const screen = await render(YearSelector, { min: 2020, max: 2030 });
		await expect.element(year(2026)).toHaveAttribute('aria-current', 'date');
		await expect.element(year(2026)).toHaveAttribute('data-current');
		expect(screen.container.querySelectorAll('[data-current]')).toHaveLength(1);
	});

	test('scrolls to the chosen year when it appears', async () => {
		const screen = await render(YearSelector, { selectedYear: 2050 });
		const list = screen.getByRole('listbox').element();
		expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
		await expect.poll(() => list.scrollTop).toBeGreaterThan(0);
		await expect.poll(() => isInside(year(2050).element(), list)).toBe(true);
	});

	test('without a chosen year scrolls to the current one', async () => {
		freezeToday();
		const screen = await render(YearSelector, {});
		const list = screen.getByRole('listbox').element();
		await expect.poll(() => list.scrollTop).toBeGreaterThan(0);
		await expect.poll(() => isInside(year(2026).element(), list)).toBe(true);
	});

	test('disabled shows the years without letting anyone choose them, out of the Tab order', async () => {
		const state = bound({ year: 2026 });
		const onchange = vi.fn();
		const before = document.createElement('button');
		before.textContent = 'Before';
		const after = document.createElement('button');
		after.textContent = 'After';
		const container = document.createElement('div');
		document.body.append(before, container, after);
		const screen = await render(YearSelector, {
			target: container,
			props: withSelected({ min: 2020, max: 2030, disabled: true, onchange }, state)
		});
		const list = screen.getByRole('listbox');
		await expect.element(list).toHaveAttribute('aria-disabled', 'true');
		await expect.element(list).toHaveAttribute('data-disabled');
		expect(screen.container.querySelectorAll('[role="option"][tabindex]')).toHaveLength(0);
		await year(2028).click({ force: true });
		expect(state.year).toBe(2026);
		expect(onchange).not.toHaveBeenCalled();
		before.focus();
		await userEvent.keyboard('{Tab}');
		expect(document.activeElement).toBe(after);
		before.remove();
		after.remove();
	});

	test('itemSnippet replaces the number and the year can still be chosen', async () => {
		freezeToday();
		const itemSnippet = createRawSnippet((params: () => { year: number; selected: boolean; current: boolean }) => ({
			render: () => '<b class="custom"></b>',
			setup: (node) => {
				$effect(() => {
					const { year, selected, current } = params();
					node.textContent = `${year}${selected ? '*' : ''}${current ? 'C' : ''}`;
				});
			}
		}));
		const state = bound({ year: 2024 });
		const screen = await render(YearSelector, withSelected({ min: 2023, max: 2027, itemSnippet }, state));
		const items = [...screen.container.querySelectorAll<HTMLElement>('.custom')];
		expect(items.map((item) => item.textContent)).toEqual(['2023', '2024*', '2025', '2026C', '2027']);
		items[4].click();
		expect(state.year).toBe(2027);
		await expect.poll(() => items[4].textContent).toBe('2027*');
	});

	describe('keyboard', () => {
		test('is one Tab stop: the chosen year, else the current one, else the first', async () => {
			freezeToday();
			const chosen = await render(YearSelector, { min: 2020, max: 2030, selectedYear: 2022 });
			expect(chosen.container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
			await userEvent.keyboard('{Tab}');
			await expect.element(year(2022)).toHaveFocus();
			await chosen.unmount();

			const current = await render(YearSelector, { min: 2020, max: 2030 });
			await expect.element(year(2026)).toHaveAttribute('tabindex', '0');
			await current.unmount();

			await render(YearSelector, { min: 2000, max: 2010, selectedYear: 2050 });
			await expect.element(year(2000)).toHaveAttribute('tabindex', '0');
		});

		test('the scrolling list itself is not a Tab stop (Firefox focuses scroll containers)', async () => {
			const container = document.createElement('div');
			const after = document.createElement('button');
			after.textContent = 'After';
			document.body.append(container, after);
			const screen = await render(YearSelector, { target: container, props: { selectedYear: 2026 } });
			const list = screen.getByRole('listbox').element();
			expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
			await userEvent.keyboard('{Tab}');
			await expect.element(year(2026)).toHaveFocus();
			await userEvent.keyboard('{Tab}');
			expect(document.activeElement).toBe(after);
			await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
			await expect.element(year(2026)).toHaveFocus();
			after.remove();
			container.remove();
		});

		test('arrows move in the grid of 4 columns, Page Up and Page Down by 3 rows', async () => {
			await render(YearSelector, { selectedYear: 2026 });
			await userEvent.keyboard('{Tab}{ArrowRight}');
			await expect.element(year(2027)).toHaveFocus();
			await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
			await expect.element(year(2025)).toHaveFocus();
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(year(2029)).toHaveFocus();
			await userEvent.keyboard('{ArrowUp}{ArrowUp}');
			await expect.element(year(2021)).toHaveFocus();
			await userEvent.keyboard('{PageDown}');
			await expect.element(year(2033)).toHaveFocus();
			await userEvent.keyboard('{PageUp}{PageUp}');
			await expect.element(year(2009)).toHaveFocus();
			await expect.element(year(2009)).toHaveAttribute('tabindex', '0');
			await expect.element(year(2026)).toHaveAttribute('aria-selected', 'true');
		});

		test('Home and End go to the first and the last year; moves stop at the ends', async () => {
			await render(YearSelector, { min: 2020, max: 2030, selectedYear: 2026 });
			await userEvent.keyboard('{Tab}{End}');
			await expect.element(year(2030)).toHaveFocus();
			await userEvent.keyboard('{PageDown}');
			await expect.element(year(2030)).toHaveFocus();
			await userEvent.keyboard('{Home}');
			await expect.element(year(2020)).toHaveFocus();
			await userEvent.keyboard('{ArrowUp}');
			await expect.element(year(2020)).toHaveFocus();
		});

		test('the focused year is scrolled into view', async () => {
			const screen = await render(YearSelector, { selectedYear: 2026 });
			const list = screen.getByRole('listbox').element();
			await userEvent.keyboard('{Tab}{End}');
			await expect.element(year(2100)).toHaveFocus();
			await expect.poll(() => isInside(year(2100).element(), list)).toBe(true);
		});

		test('Enter and Space choose the focused year', async () => {
			const state = bound({ year: 2026 });
			const onchange = vi.fn();
			await render(YearSelector, withSelected({ onchange }, state));
			await userEvent.keyboard('{Tab}{ArrowRight}{Enter}');
			expect(state.year).toBe(2027);
			await userEvent.keyboard('{ArrowDown} ');
			expect(state.year).toBe(2031);
			expect(onchange).toHaveBeenCalledTimes(2);
			expect(onchange).toHaveBeenLastCalledWith({ year: 2031 });
		});

		test('in a right-to-left page ArrowLeft goes to the next year', async () => {
			const container = document.createElement('div');
			container.dir = 'rtl';
			document.body.append(container);
			await render(YearSelector, { target: container, props: { selectedYear: 2026 } });
			await userEvent.keyboard('{Tab}{ArrowLeft}');
			await expect.element(year(2027)).toHaveFocus();
			container.remove();
		});

		test('focus() moves the focus to the Tab stop', async () => {
			const screen = await render(YearSelector, { selectedYear: 1950 });
			screen.component.focus();
			await expect.element(year(1950)).toHaveFocus();
		});
	});

	test('forwards native attributes to the listbox and the class parts to their elements', async () => {
		let element: HTMLDivElement | undefined;
		const screen = await render(YearSelector, {
			min: 2020,
			max: 2023,
			id: 'years',
			'aria-label': 'Fiscal year',
			class: { container: 'app-list', year: 'app-year' },
			get yearSelectorElement() {
				return element;
			},
			set yearSelectorElement(value) {
				element = value;
			}
		});
		const list = screen.getByRole('listbox', { name: 'Fiscal year' });
		await expect.element(list).toHaveAttribute('id', 'years');
		await expect.element(list).toHaveClass('aurora-year-selector', 'app-list');
		expect(element).toBe(list.element());
		expect(screen.container.querySelectorAll('.app-year')).toHaveLength(4);
	});

	test('instance CSS variables style the grid', async () => {
		await render(YearSelector, {
			min: 2020,
			max: 2030,
			selectedYear: 2022,
			style: '--year-selector-max-height: 80px; --year-selector-selected-background: rgb(1, 2, 3); --year-selector-columns: 2'
		});
		const list = page.getByRole('listbox').element();
		expect(list.getBoundingClientRect().height).toBe(80);
		expect(getComputedStyle(year(2022).element()).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(list).gridTemplateColumns.split(' ')).toHaveLength(2);
	});
});
