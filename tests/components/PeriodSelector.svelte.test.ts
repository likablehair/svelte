import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import PeriodSelector from '#lib/components/composed/forms/PeriodSelector.svelte';
import type { PeriodPreset, TimespanSettings } from '#lib/utils/period.js';

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

const titles = () =>
	[...document.querySelectorAll('.aurora-period-selector-month-title')].map((node) => node.textContent);
const dayCell = (iso: string) => document.querySelector<HTMLElement>(`[data-date="${iso}"]`)!;

beforeEach(async () => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 8, 24, 10));
	await page.viewport(1280, 800);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('PeriodSelector', () => {
	test('shows the presets with their length, the month where the period ends and its days below', async () => {
		const screen = await render(PeriodSelector, { timespanSettings: { method: 'quick', values: 'this-week' }, class: 'mine' });
		expect(screen.container.querySelector('.aurora-period-selector')?.classList.contains('mine')).toBe(true);
		await expect.element(screen.getByRole('option', { name: /This week/ })).toHaveAttribute('aria-selected', 'true');
		await expect.element(screen.getByRole('option', { name: /This week/ })).toHaveTextContent('7d');
		await expect.poll(titles).toEqual(['September 2026']);
		await expect.element(screen.getByRole('textbox', { name: 'Start' })).toHaveValue('09/21/2026');
		await expect.element(screen.getByRole('textbox', { name: 'End' })).toHaveValue('09/27/2026');
		expect(screen.getByRole('listbox').getByRole('option').all()).toHaveLength(8);
	});

	test('every click changes the value at once, an open range after the first day', async () => {
		const onchange = vi.fn();
		const { state, props } = bound({ method: 'quick', values: 'this-month' }, { onchange, months: 2 });
		await render(PeriodSelector, props);
		await expect.poll(titles).toEqual(['August 2026', 'September 2026']);
		dayCell('2026-08-20').click();
		await expect.poll(() => state.value?.method).toBe('picker');
		expect((state.value?.values as { from: Date; to?: Date }).to).toBeUndefined();
		expect(onchange).toHaveBeenLastCalledWith(expect.objectContaining({ to: undefined }));
		await expect.element(page.getByText('Pick the end date')).toBeVisible();
		dayCell('2026-09-02').click();
		expect(onchange).toHaveBeenCalledTimes(2);
		expect(onchange.mock.calls[1][0].to.toDateString()).toBe(new Date(2026, 8, 2).toDateString());
		expect(titles()).toEqual(['August 2026', 'September 2026']);
		await expect.element(page.getByText('14 days')).toBeVisible();
	});

	test('the arrows of the months move both months, a preset shows the month where it ends', async () => {
		const screen = await render(PeriodSelector, { timespanSettings: { method: 'quick', values: 'this-month' }, months: 2 });
		await expect.poll(titles).toEqual(['August 2026', 'September 2026']);
		await screen.getByRole('button', { name: 'Previous month' }).click();
		expect(titles()).toEqual(['July 2026', 'August 2026']);
		await screen.getByRole('button', { name: 'Next month' }).click();
		await screen.getByRole('button', { name: 'Next month' }).click();
		expect(titles()).toEqual(['September 2026', 'October 2026']);
		await screen.getByRole('option', { name: /This year/ }).click();
		await expect.poll(titles).toEqual(['November 2026', 'December 2026']);
	});

	test('compact shows the presets as a horizontal list and one month', async () => {
		const screen = await render(PeriodSelector, {
			timespanSettings: { method: 'quick', values: 'this-month' },
			compact: true
		});
		await expect.element(screen.getByRole('listbox')).toHaveAttribute('aria-orientation', 'horizontal');
		await expect.poll(titles).toEqual(['September 2026']);
		expect(screen.container.querySelector('.aurora-period-selector')?.hasAttribute('data-compact')).toBe(true);
	});

	test('on screens up to 768px it turns compact by itself', async () => {
		await page.viewport(390, 700);
		const screen = await render(PeriodSelector, { timespanSettings: { method: 'quick', values: 'today' }, months: 2 });
		await expect.poll(() => screen.container.querySelector('.aurora-period-selector')?.hasAttribute('data-compact')).toBe(true);
		await expect.poll(titles).toEqual(['September 2026']);
	});

	test('the size of the panel does not change between the calendar and the relative period', async () => {
		const screen = await render(PeriodSelector, { timespanSettings: { method: 'quick', values: 'this-month' } });
		const root = screen.container.querySelector<HTMLElement>('.aurora-period-selector')!;
		await expect.poll(titles).toEqual(['September 2026']);
		const before = root.getBoundingClientRect();
		await screen.getByRole('option', { name: 'Relative period' }).click();
		await expect.element(screen.getByRole('combobox', { name: 'Direction' })).toBeVisible();
		const after = root.getBoundingClientRect();
		expect([after.width, after.height]).toEqual([before.width, before.height]);
		expect(screen.container.querySelector('.aurora-period-selector-months')?.hasAttribute('inert')).toBe(true);
	});

	test('the relative period remembers its values and shows its days', async () => {
		const { state, props } = bound({
			method: 'rolling',
			values: { numberOfUnits: 2, measurementUnit: 'weeks', direction: 'next' }
		});
		const screen = await render(PeriodSelector, props);
		await expect.element(screen.getByRole('combobox', { name: 'Direction' })).toHaveValue('next');
		await expect.poll(() => document.querySelector('.aurora-period-selector-rolling-summary')?.textContent).toBe('Next 2 weeks');
		await expect.element(screen.getByRole('textbox', { name: 'End' })).toHaveValue('10/07/2026');
		await screen.getByRole('option', { name: /Today/ }).click();
		await screen.getByRole('option', { name: 'Relative period' }).click();
		expect(state.value).toEqual({
			method: 'rolling',
			values: { numberOfUnits: 2, measurementUnit: 'weeks', direction: 'next' }
		});
		await screen.getByRole('combobox', { name: 'Direction' }).selectOptions('last');
		expect((state.value?.values as { direction: string }).direction).toBe('last');
		await screen.getByRole('button', { name: 'Choose dates on the calendar' }).click();
		expect(state.value?.method).toBe('picker');
		await expect.element(screen.getByRole('textbox', { name: 'Start' })).toHaveValue('09/11/2026');
		await expect.element(screen.getByRole('listbox').getByRole('option', { selected: true })).not.toBeInTheDocument();
		expect(screen.container.querySelector('.aurora-period-selector-months')?.hasAttribute('inert')).toBe(false);
	});

	test('app presets with their range, and presetSnippet', async () => {
		const presets: PeriodPreset<'yesterday'>[] = [
			{
				value: 'yesterday',
				label: 'Yesterday',
				range: (now) => [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)]
			}
		];
		const onchange = vi.fn();
		const screen = await render(PeriodSelector, {
			quickSelectOptions: presets,
			onchange,
			presetSnippet: createRawSnippet<[{ preset: PeriodPreset<string>; selected: boolean }]>((args) => ({
				render: () => `<i>${args().preset.label} ${args().selected}</i>`
			}))
		});
		expect(screen.getByRole('listbox').getByRole('option').all()).toHaveLength(2);
		await screen.getByRole('option', { name: 'Yesterday false' }).click();
		expect(onchange.mock.calls[0][0].from.toDateString()).toBe(new Date(2026, 8, 23).toDateString());
		await expect.element(screen.getByRole('option', { name: /^Yesterday/ })).toHaveAttribute('aria-selected', 'true');
	});

	test('min and max limit the days and the months', async () => {
		const screen = await render(PeriodSelector, {
			timespanSettings: { method: 'quick', values: 'this-month' },
			min: new Date(2026, 7, 5),
			max: new Date(2026, 8, 30),
			months: 2
		});
		await expect.poll(titles).toEqual(['August 2026', 'September 2026']);
		await expect.element(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
		expect(dayCell('2026-08-04').getAttribute('aria-disabled')).toBe('true');
	});

	test('instance CSS variables restyle the panel', async () => {
		const screen = await render(PeriodSelector, {
			timespanSettings: { method: 'quick', values: 'today' },
			style: '--period-selector-preset-selected-background: rgb(1, 2, 3); --period-selector-presets-width: 220px'
		});
		const option = screen.getByRole('option', { name: /Today/ }).element();
		expect(getComputedStyle(option).backgroundColor).toBe('rgb(1, 2, 3)');
		expect(getComputedStyle(screen.getByRole('listbox').element()).minWidth).toBe('220px');
	});
});
