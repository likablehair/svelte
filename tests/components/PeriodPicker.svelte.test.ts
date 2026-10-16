import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import PeriodPicker from '#lib/components/composed/forms/PeriodPicker.svelte';
import type { TimespanSettings } from '#lib/utils/period.js';
import { renderWithDefaultLocale } from '../helpers.js';

function bound(initial: TimespanSettings | undefined, others: Record<string, unknown> = {}) {
	const state = $state({ value: initial });
	const props = Object.defineProperty({ ...others }, 'timespanSettings', {
		get: () => state.value,
		set: (next: TimespanSettings | undefined) => {
			state.value = next;
		},
		enumerable: true,
		configurable: true
	});
	return { state, props };
}

const plain = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ').trim();
const dayCell = (iso: string) => document.querySelector<HTMLElement>(`.aurora-period-selector [data-date="${iso}"]`)!;

beforeEach(async () => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 8, 24, 10));
	document.documentElement.style.setProperty('--menu-duration', '0s');
	document.documentElement.style.setProperty('--drawer-duration', '0s');
	await page.viewport(1280, 800);
});

afterEach(() => {
	vi.useRealTimers();
	document.documentElement.style.removeProperty('--menu-duration');
	document.documentElement.style.removeProperty('--drawer-duration');
});

describe('PeriodPicker', () => {
	test('the field shows the name of the period and its days, and opens a dialog', async () => {
		const screen = await render(PeriodPicker, { timespanSettings: { method: 'quick', values: 'this-month' } });
		const button = screen.getByRole('button', { name: /This month/ });
		await expect.element(button).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');
		await expect.poll(() => plain(button.element().textContent)).toContain('Sep 1 – 30, 2026');
		await button.click();
		await expect.element(button).toHaveAttribute('aria-expanded', 'true');
		await expect.element(page.getByRole('dialog', { name: 'Choose period' })).toBeVisible();
		await expect.element(page.getByRole('option', { name: /This month/ })).toHaveAttribute('aria-selected', 'true');
	});

	test('without a value the field shows the placeholder', async () => {
		const screen = await render(PeriodPicker, { placeholder: 'Any time' });
		await expect.element(screen.getByRole('button', { name: 'Any time' })).toBeInTheDocument();
		expect(screen.container.querySelector('.aurora-period-picker')?.hasAttribute('data-empty')).toBe(true);
	});

	test('a preset applies at once and closes the menu', async () => {
		const onchange = vi.fn();
		const { state, props } = bound({ method: 'quick', values: 'this-month' }, { onchange });
		const screen = await render(PeriodPicker, props);
		await screen.getByRole('button', { name: /This month/ }).click();
		await page.getByRole('option', { name: /Last 3 months/ }).click();
		expect(state.value).toEqual({ method: 'quick', values: 'last-3month' });
		expect(onchange).toHaveBeenCalledTimes(1);
		const { from, to } = onchange.mock.calls[0][0];
		expect([from.toDateString(), to.toDateString()]).toEqual([
			new Date(2026, 5, 25).toDateString(),
			new Date(2026, 8, 24).toDateString()
		]);
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	test('a custom range is a draft until Apply', async () => {
		const onchange = vi.fn();
		const { state, props } = bound({ method: 'quick', values: 'this-month' }, { onchange });
		const screen = await render(PeriodPicker, props);
		await screen.getByRole('button', { name: /This month/ }).click();
		dayCell('2026-09-10').click();
		dayCell('2026-09-23').click();
		await expect.element(page.getByRole('listbox').getByRole('option', { selected: true })).not.toBeInTheDocument();
		await expect.poll(() => plain(document.querySelector('.aurora-period-selector-duration')?.textContent)).toBe('14 days');
		expect(state.value).toEqual({ method: 'quick', values: 'this-month' });
		expect(onchange).not.toHaveBeenCalled();
		await page.getByRole('button', { name: 'Apply' }).click();
		expect(state.value?.method).toBe('picker');
		expect(onchange).toHaveBeenCalledTimes(1);
		expect(onchange.mock.calls[0][0].from.toDateString()).toBe(new Date(2026, 8, 10).toDateString());
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect.poll(() => plain(screen.container.querySelector('.aurora-period-picker-label')?.textContent)).toBe('Sep 10 – 23, 2026');
		expect(screen.container.querySelector('.aurora-period-picker-dates')).toBeNull();
	});

	test('Cancel, Escape and a click outside discard the draft', async () => {
		const { state, props } = bound({ method: 'quick', values: 'this-month' });
		const screen = await render(PeriodPicker, props);
		const button = screen.getByRole('button', { name: /This month/ });
		await button.click();
		dayCell('2026-09-10').click();
		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		expect(state.value).toEqual({ method: 'quick', values: 'this-month' });

		await button.click();
		await expect.element(page.getByRole('option', { name: /This month/ })).toHaveAttribute('aria-selected', 'true');
		await page.getByRole('option', { name: 'Relative period' }).click();
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		expect(state.value).toEqual({ method: 'quick', values: 'this-month' });
	});

	test('v4 bug: Escape closes the menu even with an incomplete draft', async () => {
		const screen = await render(PeriodPicker, {});
		await screen.getByRole('button', { name: 'Select a period' }).click();
		await expect.element(page.getByRole('button', { name: 'Apply' })).toBeDisabled();
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	test('the arrows move a whole month by one month and other ranges by their length', async () => {
		const onchange = vi.fn();
		const { state, props } = bound({ method: 'quick', values: 'this-month' }, { onchange });
		const screen = await render(PeriodPicker, props);
		await screen.getByRole('button', { name: 'Previous period' }).click();
		const values = () => state.value?.values as { from: Date; to: Date };
		expect(state.value?.method).toBe('picker');
		expect([values().from.toDateString(), values().to.toDateString()]).toEqual([
			new Date(2026, 7, 1).toDateString(),
			new Date(2026, 7, 31).toDateString()
		]);
		state.value = { method: 'picker', values: { from: new Date(2026, 8, 10), to: new Date(2026, 8, 23) } };
		await screen.getByRole('button', { name: 'Next period' }).click();
		expect([values().from.toDateString(), values().to.toDateString()]).toEqual([
			new Date(2026, 8, 24).toDateString(),
			new Date(2026, 9, 7).toDateString()
		]);
		expect(onchange).toHaveBeenCalledTimes(2);
	});

	test('arrows that land on the days of a preset go back to it', async () => {
		const { state, props } = bound({ method: 'quick', values: 'this-year' });
		const screen = await render(PeriodPicker, props);
		await screen.getByRole('button', { name: 'Previous period' }).click();
		await expect.element(screen.getByRole('button', { name: '2025' })).toBeInTheDocument();
		expect(state.value?.method).toBe('picker');
		await screen.getByRole('button', { name: 'Next period' }).click();
		expect(state.value).toEqual({ method: 'quick', values: 'this-year' });
		await expect.element(screen.getByRole('button', { name: /This year/ })).toBeInTheDocument();
	});

	test('after a move a whole month is named after its dates, and the arrows stay in place', async () => {
		const { props } = bound({ method: 'quick', values: 'this-month' });
		const screen = await render(PeriodPicker, props);
		const previous = screen.getByRole('button', { name: 'Previous period' });
		const left = previous.element().getBoundingClientRect().left;
		await previous.click();
		await expect.element(screen.getByRole('button', { name: 'August 2026' })).toBeInTheDocument();
		expect(screen.container.querySelector('.aurora-period-picker-dates')).toBeNull();
		await previous.click();
		await expect.element(screen.getByRole('button', { name: 'July 2026' })).toBeInTheDocument();
		expect(previous.element().getBoundingClientRect().left).toBe(left);
		expect(screen.getByRole('button', { name: 'Next period' }).element().getBoundingClientRect().left).toBeLessThan(
			screen.getByRole('button', { name: 'July 2026' }).element().getBoundingClientRect().left
		);
	});

	test('the field is at least --period-picker-min-width wide, and one month is shown unless months={2}', async () => {
		const screen = await render(PeriodPicker, { timespanSettings: { method: 'quick', values: 'today' } });
		expect(screen.container.querySelector('.aurora-period-picker')!.getBoundingClientRect().width).toBeGreaterThanOrEqual(300);
		await screen.getByRole('button', { name: /Today/ }).click();
		await expect.poll(() => document.querySelectorAll('.aurora-period-selector .aurora-calendar').length).toBe(1);
		await userEvent.keyboard('{Escape}');
		screen.unmount();
		const two = await render(PeriodPicker, { timespanSettings: { method: 'quick', values: 'today' }, months: 2 });
		await two.getByRole('button', { name: /Today/ }).click();
		await expect.poll(() => document.querySelectorAll('.aurora-period-selector .aurora-calendar').length).toBe(2);
	});

	test('the arrows are off for all time and hidden with shiftable={false}', async () => {
		const screen = await render(PeriodPicker, { timespanSettings: { method: 'quick', values: 'total' } });
		await expect.element(screen.getByRole('button', { name: 'Previous period' })).toBeDisabled();
		screen.unmount();
		const hidden = await render(PeriodPicker, {
			timespanSettings: { method: 'quick', values: 'today' },
			shiftable: false
		});
		await expect.element(hidden.getByRole('button', { name: /Today/ })).toBeInTheDocument();
		expect(hidden.container.querySelector('.aurora-period-picker-shift')).toBeNull();
	});

	test('a relative period is edited with direction, number and unit, and keeps the backend meaning', async () => {
		const onchange = vi.fn();
		const { state, props } = bound(undefined, { onchange });
		const screen = await render(PeriodPicker, props);
		await screen.getByRole('button', { name: 'Select a period' }).click();
		await page.getByRole('option', { name: 'Relative period' }).click();
		await page.getByRole('spinbutton', { name: 'How many' }).fill('3');
		await page.getByRole('combobox', { name: 'Unit' }).selectOptions('months');
		await expect.poll(() => document.querySelector('.aurora-period-selector-rolling-summary')?.textContent).toBe('Last 3 months');
		await page.getByRole('button', { name: 'Apply' }).click();
		expect(state.value).toEqual({
			method: 'rolling',
			values: { numberOfUnits: 3, measurementUnit: 'months', direction: 'last' }
		});
		expect(onchange.mock.calls[0][0].from.toDateString()).toBe(new Date(2026, 5, 25).toDateString());
		await expect.element(screen.getByRole('button', { name: /Last 3 months/ })).toBeInTheDocument();
	});

	test('the start and end can be typed with the mask of the locale', async () => {
		const { state, props } = bound({ method: 'quick', values: 'this-month' }, { locale: 'it' });
		const screen = await render(PeriodPicker, props);
		await screen.getByRole('button', { name: /Questo mese/ }).click();
		const start = page.getByRole('textbox', { name: 'Inizio' });
		await start.fill('');
		await userEvent.type(start, '05092026{Enter}');
		await expect.element(start).toHaveValue('05/09/2026');
		await expect.element(page.getByRole('listbox').getByRole('option', { selected: true })).not.toBeInTheDocument();
		await page.getByRole('button', { name: 'Applica' }).click();
		expect((state.value?.values as { from: Date }).from.toDateString()).toBe(new Date(2026, 8, 5).toDateString());
	});

	test('an invalid typed date marks the field and changes nothing', async () => {
		const screen = await render(PeriodPicker, { timespanSettings: { method: 'quick', values: 'this-month' } });
		await screen.getByRole('button', { name: /This month/ }).click();
		const end = page.getByRole('textbox', { name: 'End' });
		await end.fill('');
		await userEvent.type(end, '13452026{Enter}');
		await expect.element(end).toHaveAttribute('aria-invalid', 'true');
		await expect.element(page.getByRole('option', { name: /This month/ })).toHaveAttribute('aria-selected', 'true');
	});

	test('keyboard: the presets are a listbox moved with the arrows and chosen with Enter', async () => {
		const { state, props } = bound({ method: 'quick', values: 'today' });
		const screen = await render(PeriodPicker, props);
		await screen.getByRole('button', { name: /Today/ }).click();
		const list = page.getByRole('listbox', { name: 'Periods' });
		list.element().focus();
		await expect.element(list).toHaveAttribute('aria-activedescendant', page.getByRole('option', { name: /Today/ }).element().id);
		await userEvent.keyboard('{ArrowDown}{Enter}');
		expect(state.value).toEqual({ method: 'quick', values: 'this-week' });
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	test('on screens up to 1024px wide it opens a bottom drawer with the compact panel', async () => {
		await page.viewport(800, 700);
		const screen = await render(PeriodPicker, { timespanSettings: { method: 'quick', values: 'this-month' } });
		await screen.getByRole('button', { name: /This month/ }).click();
		await expect.poll(() => document.querySelector('.aurora-menu-or-drawer-drawer')).not.toBeNull();
		await expect.poll(() => document.querySelector('.aurora-period-selector')?.hasAttribute('data-compact')).toBe(true);
		expect(document.querySelectorAll('.aurora-period-selector .aurora-calendar').length).toBe(1);
	});

	test('texts follow locale and the default locale; text props win', async () => {
		const screen = await render(PeriodPicker, {
			locale: 'it',
			timespanSettings: { method: 'quick', values: 'this-year' },
			nextLabel: 'Avanti'
		});
		await expect.element(screen.getByRole('button', { name: /Quest'anno/ })).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Periodo precedente' })).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Avanti' })).toBeInTheDocument();
		screen.unmount();
		const inherited = await renderWithDefaultLocale('it', PeriodPicker, {});
		await expect.element(inherited.getByRole('button', { name: 'Seleziona un periodo' })).toBeInTheDocument();
	});

	test('disabled turns off the field and the arrows', async () => {
		const screen = await render(PeriodPicker, { timespanSettings: { method: 'quick', values: 'today' }, disabled: true });
		await expect.element(screen.getByRole('button', { name: /Today/ })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Next period' })).toBeDisabled();
		expect(screen.container.querySelector('.aurora-period-picker')?.hasAttribute('data-disabled')).toBe(true);
	});

	test('labelSnippet replaces the name and the days', async () => {
		const screen = await render(PeriodPicker, {
			timespanSettings: { method: 'quick', values: 'today' },
			labelSnippet: createRawSnippet<[{ label: string; dates: string }]>((args) => ({
				render: () => `<b>${args().label}!</b>`
			}))
		});
		await expect.element(screen.getByRole('button', { name: 'Today!' })).toBeInTheDocument();
	});

	test('instance CSS variables restyle the field', async () => {
		const screen = await render(PeriodPicker, {
			timespanSettings: { method: 'quick', values: 'today' },
			style: '--period-picker-border-color: rgb(1, 2, 3); --period-picker-width: 420px; --period-picker-icon-color: rgb(4, 5, 6)'
		});
		const root = screen.container.querySelector<HTMLElement>('.aurora-period-picker')!;
		expect(getComputedStyle(root).borderTopColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(root).width).toBe('420px');
		expect(getComputedStyle(root.querySelector('.aurora-period-picker-icon')!).color).toBe('rgb(4, 5, 6)');
	});
});
