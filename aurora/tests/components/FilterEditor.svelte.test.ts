import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import FilterEditor from '#lib/components/composed/search/FilterEditor.svelte';
import {
	FILTER_LABELS_IT,
	fieldOperators,
	filterCondition,
	filtersToBuilder,
	createFilters,
	isConditionComplete,
	toISODate,
	type BoolFilterField,
	type DateFilterField,
	type FilterCondition,
	type FilterField,
	type FilterItem,
	type SelectFilterField,
	type StringFilterField
} from '#lib';
import { ICONS, SERVICES, STAFF, fieldOf } from '../fixtures/filters/fields.js';
import { renderWithDefaultLocale, tooltipText } from '../helpers.js';

type Change = (condition: FilterCondition) => void;

const radioField: FilterField = {
	name: 'client',
	label: 'Client',
	type: 'string',
	operators: ['contains', 'is', 'isNot', 'empty']
};

function editor(field: FilterField, operator: string, value?: unknown, extra: Record<string, unknown> = {}) {
	const onchange = vi.fn<Change>();
	const condition = filterCondition(field.name, operator, value);
	return { onchange, condition, props: { field, condition, onchange, ...extra } };
}

type InputParams = { field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void };

function customInput(markup: string, wire: (node: Element, params: () => InputParams) => void) {
	return createRawSnippet<[InputParams]>((params) => ({
		render: () => markup,
		setup: (node) => wire(node, params)
	}));
}

function last(onchange: ReturnType<typeof vi.fn<Change>>) {
	return onchange.mock.lastCall?.[0];
}

describe('FilterEditor', () => {
	test('is a group named by the field, with its icon, the type as data-type and the class', async () => {
		const { props } = editor(fieldOf('client'), 'contains', undefined, { class: 'app-card' });
		const screen = await render(FilterEditor, props);
		const card = screen.getByRole('group', { name: 'Client' });
		await expect.element(card).toHaveClass('aurora-filter-editor', 'app-card');
		await expect.element(card).toHaveAttribute('data-type', 'string');
		const title = card.element().querySelector('.aurora-filter-editor-title');
		expect(title?.textContent?.trim()).toBe('Client');
		expect(title?.querySelector('svg path')?.getAttribute('d')).toBe(ICONS.client);
		await screen.unmount();

		for (const [name, type] of [
			['amount', 'number'],
			['date', 'date'],
			['service', 'select'],
			['paid', 'bool']
		] as const) {
			const other = await render(FilterEditor, editor(fieldOf(name), '').props);
			expect(other.container.querySelector('.aurora-filter-editor')).toHaveAttribute('data-type', type);
			await other.unmount();
		}
	});

	test('onclose adds a Close button in the header', async () => {
		const onclose = vi.fn();
		const { props } = editor(fieldOf('client'), 'contains', undefined, { onclose });
		const screen = await render(FilterEditor, props);
		const close = screen.getByRole('button', { name: 'Close' });
		await expect.element(close).toHaveAttribute('type', 'button');
		await close.click();
		expect(onclose).toHaveBeenCalledOnce();
		await screen.unmount();

		const without = await render(FilterEditor, editor(fieldOf('client'), 'contains').props);
		await expect.element(without.getByRole('textbox')).toBeVisible();
		expect(without.container.querySelector('.aurora-filter-editor-head button')).toBeNull();
	});

	describe('operators', () => {
		test('up to four operators are a radiogroup with a roving tabindex', async () => {
			const { props, onchange } = editor(radioField, 'contains');
			const screen = await render(FilterEditor, props);
			const group = screen.getByRole('radiogroup', { name: 'Operator' });
			await expect.element(group).toBeVisible();
			const radios = screen.getByRole('radio').elements();
			expect(radios.map((radio) => radio.textContent?.trim())).toEqual([
				'contains',
				'is',
				'is not',
				'is empty'
			]);
			expect(radios.map((radio) => radio.getAttribute('aria-checked'))).toEqual([
				'true',
				'false',
				'false',
				'false'
			]);
			expect(radios.map((radio) => radio.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);
			expect(radios.every((radio) => radio.getAttribute('type') === 'button')).toBe(true);
			expect(screen.container.querySelector('select')).toBeNull();

			await screen.getByRole('radio', { name: 'is', exact: true }).click();
			expect(last(onchange)).toMatchObject({ operator: 'is' });
			await expect
				.element(screen.getByRole('radio', { name: 'is', exact: true }))
				.toHaveAttribute('aria-checked', 'true');
			await expect
				.element(screen.getByRole('radio', { name: 'contains' }))
				.toHaveAttribute('tabindex', '-1');
		});

		test('arrows, Home and End select the operator and move the focus, wrapping around', async () => {
			const { props, onchange } = editor(radioField, 'contains');
			const screen = await render(FilterEditor, props);
			const named = (name: string) => screen.getByRole('radio', { name, exact: true });
			await named('contains').click();
			await expect.element(named('contains')).toHaveFocus();
			const steps: [string, string][] = [
				['{ArrowRight}', 'is'],
				['{ArrowDown}', 'is not'],
				['{ArrowLeft}', 'is'],
				['{ArrowUp}', 'contains'],
				['{ArrowLeft}', 'is empty'],
				['{ArrowRight}', 'contains'],
				['{End}', 'is empty'],
				['{Home}', 'contains']
			];
			for (const [key, name] of steps) {
				await userEvent.keyboard(key);
				await expect.element(named(name)).toHaveFocus();
				await expect.element(named(name)).toHaveAttribute('aria-checked', 'true');
			}
			expect(onchange.mock.calls.map(([condition]) => condition.operator)).toEqual([
				'is',
				'isNot',
				'is',
				'contains',
				'empty',
				'contains',
				'empty',
				'contains'
			]);
		});

		test('Tab reaches only the checked operator', async () => {
			const { props } = editor(radioField, 'empty');
			const screen = await render(FilterEditor, props);
			const after = document.createElement('button');
			after.textContent = 'After';
			screen.container.append(after);
			await userEvent.keyboard('{Tab}');
			await expect.element(screen.getByRole('radio', { name: 'is empty' })).toHaveFocus();
			await userEvent.keyboard('{Tab}');
			await expect.element(screen.getByRole('button', { name: 'After' })).toHaveFocus();
		});

		test('a bool field shows Yes and No, or its trueLabel and falseLabel, and no value input', async () => {
			const { props, onchange } = editor(fieldOf('paid'), 'isTrue');
			const screen = await render(FilterEditor, props);
			await expect.element(screen.getByRole('radiogroup', { name: 'Operator' })).toBeVisible();
			await expect.element(screen.getByRole('radio', { name: 'Yes' })).toHaveAttribute('aria-checked', 'true');
			await screen.getByRole('radio', { name: 'No' }).click();
			expect(last(onchange)).toMatchObject({ field: 'paid', operator: 'isFalse', value: undefined });
			expect(screen.container.querySelector('.aurora-filter-value')).toBeNull();
			await screen.unmount();

			const field: FilterField = { ...(fieldOf('paid') as BoolFilterField), trueLabel: 'Paid', falseLabel: 'To pay' };
			const custom = await render(FilterEditor, editor(field, 'isFalse').props);
			const names = custom.getByRole('radio').elements().map((radio) => radio.textContent?.trim());
			expect(names).toEqual(['Paid', 'To pay']);
			await expect.element(custom.getByRole('radio', { name: 'To pay' })).toHaveAttribute('aria-checked', 'true');
		});

		test('v4 bug: a false boolean can be chosen, and it is a complete condition', async () => {
			const { props, onchange } = editor(fieldOf('paid'), 'isTrue');
			const screen = await render(FilterEditor, props);
			await screen.getByRole('radio', { name: 'No' }).click();
			const condition = last(onchange)!;
			expect(condition.operator).toBe('isFalse');
			expect(isConditionComplete(condition, fieldOf('paid'))).toBe(true);
		});

		test('more than four operators are a select named Operator (the standard set by default)', async () => {
			const { props, onchange } = editor(fieldOf('client'), 'contains');
			const screen = await render(FilterEditor, props);
			expect(screen.container.querySelector('[role="radiogroup"]')).toBeNull();
			const select = screen.getByRole('combobox', { name: 'Operator' });
			await expect.element(select).toHaveValue('contains');
			const options = [...(select.element() as HTMLSelectElement).options];
			expect(options.map((option) => [option.value, option.textContent?.trim()])).toEqual([
				['contains', 'contains'],
				['notContains', "doesn't contain"],
				['is', 'is'],
				['isNot', 'is not'],
				['empty', 'is empty'],
				['notEmpty', 'is not empty']
			]);
			await select.selectOptions('notContains');
			expect(last(onchange)).toMatchObject({ field: 'client', operator: 'notContains' });
		});

		test('a field with a single operator shows no operator choice', async () => {
			const field: FilterField = { name: 'code', label: 'Code', type: 'string', operators: ['is'] };
			const screen = await render(FilterEditor, editor(field, 'is').props);
			await expect.element(screen.getByRole('textbox', { name: 'Code' })).toBeVisible();
			expect(screen.container.querySelector('[role="radiogroup"], select')).toBeNull();
		});

		test('an unknown operator falls back to the first one of the field', async () => {
			const screen = await render(FilterEditor, editor(fieldOf('amount'), 'contains').props);
			await expect.element(screen.getByRole('combobox', { name: 'Operator' })).toHaveValue('eq');
			await expect.element(screen.getByRole('spinbutton', { name: 'Amount' })).toBeVisible();
		});

		test('changing operator keeps the value when the input is the same and resets it otherwise', async () => {
			const { props, onchange } = editor(fieldOf('client'), 'contains', 'Rossi');
			const screen = await render(FilterEditor, props);
			const select = screen.getByRole('combobox', { name: 'Operator' });
			await expect.element(screen.getByRole('textbox', { name: 'Client' })).toHaveValue('Rossi');

			await select.selectOptions('is');
			expect(last(onchange)).toMatchObject({ operator: 'is', value: 'Rossi' });
			await expect.element(screen.getByRole('textbox', { name: 'Client' })).toHaveValue('Rossi');

			await select.selectOptions('empty');
			expect(last(onchange)).toMatchObject({ operator: 'empty', value: undefined });
			await expect.element(screen.getByRole('textbox')).not.toBeInTheDocument();

			await select.selectOptions('contains');
			expect(last(onchange)).toMatchObject({ operator: 'contains', value: undefined });
			await expect.element(screen.getByRole('textbox', { name: 'Client' })).toHaveValue('');
		});

		test('from a number to a range the value is reset', async () => {
			const { props, onchange } = editor(fieldOf('amount'), 'gte', 50);
			const screen = await render(FilterEditor, props);
			const select = screen.getByRole('combobox', { name: 'Operator' });
			await select.selectOptions('lt');
			expect(last(onchange)).toMatchObject({ operator: 'lt', value: 50 });
			await select.selectOptions('between');
			expect(last(onchange)).toMatchObject({ operator: 'between', value: undefined });
			await expect.element(screen.getByRole('spinbutton', { name: 'Amount From' })).toHaveValue(null);
		});

		test('choosing the operator already selected changes nothing', async () => {
			const { props, onchange } = editor(radioField, 'contains', 'Ros');
			const screen = await render(FilterEditor, props);
			await screen.getByRole('radio', { name: 'contains' }).click();
			expect(onchange).not.toHaveBeenCalled();
		});
	});

	describe('operator sets', () => {
		const optionsOf = (screen: Awaited<ReturnType<typeof render>>) =>
			[...(screen.getByRole('combobox', { name: 'Operator' }).element() as HTMLSelectElement).options].map(
				(option) => option.value
			);
		const radiosOf = (screen: Awaited<ReturnType<typeof render>>) =>
			screen.getByRole('radio').elements().map((radio) => radio.textContent?.trim());

		test('operatorSet basic offers the essential operators, side by side', async () => {
			const text = await render(FilterEditor, editor(fieldOf('client'), 'contains', undefined, { operatorSet: 'basic' }).props);
			expect(radiosOf(text)).toEqual(['contains', 'is']);
			await text.unmount();
			const date = await render(FilterEditor, editor(fieldOf('date'), 'is', undefined, { operatorSet: 'basic' }).props);
			expect(radiosOf(date)).toEqual(['is', 'between', 'in']);
		});

		test('operatorSet all offers every operator of the type', async () => {
			const screen = await render(FilterEditor, editor(fieldOf('client'), 'contains', undefined, { operatorSet: 'all' }).props);
			expect(optionsOf(screen)).toEqual([
				'contains',
				'notContains',
				'is',
				'isNot',
				'startsWith',
				'endsWith',
				'anyOf',
				'noneOf',
				'empty',
				'notEmpty'
			]);
		});

		test('typeOperators sets the list of a type; the operators of the field win over it and the set', async () => {
			const typeOperators = { string: ['is', 'startsWith'], number: ['between'] };
			const text = await render(FilterEditor, editor(fieldOf('client'), 'is', undefined, { typeOperators }).props);
			expect(radiosOf(text)).toEqual(['is', 'starts with']);
			await text.unmount();

			const number = await render(FilterEditor, editor(fieldOf('amount'), 'between', undefined, { typeOperators }).props);
			expect(number.container.querySelector('[role="radiogroup"], select')).toBeNull();
			await expect.element(number.getByRole('spinbutton', { name: 'Amount From' })).toBeVisible();
			await number.unmount();

			const own = await render(FilterEditor, editor(radioField, 'is', undefined, { typeOperators, operatorSet: 'basic' }).props);
			expect(radiosOf(own)).toEqual(['contains', 'is', 'is not', 'is empty']);
			await own.unmount();

			const named: FilterField = { ...fieldOf('client'), operators: 'basic' } as FilterField;
			const set = await render(FilterEditor, editor(named, 'is', undefined, { operatorSet: 'all', typeOperators }).props);
			expect(radiosOf(set)).toEqual(['contains', 'is']);
		});

		test('v5 fix: an operator the field accepts but does not offer is shown as chosen, with its input', async () => {
			const { props, onchange } = editor(fieldOf('client'), 'startsWith', 'Ro');
			const screen = await render(FilterEditor, props);
			const select = screen.getByRole('combobox', { name: 'Operator' });
			await expect.element(select).toHaveValue('startsWith');
			expect(optionsOf(screen)).toEqual(['contains', 'notContains', 'is', 'isNot', 'empty', 'notEmpty', 'startsWith']);
			await expect.element(screen.getByRole('textbox', { name: 'Client' })).toHaveValue('Ro');
			await select.selectOptions('is');
			expect(last(onchange)).toMatchObject({ operator: 'is', value: 'Ro' });
			await expect.poll(() => optionsOf(screen)).not.toContain('startsWith');
			await screen.unmount();

			const basic = await render(FilterEditor, editor(fieldOf('client'), 'isNot', 'Ro', { operatorSet: 'basic' }).props);
			expect(radiosOf(basic)).toEqual(['contains', 'is', 'is not']);
			const checked = basic.getByRole('radio', { name: 'is not' });
			await expect.element(checked).toHaveAttribute('aria-checked', 'true');
			await expect.element(checked).toHaveAttribute('tabindex', '0');
			await userEvent.keyboard('{Tab}');
			await expect.element(checked).toHaveFocus();
		});
	});

	describe('value inputs', () => {
		test('text: a textbox named by the field, with its placeholder; every keystroke calls onchange', async () => {
			const { props, onchange, condition } = editor(fieldOf('client'), 'contains');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('textbox', { name: 'Client' });
			await expect.element(input).toHaveAttribute('placeholder', 'Name or surname');
			expect(input.element().closest('.aurora-filter-value')).toHaveAttribute('data-input', 'text');
			await input.click();
			await userEvent.keyboard('Ros');
			expect(onchange.mock.calls.map(([change]) => change.value)).toEqual(['R', 'Ro', 'Ros']);
			expect(last(onchange)).toEqual({ ...condition, value: 'Ros' });
		});

		test('number: a spinbutton with the unit and the step of the field', async () => {
			const { props, onchange } = editor(fieldOf('amount'), 'gte');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('spinbutton', { name: 'Amount' });
			await expect.element(input).toHaveAttribute('step', '0.5');
			expect(screen.container.querySelector('.aurora-filter-value-unit')?.textContent).toBe('€');
			await input.click();
			await userEvent.keyboard('49.5');
			expect(last(onchange)).toMatchObject({ operator: 'gte', value: 49.5 });
			expect(typeof last(onchange)!.value).toBe('number');
			await userEvent.clear(input);
			expect(last(onchange)!.value).toBeUndefined();
		});

		test('numberRange: From and To, each end optional', async () => {
			const { props, onchange } = editor(fieldOf('amount'), 'between');
			const screen = await render(FilterEditor, props);
			const from = screen.getByRole('spinbutton', { name: 'Amount From' });
			const to = screen.getByRole('spinbutton', { name: 'Amount To' });
			await expect.element(from).toHaveAttribute('placeholder', 'From');
			await expect.element(to).toHaveAttribute('placeholder', 'To');
			expect(screen.container.querySelectorAll('.aurora-filter-value-unit')).toHaveLength(2);
			await userEvent.fill(from, '10');
			expect(last(onchange)!.value).toEqual({ from: 10 });
			expect(isConditionComplete(last(onchange)!, fieldOf('amount'))).toBe(true);
			await userEvent.fill(to, '80');
			expect(last(onchange)!.value).toEqual({ from: 10, to: 80 });
			await userEvent.clear(from);
			expect(last(onchange)!.value).toEqual({ from: undefined, to: 80 });
		});

		test('date: a DatePickerTextField whose value is yyyy-MM-dd', async () => {
			const { props, onchange } = editor(fieldOf('date'), 'is');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Date', exact: true });
			expect(input.element().closest('.aurora-date-picker-text-field')).not.toBeNull();
			await input.click();
			await userEvent.keyboard('10092026');
			await expect.element(input).toHaveValue('10/09/2026');
			expect(last(onchange)).toMatchObject({ operator: 'is', value: '2026-10-09' });
			await userEvent.keyboard('{Backspace}');
			expect(last(onchange)!.value).toBeUndefined();
		});

		test('date: an initial value is shown in the locale format, and the calendar picks a day', async () => {
			const { props, onchange } = editor(fieldOf('date'), 'before', '2026-10-09', { locale: 'it' });
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Date', exact: true });
			await expect.element(input).toHaveValue('09/10/2026');
			await input.click();
			const fullDate = new Intl.DateTimeFormat('it', { dateStyle: 'full' });
			await screen.getByRole('gridcell', { name: fullDate.format(new Date(2026, 9, 21)), exact: true }).click();
			expect(last(onchange)).toMatchObject({ operator: 'before', value: '2026-10-21' });
		});

		test('dateRange: start and end dates in one field, as { from, to }', async () => {
			const { props, onchange } = editor(fieldOf('date'), 'between');
			const screen = await render(FilterEditor, props);
			const from = screen.getByRole('combobox', { name: 'From', exact: true });
			const to = screen.getByRole('combobox', { name: 'To', exact: true });
			await userEvent.fill(from, '10/01/2026');
			expect(last(onchange)!.value).toEqual({ from: '2026-10-01', to: undefined });
			await userEvent.fill(to, '10/31/2026');
			expect(last(onchange)!.value).toEqual({ from: '2026-10-01', to: '2026-10-31' });
		});

		test('period: a select of the periods, named by the field', async () => {
			const { props, onchange } = editor(fieldOf('date'), 'period');
			const screen = await render(FilterEditor, props);
			const select = screen.getByRole('combobox', { name: 'Date', exact: true });
			await expect.element(select).toHaveValue('');
			const options = [...(select.element() as HTMLSelectElement).options].filter((option) => !option.hidden);
			expect(options.map((option) => option.textContent?.trim())).toEqual([
				'Today',
				'Yesterday',
				'Tomorrow',
				'This week',
				'Last week',
				'Next week',
				'This month',
				'Last month',
				'Next month',
				'Month to date',
				'This quarter',
				'Last quarter',
				'Next quarter',
				'Quarter to date',
				'This year',
				'Last year',
				'Next year',
				'Year to date'
			]);
			await select.selectOptions('thisMonth');
			expect(last(onchange)).toMatchObject({ operator: 'period', value: 'thisMonth' });
			await screen.unmount();

			const field: FilterField = { ...(fieldOf('date') as DateFilterField), periods: ['tomorrow', 'nextWeek'] };
			const own = await render(FilterEditor, editor(field, 'period', 'nextWeek').props);
			const periods = own.getByRole('combobox', { name: 'Date', exact: true });
			await expect.element(periods).toHaveValue('nextWeek');
			expect(
				[...(periods.element() as HTMLSelectElement).options]
					.filter((option) => !option.hidden)
					.map((option) => option.value)
			).toEqual(['tomorrow', 'nextWeek']);
		});

		test('days: an operator of the app with input days is a number of days, never negative', async () => {
			const field: FilterField = {
				name: 'date',
				label: 'Date',
				type: 'date',
				operators: ['is', { name: 'age', label: 'age', input: 'days', apply: () => {} }]
			};
			const { props, onchange } = editor(field, 'age');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('spinbutton', { name: 'Date' });
			await expect.element(input).toHaveAttribute('min', '0');
			await expect.element(input).toHaveAttribute('step', '1');
			expect(screen.container.querySelector('.aurora-filter-value-unit')?.textContent).toBe('days');
			await userEvent.fill(input, '30');
			expect(last(onchange)).toMatchObject({ operator: 'age', value: 30 });
		});

		test('items: an Autocomplete of the field items; the value keeps value and label', async () => {
			const { props, onchange } = editor(fieldOf('service'), 'in');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Service' });
			await input.click();
			await expect
				.poll(() => screen.getByRole('listbox').getByRole('option').elements().map((option) => option.textContent?.trim()))
				.toEqual(['Cut', 'Color', 'Balayage', 'Blow-dry']);
			await screen.getByRole('listbox').getByRole('option', { name: 'Color' }).click();
			expect(last(onchange)!.value).toEqual([{ value: 2, label: 'Color' }]);
			await screen.getByRole('listbox').getByRole('option', { name: 'Balayage' }).click();
			expect(last(onchange)!.value).toEqual([
				{ value: 2, label: 'Color' },
				{ value: 3, label: 'Balayage' }
			]);
		});

		test('items: shortcuts come first and the selected items are chips', async () => {
			const field: FilterField = {
				...(fieldOf('service') as SelectFilterField),
				shortcuts: [{ value: 0, label: 'Most booked' }]
			};
			const { props } = editor(field, 'notIn', [SERVICES[0]]);
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Service' });
			expect(screen.container.querySelector('.aurora-chip')?.textContent).toContain('Cut');
			await input.click();
			const options = screen.getByRole('listbox').getByRole('option').elements();
			expect(options.map((option) => option.textContent?.trim())).toEqual([
				'Most booked',
				'Cut',
				'Color',
				'Balayage',
				'Blow-dry'
			]);
			await expect.element(screen.getByRole('listbox').getByRole('option', { name: 'Cut' })).toHaveAttribute('aria-selected', 'true');
		});

		test('items with view toggle: one toggle chip per option', async () => {
			const { props, onchange } = editor(fieldOf('status'), 'in');
			const screen = await render(FilterEditor, props);
			const group = screen.getByRole('group', { name: 'Status', exact: true }).last();
			const chips = group.getByRole('button').elements();
			expect(chips.map((chip) => chip.textContent?.trim())).toEqual(['Confirmed', 'Waiting', 'Cancelled']);
			const waiting = group.getByRole('button', { name: 'Waiting' });
			await expect.element(waiting).toHaveAttribute('aria-pressed', 'false');
			await waiting.click();
			await expect.element(waiting).toHaveAttribute('aria-pressed', 'true');
			expect(last(onchange)!.value).toEqual([{ value: 'waiting', label: 'Waiting' }]);
			await group.getByRole('button', { name: 'Confirmed' }).click();
			expect(last(onchange)!.value).toEqual([
				{ value: 'waiting', label: 'Waiting' },
				{ value: 'confirmed', label: 'Confirmed' }
			]);
			await waiting.click();
			await expect.element(waiting).toHaveAttribute('aria-pressed', 'false');
			expect(last(onchange)!.value).toEqual([{ value: 'confirmed', label: 'Confirmed' }]);
		});

		test('items with a searcher: the options come from the searcher, the shortcuts before typing', async () => {
			const searcher = vi.fn(async ({ searchText }: { searchText: string; signal: AbortSignal }) =>
				STAFF.filter((item) => String(item.label).toLowerCase().includes(searchText.toLowerCase()))
			);
			const field: FilterField = {
				name: 'staff',
				label: 'Staff',
				type: 'select',
				searcher,
				shortcuts: [{ value: 'me', label: 'Me' }]
			};
			const { props, onchange } = editor(field, 'in');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Staff' });
			await input.click();
			await expect.element(screen.getByRole('listbox').getByRole('option', { name: 'Me' })).toBeVisible();
			expect(searcher).not.toHaveBeenCalled();
			await userEvent.keyboard('mar');
			await expect.element(screen.getByRole('listbox').getByRole('option', { name: 'Marco Rossi' })).toBeVisible();
			expect(searcher.mock.lastCall![0].searchText).toBe('mar');
			await screen.getByRole('listbox').getByRole('option', { name: 'Martina Galli' }).click();
			expect(last(onchange)!.value).toEqual([{ value: 12, label: 'Martina Galli' }]);
		});

		test('custom: inputSnippet gets the field, the operator, the value and setValue', async () => {
			const seen: { field: string; operator: string; value: unknown }[] = [];
			const inputSnippet = createRawSnippet<
				[{ field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void }]
			>((params) => ({
				render: () => '<button type="button">Pick VIP</button>',
				setup: (node) => {
					const { field, operator, value, setValue } = params();
					seen.push({ field: field.name, operator, value });
					node.addEventListener('click', () => setValue('vip'));
				}
			}));
			const field: FilterField = {
				name: 'notes',
				label: 'Notes',
				icon: ICONS.notes,
				type: 'custom',
				operators: [{ name: 'tagged', label: 'tagged', input: 'custom', apply: () => {} }]
			};
			const { props, onchange } = editor(field, 'tagged', undefined, { inputSnippet });
			const screen = await render(FilterEditor, props);
			await expect.element(screen.getByRole('group', { name: 'Notes' })).toHaveAttribute('data-type', 'custom');
			expect(seen).toEqual([{ field: 'notes', operator: 'tagged', value: undefined }]);
			await screen.getByRole('button', { name: 'Pick VIP' }).click();
			expect(last(onchange)).toMatchObject({ field: 'notes', operator: 'tagged', value: 'vip' });
			expect(isConditionComplete(last(onchange)!, field)).toBe(true);
		});

		test('custom: a custom field without operators shows only the inputSnippet', async () => {
			const inputSnippet = createRawSnippet<
				[{ field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void }]
			>((params) => ({
				render: () => `<input aria-label="Code" value="${params().value ?? ''}" />`,
				setup: (node) => {
					node.addEventListener('input', () => params().setValue((node as HTMLInputElement).value));
				}
			}));
			const field: FilterField = { name: 'code', label: 'Code', type: 'custom', apply: () => {} };
			const { props, onchange } = editor(field, 'custom', 'A1', { inputSnippet });
			const screen = await render(FilterEditor, props);
			expect(screen.container.querySelector('[role="radiogroup"], select')).toBeNull();
			const input = screen.getByRole('textbox', { name: 'Code' });
			await expect.element(input).toHaveValue('A1');
			await userEvent.fill(input, 'B2');
			expect(last(onchange)).toMatchObject({ field: 'code', operator: 'custom', value: 'B2' });
		});

		test('items with view countries: a CountriesAutocomplete in the locale of the field', async () => {
			const { props, onchange } = editor(fieldOf('country'), 'in');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Country' });
			await input.click();
			await userEvent.keyboard('ital');
			await screen.getByRole('listbox').getByRole('option', { name: 'Italy' }).click();
			expect(last(onchange)!.value).toEqual([{ value: 'IT', label: 'Italy' }]);
			await screen.unmount();

			const field: FilterField = { ...(fieldOf('country') as SelectFilterField), locale: 'it' };
			const italian = await render(FilterEditor, editor(field, 'in').props);
			await italian.getByRole('combobox', { name: 'Country' }).click();
			await userEvent.keyboard('germ');
			await expect.element(italian.getByRole('option', { name: 'Germania' })).toBeVisible();
		});

		test('autofocus moves the focus to the value input', async () => {
			const { props } = editor(fieldOf('amount'), 'eq', undefined, { autofocus: true });
			const screen = await render(FilterEditor, props);
			await expect.element(screen.getByRole('spinbutton', { name: 'Amount' })).toHaveFocus();
		});
	});

	describe('focus on open', () => {
		const opened = { autofocus: true, onclose: () => {} };

		test('the value input when there is one', async () => {
			const text = await render(FilterEditor, editor(radioField, 'contains', undefined, opened).props);
			await expect.element(text.getByRole('textbox', { name: 'Client' })).toHaveFocus();
			await text.unmount();

			const date = await render(FilterEditor, editor(fieldOf('date'), 'is', undefined, opened).props);
			await expect.element(date.getByRole('combobox', { name: 'Date', exact: true })).toHaveFocus();
		});

		test('the checked operator when the value is chosen from options or there is none', async () => {
			const service = await render(FilterEditor, editor(fieldOf('service'), 'in', undefined, opened).props);
			await expect.element(service.getByRole('combobox', { name: 'Service' })).toHaveFocus();
			await service.unmount();
			const status = await render(FilterEditor, editor(fieldOf('status'), 'in', undefined, opened).props);
			await expect.element(status.getByRole('button', { name: 'Confirmed' })).toHaveFocus();
			await status.unmount();
			const bool = await render(FilterEditor, editor(fieldOf('paid'), 'isFalse', undefined, opened).props);
			await expect.element(bool.getByRole('radio', { name: 'No', exact: true })).toHaveFocus();
			await bool.unmount();
		});

		test('a select or a button of the value, never the close button first', async () => {
			const period = await render(FilterEditor, editor(fieldOf('date'), 'period', undefined, opened).props);
			await expect.element(period.getByRole('combobox', { name: 'Date', exact: true })).toHaveFocus();
			await period.unmount();

			const inputSnippet = customInput('<button type="button">Pick</button>', () => {});
			const field: FilterField = { name: 'code', label: 'Code', type: 'custom', apply: () => {} };
			const custom = await render(FilterEditor, {
				...editor(field, 'custom', undefined, opened).props,
				inputSnippet
			});
			await expect.element(custom.getByRole('button', { name: 'Pick' })).toHaveFocus();
		});

		test('editing a filter that already has a value does not open its list or calendar over the card', async () => {
			const service = await render(FilterEditor, editor(fieldOf('service'), 'in', [SERVICES[0]], opened).props);
			await expect.element(service.getByRole('combobox', { name: 'Operator' })).toHaveFocus();
			await expect.element(service.getByRole('combobox', { name: 'Service' })).toHaveAttribute('aria-expanded', 'false');
			await service.unmount();

			const date = await render(FilterEditor, editor(fieldOf('date'), 'is', '2026-09-24', opened).props);
			await expect.element(date.getByRole('combobox', { name: 'Operator' })).toHaveFocus();
			await expect.element(date.getByRole('combobox', { name: 'Date', exact: true })).toHaveAttribute('aria-expanded', 'false');
			await date.unmount();

			const text = await render(FilterEditor, editor(radioField, 'contains', 'mario', opened).props);
			await expect.element(text.getByRole('textbox', { name: 'Client' })).toHaveFocus();
		});

		test('a new date-and-time filter opens its panel; one with a value does not', async () => {
			const fresh = await render(FilterEditor, editor(delivered, 'before', undefined, opened).props);
			const field = fresh.getByRole('combobox', { name: 'Delivered', exact: true });
			await expect.element(field).toHaveFocus();
			await expect.element(field).toHaveAttribute('aria-expanded', 'true');
			await fresh.unmount();

			const range = await render(FilterEditor, editor(delivered, 'between', undefined, opened).props);
			await expect.element(range.getByRole('combobox', { name: 'Delivered From', exact: true })).toHaveFocus();
			await expect
				.element(range.getByRole('combobox', { name: 'Delivered From', exact: true }))
				.toHaveAttribute('aria-expanded', 'true');
			await range.unmount();

			const edit = await render(FilterEditor, editor(delivered, 'before', '2026-10-09T08:15', opened).props);
			await expect.element(edit.getByRole('combobox', { name: 'Operator' })).toHaveFocus();
			await expect
				.element(edit.getByRole('combobox', { name: 'Delivered', exact: true }))
				.toHaveAttribute('aria-expanded', 'false');
		});

		test('nothing moves without autofocus', async () => {
			const screen = await render(FilterEditor, editor(fieldOf('service'), 'in').props);
			await expect.element(screen.getByRole('combobox', { name: 'Operator' })).toBeVisible();
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(document.activeElement).toBe(document.body);
		});
	});

	test('a single operator without a value shows a summary instead of the choice', async () => {
		const field: FilterField = { ...(fieldOf('paid') as BoolFilterField), operators: ['isTrue'] };
		const screen = await render(FilterEditor, editor(field, 'isTrue').props);
		const summary = screen.container.querySelector('.aurora-filter-editor-summary');
		expect(summary?.textContent?.trim()).toBe('Yes');
		expect(screen.container.querySelector('[role="radiogroup"], select, .aurora-filter-value')).toBeNull();
		await screen.unmount();

		const archived: FilterField = { name: 'archived', label: 'Archived', type: 'bool', operators: ['isTrue'], trueLabel: 'Archived only' };
		const own = await render(FilterEditor, editor(archived, 'isTrue').props);
		expect(own.container.querySelector('.aurora-filter-editor-summary')?.textContent?.trim()).toBe('Archived only');
	});

	test('custom values: empty arrays and objects are incomplete, field.isComplete decides', async () => {
		const inputSnippet = customInput(
			'<span><button type="button">None</button><button type="button">Empty</button><button type="button">Two</button></span>',
			(node, params) => {
				const [none, empty, two] = node.querySelectorAll('button');
				none.addEventListener('click', () => params().setValue([]));
				empty.addEventListener('click', () => params().setValue({}));
				two.addEventListener('click', () => params().setValue(['a', 'b']));
			}
		);
		const field: FilterField = { name: 'tags', label: 'Tags', type: 'custom', apply: () => {} };
		const screen = await render(FilterEditor, {
			...editor(field, 'custom', undefined, { confirm: true }).props,
			inputSnippet
		});
		const apply = screen.getByRole('button', { name: 'Apply' });
		for (const [button, enabled] of [
			['None', false],
			['Two', true],
			['Empty', false]
		] as const) {
			await screen.getByRole('button', { name: button }).click();
			if (enabled) await expect.element(apply).toBeEnabled();
			else await expect.element(apply).toBeDisabled();
		}
		await screen.unmount();

		const code: FilterField = {
			name: 'code',
			label: 'Code',
			type: 'string',
			operators: ['is'],
			isComplete: (condition) => typeof condition.value === 'string' && condition.value.length >= 3
		};
		const onapply = vi.fn<Change>();
		const strict = await render(FilterEditor, editor(code, 'is', undefined, { confirm: true, onapply }).props);
		await strict.getByRole('textbox', { name: 'Code' }).click();
		await userEvent.keyboard('AB{Enter}');
		await expect.element(strict.getByRole('button', { name: 'Apply' })).toBeDisabled();
		expect(onapply).not.toHaveBeenCalled();
		await userEvent.keyboard('C{Enter}');
		expect(onapply).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ value: 'ABC' }));
	});

	describe('applying', () => {
		test('without confirm there is no Apply; Enter calls onapply only with a complete value', async () => {
			const onapply = vi.fn<Change>();
			const { props, onchange } = editor(fieldOf('client'), 'contains', undefined, { onapply });
			const screen = await render(FilterEditor, props);
			expect(screen.container.querySelector('.aurora-filter-editor-actions')).toBeNull();
			await screen.getByRole('textbox').click();
			await userEvent.keyboard('{Enter}');
			expect(onapply).not.toHaveBeenCalled();
			await userEvent.keyboard('Ros{Enter}');
			expect(onapply).toHaveBeenCalledOnce();
			expect(onapply.mock.calls[0][0]).toMatchObject({ field: 'client', operator: 'contains', value: 'Ros' });
			expect(onchange).toHaveBeenCalledTimes(3);
		});

		test('confirm shows Cancel and Apply, never calls onchange, and Apply waits for a complete value', async () => {
			const onapply = vi.fn<Change>();
			const oncancel = vi.fn();
			const { props, onchange } = editor(fieldOf('amount'), 'gte', undefined, {
				confirm: true,
				onapply,
				oncancel
			});
			const screen = await render(FilterEditor, props);
			const apply = screen.getByRole('button', { name: 'Apply' });
			await expect.element(apply).toBeDisabled();
			await userEvent.fill(screen.getByRole('spinbutton', { name: 'Amount' }), '50');
			await expect.element(apply).toBeEnabled();
			await screen.getByRole('combobox', { name: 'Operator' }).selectOptions('lt');
			expect(onchange).not.toHaveBeenCalled();
			await apply.click();
			expect(onapply).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ operator: 'lt', value: 50 }));
			await screen.getByRole('button', { name: 'Cancel' }).click();
			expect(oncancel).toHaveBeenCalledOnce();
			expect(onchange).not.toHaveBeenCalled();
		});

		test('confirm: Enter in the value applies, and does nothing while the value is incomplete', async () => {
			const onapply = vi.fn<Change>();
			const { props } = editor(fieldOf('client'), 'contains', undefined, { confirm: true, onapply });
			const screen = await render(FilterEditor, props);
			await screen.getByRole('textbox').click();
			await userEvent.keyboard('   {Enter}');
			expect(onapply).not.toHaveBeenCalled();
			await expect.element(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
			await userEvent.keyboard('Rossi{Enter}');
			expect(onapply).toHaveBeenCalledOnce();
			expect(onapply.mock.calls[0][0].value).toBe('   Rossi');
		});

		test('confirm: Enter in the date closes the calendar first, then applies', async () => {
			const onapply = vi.fn<Change>();
			const { props } = editor(fieldOf('date'), 'is', undefined, { confirm: true, onapply });
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Date', exact: true });
			await input.click();
			await userEvent.keyboard('10092026');
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await userEvent.keyboard('{Enter}');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(onapply).not.toHaveBeenCalled();
			await userEvent.keyboard('{Enter}');
			expect(onapply).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ value: '2026-10-09' }));
		});

		test('confirm: Enter on an option of the Autocomplete picks it; Enter with the list closed applies', async () => {
			const onapply = vi.fn<Change>();
			const { props } = editor(fieldOf('service'), 'in', undefined, { confirm: true, onapply });
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Service' });
			await input.click();
			await userEvent.keyboard('col');
			await userEvent.keyboard('{Enter}');
			await expect
				.element(screen.getByRole('listbox').getByRole('option', { name: 'Color' }))
				.toHaveAttribute('aria-selected', 'true');
			expect(onapply).not.toHaveBeenCalled();
			await userEvent.keyboard('{Escape}');
			await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
			await userEvent.keyboard('{Enter}');
			expect(onapply).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({ value: [{ value: 2, label: 'Color' }] })
			);
		});

		test('confirm: Enter applies from a select and an input of the app, not from buttons and textareas', async () => {
			const onapply = vi.fn<Change>();
			const period = await render(
				FilterEditor,
				editor(fieldOf('date'), 'period', 'thisMonth', { confirm: true, onapply }).props
			);
			const select = period.getByRole('combobox', { name: 'Date', exact: true });
			(select.element() as HTMLSelectElement).focus();
			await userEvent.keyboard('{Enter}');
			expect(onapply).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ value: 'thisMonth' }));
			await period.unmount();

			onapply.mockClear();
			const inputSnippet = customInput(
				'<span><input aria-label="Note" /><textarea aria-label="Long note"></textarea></span>',
				(node, params) => {
					for (const control of node.querySelectorAll('input, textarea'))
						control.addEventListener('input', (event) =>
							params().setValue((event.currentTarget as HTMLInputElement).value)
						);
				}
			);
			const field: FilterField = { name: 'note', label: 'Note', type: 'custom', apply: () => {} };
			const custom = await render(FilterEditor, {
				...editor(field, 'custom', 'x', { confirm: true, onapply, removable: true, onremove: () => {} }).props,
				inputSnippet
			});
			await custom.getByRole('textbox', { name: 'Long note' }).click();
			await userEvent.keyboard('{Enter}');
			expect(onapply).not.toHaveBeenCalled();
			(custom.getByRole('button', { name: 'Cancel' }).element() as HTMLElement).focus();
			await userEvent.keyboard('{Enter}');
			expect(onapply).not.toHaveBeenCalled();
			await custom.getByRole('textbox', { name: 'Note', exact: true }).click();
			await userEvent.keyboard('{Enter}');
			expect(onapply).toHaveBeenCalledOnce();
		});

		test('confirm: Enter on an operator radio selects it and does not apply', async () => {
			const onapply = vi.fn<Change>();
			const { props } = editor(fieldOf('paid'), 'isTrue', undefined, { confirm: true, onapply });
			const screen = await render(FilterEditor, props);
			(screen.getByRole('radio', { name: 'No' }).element() as HTMLElement).focus();
			await userEvent.keyboard('{Enter}');
			await expect.element(screen.getByRole('radio', { name: 'No' })).toHaveAttribute('aria-checked', 'true');
			expect(onapply).not.toHaveBeenCalled();
		});

		test('removable shows Remove, which calls onremove', async () => {
			const onremove = vi.fn();
			const { props } = editor(fieldOf('client'), 'contains', 'Ros', { removable: true, onremove });
			const screen = await render(FilterEditor, props);
			const remove = screen.getByRole('button', { name: 'Remove' });
			await expect.element(remove).toHaveAttribute('data-variant', 'danger');
			await remove.click();
			expect(onremove).toHaveBeenCalledOnce();
			expect(screen.container.querySelector('button[disabled]')).toBeNull();
		});
	});

	test('labels translate every text and locale formats the values', async () => {
		const labels = {
			operator: 'Operatore',
			close: 'Chiudi',
			apply: 'Applica',
			cancel: 'Annulla',
			remove: 'Rimuovi',
			from: 'Da',
			to: 'A',
			yes: 'Sì',
			no: 'No',
			days: 'giorni',
			units: { days: 'giorni', weeks: 'settimane' },
			operators: { contains: 'contiene', is: 'è', between: 'tra' },
			periods: { today: 'Oggi' }
		};
		const base = { labels, onclose: () => {}, confirm: true, removable: true };
		const text = await render(FilterEditor, editor(radioField, 'contains', undefined, base).props);
		await expect.element(text.getByRole('radiogroup', { name: 'Operatore' })).toBeVisible();
		await expect.element(text.getByRole('radio', { name: 'contiene' })).toBeVisible();
		await expect.element(text.getByRole('radio', { name: 'è', exact: true })).toBeVisible();
		await expect.element(text.getByRole('radio', { name: 'is empty' })).toBeVisible();
		for (const name of ['Chiudi', 'Applica', 'Annulla', 'Rimuovi'])
			await expect.element(text.getByRole('button', { name })).toBeVisible();
		await text.unmount();

		const range = await render(FilterEditor, editor(fieldOf('amount'), 'between', undefined, base).props);
		await expect.element(range.getByRole('spinbutton', { name: 'Amount Da' })).toHaveAttribute('placeholder', 'Da');
		await expect.element(range.getByRole('spinbutton', { name: 'Amount A' })).toBeVisible();
		await expect.element(range.getByRole('combobox', { name: 'Operatore' })).toHaveValue('between');
		await range.unmount();

		const days = await render(FilterEditor, editor(fieldOf('date'), 'inLast', undefined, base).props);
		const unit = days.container.querySelector<HTMLSelectElement>('.aurora-filter-value select')!;
		expect(unit.selectedOptions[0].textContent?.trim()).toBe('giorni');
		expect([...unit.options].map((option) => option.textContent?.trim())).toEqual(['giorni', 'settimane', 'months', 'years']);
		await days.unmount();

		const period = await render(FilterEditor, editor(fieldOf('date'), 'period', 'today', base).props);
		const select = period.getByRole('combobox', { name: 'Date', exact: true });
		expect((select.element() as HTMLSelectElement).selectedOptions[0].textContent?.trim()).toBe('Oggi');
		await period.unmount();

		const bool = await render(FilterEditor, editor(fieldOf('paid'), 'isTrue', undefined, base).props);
		await expect.element(bool.getByRole('radio', { name: 'Sì' })).toBeVisible();
	});

	test('bind:condition follows the edits', async () => {
		let condition = $state(filterCondition('service', 'in', [] as FilterItem[]));
		const props = { field: fieldOf('service') };
		Object.defineProperty(props, 'condition', {
			enumerable: true,
			configurable: true,
			get: () => condition,
			set: (next) => (condition = next)
		});
		const screen = await render(FilterEditor, props as typeof props & { condition: FilterCondition });
		await screen.getByRole('combobox', { name: 'Service' }).click();
		await screen.getByRole('listbox').getByRole('option', { name: 'Cut' }).click();
		expect(condition.value).toEqual([{ value: 1, label: 'Cut' }]);
		condition = filterCondition('service', 'empty');
		await expect.element(screen.getByRole('combobox', { name: 'Operator' })).toHaveValue('empty');
		await expect.element(screen.getByRole('combobox', { name: 'Service' })).not.toBeInTheDocument();
	});
});

const delivered: FilterField = { name: 'delivered', label: 'Delivered', type: 'date', withTime: true };

const quantity: FilterField = {
	name: 'quantity',
	label: 'Quantity',
	type: 'number',
	compareWith: [
		{ column: 'minQuantity', label: 'Minimum' },
		{ column: 'maxQuantity', label: 'Maximum' }
	]
};

const PRODUCTS: FilterItem[] = [
	{ value: 'P-100', label: 'P-100 Shampoo' },
	{ value: 'P-140', label: 'P-140 Mask' },
	{ value: 'P-220', label: 'P-220 Oil' }
];

function search(searchText: string) {
	return PRODUCTS.filter((item) => String(item.label).toLowerCase().includes(searchText.toLowerCase()));
}

function productField(suggest: NonNullable<StringFilterField['suggest']>): FilterField {
	return { name: 'product', label: 'Product', type: 'string', column: 'products.name', suggestColumn: 'products.code', suggest };
}

function chips(container: HTMLElement) {
	return [...container.querySelectorAll('.aurora-filter-value-chips .aurora-chip')].map((chip) => chip.textContent?.trim());
}

function options(select: Element) {
	return [...(select as HTMLSelectElement).options]
		.filter((option) => !option.hidden)
		.map((option) => [option.value, option.textContent?.trim()]);
}

describe('FilterEditor: lists, relative dates, date and time, columns and suggestions', () => {
	describe('texts and numbers', () => {
		test('Enter or a comma adds the draft as a chip, trimmed; duplicates are ignored; blur adds the draft', async () => {
			const { props, onchange } = editor(fieldOf('client'), 'anyOf');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('textbox', { name: 'Client' });
			await expect.element(input).toHaveAttribute('placeholder', 'Type and press Enter');
			expect(input.element().closest('.aurora-filter-value')).toHaveAttribute('data-input', 'texts');
			await input.click();
			await userEvent.keyboard(' Rossi {Enter}');
			expect(last(onchange)!.value).toEqual(['Rossi']);
			await expect.element(input).toHaveValue('');
			await userEvent.keyboard('Bianchi,');
			expect(last(onchange)!.value).toEqual(['Rossi', 'Bianchi']);
			await expect.element(input).toHaveValue('');
			const calls = onchange.mock.calls.length;
			await userEvent.keyboard('Rossi{Enter}');
			await expect.element(input).toHaveValue('');
			expect(onchange).toHaveBeenCalledTimes(calls);
			await userEvent.keyboard('Verdi');
			expect(onchange).toHaveBeenCalledTimes(calls);
			(input.element() as HTMLInputElement).blur();
			await expect.poll(() => last(onchange)!.value).toEqual(['Rossi', 'Bianchi', 'Verdi']);
			await expect.element(input).toHaveValue('');
			expect(chips(screen.container)).toEqual(['Rossi', 'Bianchi', 'Verdi']);
			expect(isConditionComplete(last(onchange)!, fieldOf('client'))).toBe(true);
		});

		test('Backspace on an empty draft removes the last chip; the × of a chip removes it', async () => {
			const { props, onchange } = editor(fieldOf('client'), 'noneOf', ['a', 'b', 'c']);
			const screen = await render(FilterEditor, props);
			expect(chips(screen.container)).toEqual(['a', 'b', 'c']);
			await screen.getByRole('button', { name: 'Remove b' }).click();
			expect(last(onchange)!.value).toEqual(['a', 'c']);
			await expect.poll(() => chips(screen.container)).toEqual(['a', 'c']);
			await screen.getByRole('textbox', { name: 'Client' }).click();
			await userEvent.keyboard('x{Backspace}');
			expect(last(onchange)!.value).toEqual(['a', 'c']);
			await userEvent.keyboard('{Backspace}');
			expect(last(onchange)!.value).toEqual(['a']);
			await expect.poll(() => chips(screen.container)).toEqual(['a']);
		});

		test('Enter on an empty draft applies the condition, only when it is complete', async () => {
			const onapply = vi.fn<Change>();
			const { props } = editor(fieldOf('client'), 'anyOf', undefined, { confirm: true, onapply });
			const screen = await render(FilterEditor, props);
			await screen.getByRole('textbox', { name: 'Client' }).click();
			await userEvent.keyboard('{Enter}');
			expect(onapply).not.toHaveBeenCalled();
			await userEvent.keyboard('a{Enter}');
			expect(onapply).not.toHaveBeenCalled();
			await expect.element(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
			await userEvent.keyboard('{Enter}');
			expect(onapply).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ operator: 'anyOf', value: ['a'] }));
			await screen.unmount();

			const direct = vi.fn<Change>();
			const plain = await render(FilterEditor, editor(fieldOf('client'), 'anyOf', ['a'], { onapply: direct }).props);
			await plain.getByRole('textbox', { name: 'Client' }).click();
			await userEvent.keyboard('{Enter}');
			expect(direct).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ value: ['a'] }));
		});

		test('numbers: a number input whose chips are numbers', async () => {
			const { props, onchange } = editor(fieldOf('amount'), 'anyOf');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('spinbutton', { name: 'Amount' });
			expect(input.element().closest('.aurora-filter-value')).toHaveAttribute('data-input', 'numbers');
			await input.click();
			await userEvent.keyboard('10{Enter}');
			await userEvent.keyboard('2.5,');
			await userEvent.keyboard('10{Enter}');
			expect(last(onchange)!.value).toEqual([10, 2.5]);
			await expect.element(input).toHaveValue(null);
			expect(chips(screen.container)).toEqual(['10', '2.5']);
			await screen.getByRole('button', { name: 'Remove 10' }).click();
			expect(last(onchange)!.value).toEqual([2.5]);
		});
	});

	describe('relative dates', () => {
		test('an amount and a unit (days, weeks, months, years)', async () => {
			const { props, onchange } = editor(fieldOf('date'), 'inLast');
			const screen = await render(FilterEditor, props);
			const amount = screen.getByRole('spinbutton', { name: 'Date' });
			expect(amount.element().closest('.aurora-filter-value')).toHaveAttribute('data-input', 'relative');
			await expect.element(amount).toHaveAttribute('min', '0');
			const unit = screen.getByRole('combobox', { name: 'Date Unit' });
			await expect.element(unit).toHaveValue('days');
			expect(options(unit.element())).toEqual([
				['days', 'days'],
				['weeks', 'weeks'],
				['months', 'months'],
				['years', 'years']
			]);
			await userEvent.fill(amount, '2');
			expect(last(onchange)!.value).toEqual({ amount: 2, unit: 'days' });
			await unit.selectOptions('weeks');
			expect(last(onchange)!.value).toEqual({ amount: 2, unit: 'weeks' });
			expect(isConditionComplete(last(onchange)!, fieldOf('date'))).toBe(true);
			await userEvent.clear(amount);
			expect(last(onchange)!.value).toEqual({ amount: undefined, unit: 'weeks' });
			expect(isConditionComplete(last(onchange)!, fieldOf('date'))).toBe(false);
		});

		test('fields with time offer minutes and hours too', async () => {
			const { props, onchange } = editor(delivered, 'olderThan', { amount: 30, unit: 'minutes' });
			const screen = await render(FilterEditor, props);
			await expect.element(screen.getByRole('spinbutton', { name: 'Delivered' })).toHaveValue(30);
			const unit = screen.getByRole('combobox', { name: 'Delivered Unit' });
			await expect.element(unit).toHaveValue('minutes');
			expect(options(unit.element()).map(([value]) => value)).toEqual([
				'minutes',
				'hours',
				'days',
				'weeks',
				'months',
				'years'
			]);
			await unit.selectOptions('hours');
			expect(last(onchange)!.value).toEqual({ amount: 30, unit: 'hours' });
		});

		test('a plain number (the value of the first version) shows as days', async () => {
			const { props, onchange } = editor(fieldOf('date'), 'inNext', 5);
			const screen = await render(FilterEditor, props);
			await expect.element(screen.getByRole('spinbutton', { name: 'Date' })).toHaveValue(5);
			const unit = screen.getByRole('combobox', { name: 'Date Unit' });
			await expect.element(unit).toHaveValue('days');
			await unit.selectOptions('months');
			expect(last(onchange)!.value).toEqual({ amount: 5, unit: 'months' });
		});
	});

	describe('date and time', () => {
		const option = (column: string, name: string) =>
			page.getByRole('listbox', { name: column, exact: true }).getByRole('option', { name, exact: true });
		const day = (date: Date) =>
			page.getByRole('gridcell', { name: new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(date), exact: true });
		const thisMonth = (date: number) => {
			const now = new Date();
			return new Date(now.getFullYear(), now.getMonth(), date);
		};

		test('datetime: one date and time field gives yyyy-MM-ddTHH:mm, with the format as placeholder', async () => {
			const { props, onchange } = editor(delivered, 'before');
			const screen = await render(FilterEditor, props);
			const field = screen.getByRole('combobox', { name: 'Delivered', exact: true });
			expect(field.element().closest('.aurora-filter-value')).toHaveAttribute('data-input', 'datetime');
			expect(field.element().closest('.aurora-date-time-picker-text-field')).not.toBeNull();
			expect(screen.container.querySelector('input[type="time"]')).toBeNull();
			await expect.element(field).toHaveAttribute('placeholder', 'mm/dd/yyyy hh:mm am');
			expect(screen.container.querySelector('.aurora-date-time-picker-text-field-format')).toBeNull();
			await field.click();
			await userEvent.keyboard('10092026023');
			expect(onchange).not.toHaveBeenCalled();
			await userEvent.keyboard('0p');
			await expect.element(field).toHaveValue('10/09/2026 02:30 PM');
			expect(last(onchange)!.value).toBe('2026-10-09T14:30');
			expect(isConditionComplete(last(onchange)!, delivered)).toBe(true);
			await day(new Date(2026, 9, 12)).click();
			expect(last(onchange)!.value).toBe('2026-10-12T14:30');
			await expect.element(field).toHaveValue('10/12/2026 02:30 PM');
			await userEvent.fill(field, '');
			expect(last(onchange)!.value).toBeUndefined();
			expect(isConditionComplete(last(onchange)!, delivered)).toBe(false);
		});

		test('datetime: a day alone starts at 00:00, the minutes close the panel', async () => {
			const { props, onchange } = editor(delivered, 'after');
			const screen = await render(FilterEditor, props);
			const field = screen.getByRole('combobox', { name: 'Delivered', exact: true });
			await field.click();
			const target = thisMonth(15);
			await day(target).click();
			expect(last(onchange)!.value).toBe(`${toISODate(target)}T00:00`);
			await expect.element(field).toHaveAttribute('aria-expanded', 'true');
			const minutes = page.getByRole('listbox', { name: 'Minutes', exact: true }).getByRole('option');
			expect(minutes.elements().map((node) => node.textContent?.trim())).toEqual(['00', '15', '30', '45']);
			await option('Hours', '09').click();
			await option('Minutes', '45').click();
			expect(last(onchange)!.value).toBe(`${toISODate(target)}T09:45`);
			await expect.element(field).toHaveAttribute('aria-expanded', 'false');
		});

		test('datetime: the initial value fills the field; a time chosen before the day is kept', async () => {
			const filled = await render(FilterEditor, editor(delivered, 'onOrAfter', '2026-10-09T08:15').props);
			await expect
				.element(filled.getByRole('combobox', { name: 'Delivered', exact: true }))
				.toHaveValue('10/09/2026 08:15 AM');
			await filled.unmount();

			const { props, onchange } = editor(delivered, 'after');
			const screen = await render(FilterEditor, props);
			await screen.getByRole('combobox', { name: 'Delivered', exact: true }).click();
			await option('Hours', '08').click();
			await option('Minutes', '15').click();
			await option('AM/PM', 'AM').click();
			expect(onchange).not.toHaveBeenCalled();
			const target = thisMonth(15);
			await day(target).click();
			expect(last(onchange)!.value).toBe(`${toISODate(target)}T08:15`);
		});

		test('datetime: the query is the same as for the value written by hand', async () => {
			const { props, onchange } = editor(delivered, 'onOrBefore');
			const screen = await render(FilterEditor, props);
			await userEvent.fill(screen.getByRole('combobox', { name: 'Delivered', exact: true }), '10/09/2026 11:05 PM');
			const typed = last(onchange)!;
			expect(typed.value).toBe('2026-10-09T23:05');
			const query = (condition: FilterCondition) =>
				filtersToBuilder(createFilters([condition]), [delivered]).toJson().modifiers;
			expect(query(typed)).toEqual(query(filterCondition('delivered', 'onOrBefore', '2026-10-09T23:05')));
			expect(query(typed)).toEqual([
				{
					method: 'where',
					kind: 'simple',
					key: 'delivered',
					operator: '<=',
					value: new Date(2026, 9, 9, 23, 5),
					logicalOperator: 'and'
				}
			]);
		});

		test('is and is not stay whole days, without a time', async () => {
			const screen = await render(FilterEditor, editor(delivered, 'is').props);
			const date = screen.getByRole('combobox', { name: 'Delivered', exact: true });
			expect(date.element().closest('.aurora-filter-value')).toHaveAttribute('data-input', 'date');
			expect(screen.container.querySelector('input[type="time"]')).toBeNull();
			expect(screen.container.querySelector('.aurora-date-time-picker-text-field')).toBeNull();
		});

		test('datetimeRange: From and To, each one date and time field', async () => {
			const { props, onchange } = editor(delivered, 'between');
			const screen = await render(FilterEditor, props);
			const from = screen.getByRole('combobox', { name: 'Delivered From', exact: true });
			const to = screen.getByRole('combobox', { name: 'Delivered To', exact: true });
			expect(from.element().closest('.aurora-filter-value')).toHaveAttribute('data-input', 'datetimeRange');
			expect(screen.container.querySelectorAll('.aurora-date-time-picker-text-field')).toHaveLength(2);
			await expect.element(from).toHaveAttribute('placeholder', 'From');
			await expect.element(to).toHaveAttribute('placeholder', 'To');
			await userEvent.fill(from, '10/01/2026 09:00 AM');
			expect(last(onchange)!.value).toEqual({ from: '2026-10-01T09:00' });
			expect(isConditionComplete(last(onchange)!, delivered)).toBe(true);
			await userEvent.fill(to, '10/31/2026 06:30 PM');
			expect(last(onchange)!.value).toEqual({ from: '2026-10-01T09:00', to: '2026-10-31T18:30' });
			await userEvent.fill(from, '10/01/2026 09:0');
			expect(last(onchange)!.value).toEqual({ from: undefined, to: '2026-10-31T18:30' });
		});

		test('Italian labels translate the field and its panel', async () => {
			const screen = await render(FilterEditor, editor(delivered, 'before', undefined, { locale: 'it' }).props);
			const field = screen.getByRole('combobox', { name: 'Delivered', exact: true });
			await expect.element(field).toHaveAttribute('placeholder', 'gg/mm/aaaa hh:mm');
			await expect.element(screen.getByRole('button', { name: 'Scegli data e ora' })).toBeInTheDocument();
			await field.click();
			await expect.element(page.getByRole('listbox', { name: 'Ore', exact: true })).toBeVisible();
			await expect.element(page.getByRole('listbox', { name: 'Minuti', exact: true })).toBeVisible();
			await expect.element(page.getByRole('button', { name: 'Mese successivo' })).toBeVisible();
			await userEvent.keyboard('3102202610');
			(field.element() as HTMLInputElement).blur();
			await expect.element(screen.getByText("Inserisci una data e un'ora valide")).toBeVisible();
		});

		test('labels.amPm names the AM/PM column of a 12-hour clock', async () => {
			const it = { ...delivered, label: 'Consegna' } as FilterField;
			const screen = await render(FilterEditor, {
				...editor(it, 'before').props,
				labels: { ...FILTER_LABELS_IT, amPm: 'Mattina o sera' }
			});
			await screen.getByRole('combobox', { name: 'Consegna', exact: true }).click();
			await expect.element(page.getByRole('listbox', { name: 'Mattina o sera', exact: true })).toBeVisible();
		});
	});

	test('column: a select of the columns in compareWith; the column operators keep it', async () => {
		const { props, onchange } = editor(quantity, 'columnLt');
		const screen = await render(FilterEditor, props);
		const operator = screen.getByRole('combobox', { name: 'Operator' });
		expect(options(operator.element()).slice(-8)).toEqual([
			['columnEq', '= column'],
			['columnNe', '≠ column'],
			['columnGt', '> column'],
			['columnGte', '≥ column'],
			['columnLt', '< column'],
			['columnLte', '≤ column'],
			['empty', 'is empty'],
			['notEmpty', 'is not empty']
		]);
		const column = screen.getByRole('combobox', { name: 'Quantity Column' });
		expect(column.element().closest('.aurora-filter-value')).toHaveAttribute('data-input', 'column');
		await expect.element(column).toHaveValue('');
		expect(options(column.element())).toEqual([
			['minQuantity', 'Minimum'],
			['maxQuantity', 'Maximum']
		]);
		await column.selectOptions('maxQuantity');
		expect(last(onchange)).toMatchObject({ operator: 'columnLt', value: 'maxQuantity' });
		expect(isConditionComplete(last(onchange)!, quantity)).toBe(true);
		await operator.selectOptions('columnGte');
		expect(last(onchange)).toMatchObject({ operator: 'columnGte', value: 'maxQuantity' });
		await operator.selectOptions('eq');
		expect(last(onchange)).toMatchObject({ operator: 'eq', value: undefined });
	});

	describe('suggest', () => {
		test('match comes first; typing sets the text, the suggestions come ~250 ms after the last key', async () => {
			let lastInput = 0;
			const delays: number[] = [];
			const suggest = vi.fn(async ({ searchText }: { searchText: string; signal: AbortSignal }) => {
				delays.push(performance.now() - lastInput);
				return search(searchText);
			});
			const field = productField(suggest);
			expect(fieldOperators(field)[0].name).toBe('match');
			const { props, onchange } = editor(field, 'match');
			const screen = await render(FilterEditor, props);
			await expect.element(screen.getByRole('combobox', { name: 'Operator' })).toHaveValue('match');
			const input = screen.getByRole('combobox', { name: 'Product' });
			input.element().addEventListener('input', (event) => (lastInput = event.timeStamp));
			expect(input.element().closest('.aurora-filter-value')).toHaveAttribute('data-input', 'suggest');
			await expect.element(input).toHaveAttribute('aria-autocomplete', 'list');
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await input.click();
			await userEvent.keyboard('p-1');
			expect(last(onchange)!.value).toBe('p-1');
			const listbox = screen.getByRole('listbox', { name: 'Product' });
			await expect.element(listbox.getByRole('option').first()).toBeVisible();
			expect(suggest.mock.lastCall![0].searchText).toBe('p-1');
			expect(suggest.mock.lastCall![0].signal).toBeInstanceOf(AbortSignal);
			expect(delays.at(-1)).toBeGreaterThanOrEqual(240);
			const found = listbox.getByRole('option').elements();
			expect(found.map((option) => option.textContent?.trim())).toEqual(['P-100 Shampoo', 'P-140 Mask']);
			await expect.element(input).toHaveAttribute('aria-expanded', 'true');
			await expect.element(input).toHaveAttribute('aria-controls', listbox.element().id);
			await expect.element(input).toHaveAttribute('aria-activedescendant', found[0].id);
			expect(isConditionComplete(last(onchange)!, field)).toBe(true);
		});

		test('ArrowDown and ArrowUp move through the suggestions, wrapping; Enter picks one', async () => {
			const suggest = vi.fn(async ({ searchText }: { searchText: string; signal: AbortSignal }) => search(searchText));
			const field = productField(suggest);
			const { props, onchange } = editor(field, 'match');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Product' });
			await input.click();
			await userEvent.keyboard('p-');
			const listbox = screen.getByRole('listbox', { name: 'Product' });
			await expect.element(listbox.getByRole('option', { name: 'P-220 Oil' })).toBeVisible();
			const ids = listbox.getByRole('option').elements().map((option) => option.id);
			const steps: [string, number][] = [
				['{ArrowDown}', 1],
				['{ArrowDown}', 2],
				['{ArrowDown}', 0],
				['{ArrowUp}', 2],
				['{ArrowUp}', 1]
			];
			for (const [key, index] of steps) {
				await userEvent.keyboard(key);
				await expect.element(input).toHaveAttribute('aria-activedescendant', ids[index]);
				await expect.element(listbox.getByRole('option').nth(index)).toHaveAttribute('aria-selected', 'true');
			}
			await userEvent.keyboard('{Enter}');
			expect(last(onchange)!.value).toEqual({ value: 'P-140', label: 'P-140 Mask' });
			await expect.element(input).toHaveValue('P-140 Mask');
			await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			expect(input.element()).not.toHaveAttribute('aria-activedescendant');
			expect(isConditionComplete(last(onchange)!, field)).toBe(true);
		});

		test('a click picks a suggestion and keeps the focus; typing again goes back to free text', async () => {
			const suggest = vi.fn(async ({ searchText }: { searchText: string; signal: AbortSignal }) => search(searchText));
			const { props, onchange } = editor(productField(suggest), 'match');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Product' });
			await input.click();
			await userEvent.keyboard('oil');
			await screen.getByRole('listbox').getByRole('option', { name: 'P-220 Oil' }).click();
			expect(last(onchange)!.value).toEqual({ value: 'P-220', label: 'P-220 Oil' });
			await expect.element(input).toHaveValue('P-220 Oil');
			await expect.element(input).toHaveFocus();
			await userEvent.keyboard('{End}s');
			expect(last(onchange)!.value).toBe('P-220 Oils');
		});

		test('Escape closes the suggestions and keeps the typed text', async () => {
			const suggest = vi.fn(async ({ searchText }: { searchText: string; signal: AbortSignal }) => search(searchText));
			const { props, onchange } = editor(productField(suggest), 'match');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Product' });
			await input.click();
			await userEvent.keyboard('mask');
			await expect.element(screen.getByRole('listbox').getByRole('option', { name: 'P-140 Mask' })).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
			await expect.element(input).toHaveAttribute('aria-expanded', 'false');
			await expect.element(input).toHaveValue('mask');
			await expect.element(input).toHaveFocus();
			expect(last(onchange)!.value).toBe('mask');
		});

		test('with confirm, Enter on a suggestion picks it and a second Enter applies', async () => {
			const onapply = vi.fn<Change>();
			const suggest = vi.fn(async ({ searchText }: { searchText: string; signal: AbortSignal }) => search(searchText));
			const { props } = editor(productField(suggest), 'match', undefined, { confirm: true, onapply });
			const screen = await render(FilterEditor, props);
			await screen.getByRole('combobox', { name: 'Product' }).click();
			await userEvent.keyboard('sham');
			await expect.element(screen.getByRole('listbox').getByRole('option', { name: 'P-100 Shampoo' })).toBeVisible();
			await userEvent.keyboard('{Enter}');
			await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
			expect(onapply).not.toHaveBeenCalled();
			await userEvent.keyboard('{Enter}');
			expect(onapply).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({ operator: 'match', value: { value: 'P-100', label: 'P-100 Shampoo' } })
			);
		});

		test('a new text aborts the request in flight and a stale answer is ignored; blank text asks nothing', async () => {
			const requests: { searchText: string; signal: AbortSignal; resolve: (items: FilterItem[]) => void }[] = [];
			const suggest = vi.fn(
				({ searchText, signal }: { searchText: string; signal: AbortSignal }) =>
					new Promise<FilterItem[]>((resolve) => requests.push({ searchText, signal, resolve }))
			);
			const { props } = editor(productField(suggest), 'match');
			const screen = await render(FilterEditor, props);
			const input = screen.getByRole('combobox', { name: 'Product' });
			await input.click();
			await userEvent.keyboard('oil');
			await expect.poll(() => requests.at(-1)?.searchText).toBe('oil');
			const stale = requests.at(-1)!;
			expect(stale.signal.aborted).toBe(false);
			await userEvent.keyboard('{Backspace}');
			expect(stale.signal.aborted).toBe(true);
			stale.resolve(search('oil'));
			await expect.poll(() => requests.at(-1)?.searchText).toBe('oi');
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(document.querySelector('[role="listbox"]')).toBeNull();
			requests.at(-1)!.resolve(search('oi'));
			await expect.element(screen.getByRole('listbox').getByRole('option', { name: 'P-220 Oil' })).toBeVisible();

			const count = suggest.mock.calls.length;
			await userEvent.fill(input, '   ');
			await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
			await new Promise((resolve) => setTimeout(resolve, 400));
			expect(suggest).toHaveBeenCalledTimes(count);
		});
	});
});

describe('FilterEditor: placeholders, chips and toggles', () => {
	const placeholder = (screen: Awaited<ReturnType<typeof render>>) =>
		screen.container.querySelector('.aurora-filter-value input')?.getAttribute('placeholder');

	test('every input has a placeholder: Value, Choose…, Search… or Amount; the placeholder of the field wins', async () => {
		const searcher = async () => STAFF;
		const suggest = async () => [];
		const cases: [FilterField, string, string][] = [
			[radioField, 'contains', 'Value'],
			[fieldOf('client'), 'contains', 'Name or surname'],
			[fieldOf('amount'), 'gte', 'Value'],
			[fieldOf('service'), 'in', 'Choose…'],
			[{ ...(fieldOf('service') as SelectFilterField), placeholder: 'Any service' }, 'in', 'Any service'],
			[{ name: 'staff', label: 'Staff', type: 'select', searcher }, 'in', 'Search…'],
			[{ name: 'staff', label: 'Staff', type: 'select', searcher, placeholder: 'Type a name' }, 'in', 'Type a name'],
			[fieldOf('country'), 'in', 'Choose…'],
			[{ name: 'product', label: 'Product', type: 'string', suggest }, 'match', 'Search…'],
			[{ name: 'product', label: 'Product', type: 'string', suggest, placeholder: 'Code or name' }, 'match', 'Code or name'],
			[fieldOf('date'), 'inLast', 'Amount']
		];
		for (const [field, operator, expected] of cases) {
			const screen = await render(FilterEditor, editor(field, operator).props);
			expect(placeholder(screen), `${field.name} ${operator}`).toBe(expected);
			await screen.unmount();
		}
	});

	test('with FILTER_LABELS_IT the lists, the searches and the date fields inside are in Italian too', async () => {
		const italian = { labels: FILTER_LABELS_IT, locale: 'it' };
		const service = await render(FilterEditor, editor(fieldOf('service'), 'in', [SERVICES[0]], italian).props);
		await expect.element(service.getByRole('button', { name: `Rimuovi ${SERVICES[0].label}` })).toBeVisible();
		await service.getByRole('combobox', { name: 'Service' }).click();
		await userEvent.keyboard('zzz');
		await expect.element(service.getByText('Nessun risultato')).toBeVisible();
		await service.unmount();

		const staffField: FilterField = { name: 'staff', label: 'Staff', type: 'select', searcher: async () => STAFF };
		const staff = await render(FilterEditor, editor(staffField, 'in', undefined, italian).props);
		await staff.getByRole('combobox', { name: 'Staff' }).click();
		await expect.element(staff.getByText('Scrivi almeno 2 caratteri')).toBeVisible();
		await staff.unmount();

		const date = await render(FilterEditor, editor(fieldOf('date'), 'is', undefined, italian).props);
		expect(date.container.querySelector('.aurora-date-picker-text-field-format')?.textContent?.trim()).toBe('gg/mm/aaaa');
		await date.getByRole('button', { name: 'Scegli la data' }).click();
		await expect.element(date.getByRole('button', { name: 'Mese precedente' })).toBeVisible();
		await expect.element(date.getByRole('button', { name: 'Mese successivo' })).toBeVisible();
		await userEvent.fill(date.getByRole('combobox', { name: 'Date', exact: true }), '31/02/2026');
		await userEvent.keyboard('{Tab}');
		await expect.element(date.getByText('Inserisci una data valida')).toBeVisible();
	});

	test('the default placeholders follow labels', async () => {
		const labels = FILTER_LABELS_IT;
		const cases: [FilterField, string, string][] = [
			[radioField, 'contains', 'Valore'],
			[fieldOf('service'), 'in', 'Scegli…'],
			[{ name: 'staff', label: 'Staff', type: 'select', searcher: async () => STAFF }, 'in', 'Cerca…'],
			[fieldOf('date'), 'inLast', 'Quantità']
		];
		for (const [field, operator, expected] of cases) {
			const screen = await render(FilterEditor, editor(field, operator, undefined, { labels }).props);
			expect(placeholder(screen)).toBe(expected);
			await screen.unmount();
		}
		const relative = await render(FilterEditor, editor(fieldOf('date'), 'inLast', undefined, { labels }).props);
		await expect.element(relative.getByRole('combobox', { name: 'Date Unità' })).toBeVisible();
	});

	test('a date shows its format beside the field, without a placeholder', async () => {
		const screen = await render(FilterEditor, editor(fieldOf('date'), 'is').props);
		const input = screen.getByRole('combobox', { name: 'Date', exact: true });
		expect(input.element().closest('.aurora-filter-value')!.querySelector('.aurora-date-picker-text-field-format')).not.toBeNull();
		expect(input.element()).not.toHaveAttribute('placeholder');
	});

	test('a range of dates has its format in the placeholders, so two whole dates fit in the card', async () => {
		const screen = await render(FilterEditor, editor(fieldOf('date'), 'between', { from: '2026-10-06', to: '2026-10-29' }).props);
		const value = screen.container.querySelector('.aurora-filter-value')!;
		expect(value.querySelector('.aurora-date-picker-text-field-format')).toBeNull();
		const inputs = [...value.querySelectorAll<HTMLInputElement>('input[type="text"]')];
		expect(inputs.map((input) => input.placeholder)).toEqual(['mm/dd/yyyy', 'mm/dd/yyyy']);
		expect(inputs.map((input) => input.value)).toEqual(['10/06/2026', '10/29/2026']);
		for (const input of inputs) expect(input.scrollWidth).toBeLessThanOrEqual(input.clientWidth);
	});

	test('lists of texts show three chips and "+N", which shows them all until "Show less"', async () => {
		const { props, onchange } = editor(fieldOf('client'), 'anyOf', ['a', 'b', 'c', 'd', 'e']);
		const screen = await render(FilterEditor, props);
		const more = screen.getByRole('button', { name: '+2' });
		expect(chips(screen.container)).toEqual(['a', 'b', 'c']);
		await expect.element(more).toHaveAttribute('aria-expanded', 'false');
		await expect.poll(() => tooltipText(more.element())).toBe('d, e');
		expect(more.element()).not.toHaveAttribute('title');
		await expect.element(more).toHaveAttribute('type', 'button');
		await more.click();
		await expect.poll(() => chips(screen.container)).toEqual(['a', 'b', 'c', 'd', 'e']);
		const less = screen.getByRole('button', { name: 'Show less' });
		await expect.element(less).toHaveAttribute('aria-expanded', 'true');
		expect(tooltipText(less.element())).toBeUndefined();
		await less.click();
		await expect.poll(() => chips(screen.container)).toEqual(['a', 'b', 'c']);
		await screen.getByRole('button', { name: 'Remove a' }).click();
		expect(last(onchange)!.value).toEqual(['b', 'c', 'd', 'e']);
		await expect.poll(() => chips(screen.container)).toEqual(['b', 'c', 'd']);
		await expect.poll(() => tooltipText(screen.getByRole('button', { name: '+1' }).element())).toBe('e');
		await screen.unmount();

		const three = await render(FilterEditor, editor(fieldOf('amount'), 'anyOf', [1, 2, 3]).props);
		expect(chips(three.container)).toEqual(['1', '2', '3']);
		expect(three.container.querySelector('.aurora-filter-value-more')).toBeNull();
		await three.unmount();

		const italian = await render(
			FilterEditor,
			editor(fieldOf('client'), 'anyOf', ['a', 'b', 'c', 'd'], { labels: FILTER_LABELS_IT }).props
		);
		await italian.getByRole('button', { name: '+1' }).click();
		await expect.element(italian.getByRole('button', { name: 'Mostra meno' })).toBeVisible();
	});

	test('options picked in an Autocomplete show two chips and a "+N" counter', async () => {
		const searcher = async () => STAFF;
		const cases: [FilterField, FilterItem[]][] = [
			[fieldOf('service'), SERVICES.slice(0, 3)],
			[{ name: 'staff', label: 'Staff', type: 'select', searcher }, STAFF],
			[
				fieldOf('country'),
				[
					{ value: 'IT', label: 'Italy' },
					{ value: 'FR', label: 'France' },
					{ value: 'DE', label: 'Germany' },
					{ value: 'ES', label: 'Spain' }
				]
			]
		];
		for (const [field, items] of cases) {
			const screen = await render(FilterEditor, editor(field, 'in', items).props);
			const value = screen.container.querySelector('.aurora-filter-value')!;
			await expect.poll(() => value.querySelectorAll('.aurora-autocomplete-selection .aurora-chip').length).toBe(2);
			const counter = value.querySelector('.aurora-autocomplete-counter');
			expect(counter?.textContent?.trim(), field.name).toBe(`+${items.length - 2}`);
			await screen.unmount();
		}
	});

	test('view toggle falls back to the Autocomplete when the labels do not fit the card', async () => {
		const long: FilterField = {
			name: 'stage',
			label: 'Stage',
			type: 'select',
			view: 'toggle',
			items: [
				{ value: 'waiting', label: 'Waiting for confirmation' },
				{ value: 'cancelled', label: 'Cancelled by the client' },
				{ value: 'confirmed', label: 'Confirmed' }
			]
		};
		const { props, onchange } = editor(long, 'in');
		const screen = await render(FilterEditor, props);
		expect(screen.container.querySelector('.aurora-filter-value-toggles')).toBeNull();
		const input = screen.getByRole('combobox', { name: 'Stage' });
		await input.click();
		await screen.getByRole('listbox').getByRole('option', { name: 'Confirmed' }).click();
		expect(last(onchange)!.value).toEqual([{ value: 'confirmed', label: 'Confirmed' }]);
		await screen.unmount();

		const short = await render(FilterEditor, editor(fieldOf('status'), 'in').props);
		expect(short.container.querySelector('.aurora-filter-value-toggles')).not.toBeNull();
	});
});

describe('FilterEditor locale', () => {
	test('follow setDefaultLocale, and the locale prop wins over it', async () => {
		const { props } = editor(radioField, 'contains', 'Ros', { confirm: true });
		const inherited = await renderWithDefaultLocale('it', FilterEditor, props);
		await expect.element(inherited.getByRole('button', { name: 'Applica' })).toBeVisible();
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', FilterEditor, { ...props, locale: 'en' });
		await expect.element(own.getByRole('button', { name: 'Apply' })).toBeVisible();
	});
});
