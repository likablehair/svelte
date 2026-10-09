import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import MonthSelector from '#lib/components/simple/dates/MonthSelector.svelte';

function month(name: string) {
	return page.getByRole('option', { name, exact: true });
}

function freezeToday() {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 8, 24, 10));
}

afterEach(() => {
	vi.useRealTimers();
});

function bound(initial: { month?: number }) {
	const state = $state(initial);
	return state;
}

function withSelected<T extends object>(props: T, state: { month?: number }) {
	return Object.defineProperty(props, 'selectedMonth', {
		enumerable: true,
		configurable: true,
		get: () => state.month,
		set: (value: number | undefined) => (state.month = value)
	}) as T & { selectedMonth?: number };
}

type ItemParams = {
	month: number;
	label: string;
	name: string;
	selected: boolean;
	current: boolean;
	disabled: boolean;
};

describe('MonthSelector', () => {
	test('renders a listbox of the twelve months with short names and full accessible names', async () => {
		const screen = await render(MonthSelector, { year: 2026 });
		await expect.element(screen.getByRole('listbox', { name: 'Month' })).toHaveClass('aurora-month-selector');
		const options = screen.getByRole('option').elements();
		expect(options).toHaveLength(12);
		expect(options.map((option) => option.textContent?.trim())).toEqual([
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		]);
		expect(options[0].getAttribute('aria-label')).toBe('January');
		expect(options.map((option) => option.dataset.month)).toEqual(
			Array.from({ length: 12 }, (_, index) => String(index))
		);
		await expect.element(month('September')).toHaveAttribute('aria-selected', 'false');
	});

	test('monthFormat="long" shows the full names', async () => {
		const screen = await render(MonthSelector, { year: 2026, monthFormat: 'long' });
		expect(screen.getByRole('option').elements()[8].textContent?.trim()).toBe('September');
	});

	test('the locale translates the names', async () => {
		const screen = await render(MonthSelector, { year: 2026, locale: 'it' });
		const options = screen.getByRole('option').elements();
		expect(options[0].textContent?.trim()).toBe('Gen');
		await expect.element(month('Gennaio')).toBeInTheDocument();
		await expect.element(month('Dicembre')).toBeInTheDocument();
	});

	test('selectedMonth marks its month with aria-selected and data-selected', async () => {
		const screen = await render(MonthSelector, { year: 2026, selectedMonth: 3 });
		await expect.element(month('April')).toHaveAttribute('aria-selected', 'true');
		await expect.element(month('April')).toHaveAttribute('data-selected');
		expect(screen.container.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
		await screen.rerender({ selectedMonth: 10 });
		await expect.element(month('November')).toHaveAttribute('aria-selected', 'true');
		await expect.element(month('April')).toHaveAttribute('aria-selected', 'false');
	});

	test('a click chooses the month and calls onchange with { month }', async () => {
		const state = bound({ month: 3 });
		const onchange = vi.fn();
		await render(MonthSelector, withSelected({ year: 2026, onchange }, state));
		await month('July').click();
		expect(state.month).toBe(6);
		await expect.element(month('July')).toHaveAttribute('aria-selected', 'true');
		await expect.element(month('April')).toHaveAttribute('aria-selected', 'false');
		expect(onchange).toHaveBeenCalledExactlyOnceWith({ month: 6 });
	});

	test('the current month has data-current and aria-current, only in the current year', async () => {
		freezeToday();
		const current = await render(MonthSelector, { year: 2026 });
		await expect.element(month('September')).toHaveAttribute('aria-current', 'date');
		await expect.element(month('September')).toHaveAttribute('data-current');
		expect(current.container.querySelectorAll('[data-current]')).toHaveLength(1);
		await current.unmount();
		const other = await render(MonthSelector, { year: 2025 });
		await expect.element(month('September')).not.toHaveAttribute('aria-current');
		expect(other.container.querySelectorAll('[data-current]')).toHaveLength(0);
	});

	test('year defaults to the current year', async () => {
		freezeToday();
		await render(MonthSelector, { max: new Date(2026, 9, 15) });
		await expect.element(month('September')).toHaveAttribute('aria-current', 'date');
		await expect.element(month('November')).toHaveAttribute('aria-disabled', 'true');
	});

	test('min and max disable the whole months outside them', async () => {
		const state = bound({});
		const onchange = vi.fn();
		await render(
			MonthSelector,
			withSelected({ year: 2026, min: new Date(2026, 2, 31), max: new Date(2026, 9, 1), onchange }, state)
		);
		await expect.element(month('February')).toHaveAttribute('aria-disabled', 'true');
		await expect.element(month('February')).toHaveAttribute('data-disabled');
		await expect.element(month('March')).not.toHaveAttribute('aria-disabled');
		await expect.element(month('October')).not.toHaveAttribute('aria-disabled');
		await expect.element(month('November')).toHaveAttribute('aria-disabled', 'true');
		await month('February').click({ force: true });
		await month('December').click({ force: true });
		expect(state.month).toBeUndefined();
		expect(onchange).not.toHaveBeenCalled();
	});

	test('min and max of other years disable all the months or none', async () => {
		const before = await render(MonthSelector, { year: 2025, min: new Date(2026, 0, 1) });
		expect(before.container.querySelectorAll('[aria-disabled="true"]')).toHaveLength(12);
		await before.unmount();
		const after = await render(MonthSelector, { year: 2027, min: new Date(2026, 0, 1) });
		expect(after.container.querySelectorAll('[aria-disabled="true"]')).toHaveLength(0);
	});

	test('min and max with a time of day still allow their own month', async () => {
		await render(MonthSelector, {
			year: 2026,
			min: new Date(2026, 2, 31, 23, 59),
			max: new Date(2026, 9, 1, 0, 0, 1)
		});
		await expect.element(month('March')).not.toHaveAttribute('aria-disabled');
		await expect.element(month('October')).not.toHaveAttribute('aria-disabled');
	});

	test('disabled shows the months without letting anyone choose them, out of the Tab order', async () => {
		const state = bound({ month: 3 });
		const onchange = vi.fn();
		const screen = await render(MonthSelector, withSelected({ year: 2026, disabled: true, onchange }, state));
		const list = screen.getByRole('listbox');
		await expect.element(list).toHaveAttribute('aria-disabled', 'true');
		await expect.element(list).toHaveAttribute('data-disabled');
		expect(screen.container.querySelectorAll('[tabindex]')).toHaveLength(0);
		await month('July').click({ force: true });
		expect(state.month).toBe(3);
		expect(onchange).not.toHaveBeenCalled();
	});

	test('v4 bug: itemSnippet replaces the name and the month can still be chosen', async () => {
		const itemSnippet = createRawSnippet((params: () => ItemParams) => ({
			render: () => `<b class="custom" title="${params().name}"></b>`,
			setup: (node) => {
				$effect(() => {
					const { month, label, selected, current, disabled } = params();
					node.textContent = `${month}:${label}${selected ? '*' : ''}${current ? 'C' : ''}${disabled ? 'D' : ''}`;
				});
			}
		}));
		freezeToday();
		const state = bound({ month: 3 });
		const screen = await render(
			MonthSelector,
			withSelected({ year: 2026, itemSnippet, max: new Date(2026, 10, 1) }, state)
		);
		const items = [...screen.container.querySelectorAll<HTMLElement>('.custom')];
		expect(items.map((item) => item.textContent)).toEqual([
			'0:Jan',
			'1:Feb',
			'2:Mar',
			'3:Apr*',
			'4:May',
			'5:Jun',
			'6:Jul',
			'7:Aug',
			'8:SepC',
			'9:Oct',
			'10:Nov',
			'11:DecD'
		]);
		expect(items[0].title).toBe('January');
		await expect.element(month('July')).toBeInTheDocument();
		items[6].click();
		expect(state.month).toBe(6);
		await expect.poll(() => items[6].textContent).toBe('6:Jul*');
		expect(items[3].textContent).toBe('3:Apr');
	});

	describe('keyboard', () => {
		test('is one Tab stop: the chosen month, else the current one, else the first enabled', async () => {
			freezeToday();
			const chosen = await render(MonthSelector, { year: 2026, selectedMonth: 4 });
			expect(chosen.container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
			expect(chosen.container.querySelectorAll('[tabindex="-1"]')).toHaveLength(11);
			await userEvent.keyboard('{Tab}');
			await expect.element(month('May')).toHaveFocus();
			await chosen.unmount();

			const current = await render(MonthSelector, { year: 2026 });
			await expect.element(month('September')).toHaveAttribute('tabindex', '0');
			await current.unmount();

			await render(MonthSelector, { year: 2025, min: new Date(2025, 2, 1) });
			await expect.element(month('March')).toHaveAttribute('tabindex', '0');
		});

		test('arrows move in the grid of 3 columns and stop at the ends', async () => {
			await render(MonthSelector, { year: 2026, selectedMonth: 4 });
			await userEvent.keyboard('{Tab}{ArrowRight}');
			await expect.element(month('June')).toHaveFocus();
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(month('September')).toHaveFocus();
			await userEvent.keyboard('{ArrowLeft}');
			await expect.element(month('August')).toHaveFocus();
			await userEvent.keyboard('{ArrowUp}{ArrowUp}');
			await expect.element(month('February')).toHaveFocus();
			await userEvent.keyboard('{ArrowUp}');
			await expect.element(month('January')).toHaveFocus();
			await expect.element(month('January')).toHaveAttribute('tabindex', '0');
			await expect.element(month('May')).toHaveAttribute('tabindex', '-1');
			await expect.element(month('May')).toHaveAttribute('aria-selected', 'true');
		});

		test('Home and End go to the first and the last month', async () => {
			await render(MonthSelector, { year: 2026, selectedMonth: 4 });
			await userEvent.keyboard('{Tab}{End}');
			await expect.element(month('December')).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}');
			await expect.element(month('December')).toHaveFocus();
			await userEvent.keyboard('{Home}');
			await expect.element(month('January')).toHaveFocus();
		});

		test('Enter and Space choose the focused month', async () => {
			const state = bound({ month: 4 });
			const onchange = vi.fn();
			await render(MonthSelector, withSelected({ year: 2026, onchange }, state));
			await userEvent.keyboard('{Tab}{ArrowRight}{Enter}');
			expect(state.month).toBe(5);
			await userEvent.keyboard('{ArrowRight} ');
			expect(state.month).toBe(6);
			expect(onchange).toHaveBeenCalledTimes(2);
			expect(onchange).toHaveBeenLastCalledWith({ month: 6 });
		});

		test('the keyboard reaches disabled months but cannot choose them', async () => {
			const state = bound({ month: 9 });
			await render(MonthSelector, withSelected({ year: 2026, max: new Date(2026, 9, 15) }, state));
			await userEvent.keyboard('{Tab}{ArrowRight}');
			await expect.element(month('November')).toHaveFocus();
			await userEvent.keyboard('{Enter}');
			expect(state.month).toBe(9);
		});

		test('the arrows follow the number of columns set in CSS', async () => {
			await render(MonthSelector, { year: 2026, selectedMonth: 0, style: '--month-selector-columns: 4' });
			await userEvent.keyboard('{Tab}{ArrowDown}');
			await expect.element(month('May')).toHaveFocus();
		});

		test('in a right-to-left page ArrowLeft goes to the next month', async () => {
			const container = document.createElement('div');
			container.dir = 'rtl';
			document.body.append(container);
			await render(MonthSelector, { target: container, props: { year: 2026, selectedMonth: 4 } });
			await userEvent.keyboard('{Tab}{ArrowLeft}');
			await expect.element(month('June')).toHaveFocus();
			container.remove();
		});

		test('leaving the list and coming back focuses the last focused month', async () => {
			const container = document.createElement('div');
			const after = document.createElement('button');
			after.textContent = 'After';
			document.body.append(container, after);
			await render(MonthSelector, { target: container, props: { year: 2026, selectedMonth: 4 } });
			await userEvent.keyboard('{Tab}{ArrowDown}{Tab}');
			expect(document.activeElement).toBe(after);
			await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
			await expect.element(month('August')).toHaveFocus();
			after.remove();
			container.remove();
		});

		test('focus() moves the focus to the Tab stop', async () => {
			const screen = await render(MonthSelector, { year: 2026, selectedMonth: 10 });
			screen.component.focus();
			await expect.element(month('November')).toHaveFocus();
		});
	});

	test('forwards native attributes to the listbox and the class parts to their elements', async () => {
		let element: HTMLDivElement | undefined;
		const screen = await render(MonthSelector, {
			year: 2026,
			id: 'months',
			'aria-label': 'Billing month',
			class: { container: 'app-list', month: 'app-month' },
			get monthSelectorElement() {
				return element;
			},
			set monthSelectorElement(value) {
				element = value;
			}
		});
		const list = screen.getByRole('listbox', { name: 'Billing month' });
		await expect.element(list).toHaveAttribute('id', 'months');
		await expect.element(list).toHaveClass('aurora-month-selector', 'app-list');
		expect(element).toBe(list.element());
		expect(screen.container.querySelectorAll('.app-month')).toHaveLength(12);
	});

	test('aria-labelledby replaces the default label', async () => {
		const heading = document.createElement('h2');
		heading.id = 'month-heading';
		heading.textContent = '2026';
		document.body.append(heading);
		const screen = await render(MonthSelector, { year: 2026, 'aria-labelledby': 'month-heading' });
		await expect.element(screen.getByRole('listbox', { name: '2026' })).not.toHaveAttribute('aria-label');
		heading.remove();
	});

	test('instance CSS variables style the months', async () => {
		await render(MonthSelector, {
			year: 2026,
			selectedMonth: 2,
			style: '--month-selector-selected-background: rgb(1, 2, 3); --month-selector-color: rgb(4, 5, 6); --month-selector-gap: 20px'
		});
		expect(getComputedStyle(month('March').element()).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(month('April').element()).color).toBe('rgb(4, 5, 6)');
		expect(getComputedStyle(page.getByRole('listbox').element()).rowGap).toBe('20px');
	});
});
