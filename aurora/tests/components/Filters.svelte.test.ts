import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Filters from '#lib/components/composed/search/Filters.svelte';
import {
	FilterBuilder,
	createFilters,
	filterCondition,
	filterConditions,
	filterGroup,
	filtersToBuilder,
	isFilterGroup,
	type FilterCondition,
	type FilterField,
	type FilterGroup,
	type FilterPreset,
	type SavedFilter,
	type SelectFilterField
} from '#lib';
import { instantDrawers, renderWithDefaultLocale, snippet, text, tooltipText } from '../helpers.js';
import { ICONS, SERVICES, fieldOf, fields, few } from '../fixtures/filters/fields.js';

type Change = { value: FilterGroup; builder: FilterBuilder };

function bound<T>(initial: T) {
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

async function setup(props: Record<string, unknown> = {}, initial?: FilterGroup) {
	const value = bound<FilterGroup | undefined>(initial);
	const onchange = vi.fn<(change: Change) => void>();
	const all: Record<string, unknown> = { fields, applyDelay: 0, onchange };
	Object.defineProperties(all, Object.getOwnPropertyDescriptors(props));
	Object.defineProperty(all, 'value', {
		enumerable: true,
		configurable: true,
		get: () => value.value,
		set: (next) => {
			value.value = next;
		}
	});
	const screen = await render(Filters, all as { fields: FilterField[] });
	return {
		screen,
		value,
		onchange,
		addButton: screen.getByRole('button', { name: 'Add filter', exact: true }).first(),
		filtersButton: screen.getByRole('button', { name: /^Filters/ }),
		clearButton: screen.getByRole('button', { name: 'Clear', exact: true })
	};
}

function pills() {
	return [...document.querySelectorAll('.aurora-filters-bar .aurora-filters-pill-main')].map((main) =>
		[...main.children].map((part) => part.textContent?.trim()).join(' · ')
	);
}

type Shape = { field: string; operator: string; value: unknown } | { logic: string; items: Shape[] };

function conditions(tree: FilterGroup | undefined): Shape[] {
	return (tree?.items ?? []).map((node): Shape =>
		'items' in node
			? { logic: node.logic, items: conditions(node) }
			: { field: node.field, operator: node.operator, value: node.value }
	);
}

function lastChange(onchange: ReturnType<typeof vi.fn<(change: Change) => void>>, list = fields) {
	const change = onchange.mock.lastCall![0];
	expect(change.builder).toBeInstanceOf(FilterBuilder);
	expect(change.builder.toJson()).toEqual(filtersToBuilder(change.value, list).toJson());
	return change;
}

function panelElement() {
	return document.querySelector<HTMLElement>('.aurora-filters-panel');
}

function panel() {
	return page.elementLocator(panelElement()!);
}

function logicOf(row: Element) {
	const cell = row.querySelector('.aurora-filter-row-logic');
	if (!cell) return undefined;
	const select = cell.querySelector('select');
	return select ? `[${select.selectedOptions[0]?.textContent?.trim()}]` : cell.textContent?.trim();
}

function rows(group: Element | null = panelElement()?.querySelector('.aurora-filter-group') ?? null) {
	return [...(group?.querySelectorAll(':scope > .aurora-filter-row') ?? [])].map((row) => ({
		element: row as HTMLElement,
		locator: page.elementLocator(row),
		logic: logicOf(row)
	}));
}

function fieldSelect(row: Element) {
	return row.querySelector<HTMLSelectElement>('.aurora-filter-row-condition select[aria-label="Field"]')!;
}

function operatorSelect(row: Element) {
	return row.querySelectorAll<HTMLSelectElement>('.aurora-filter-row-condition select')[1];
}

function footers() {
	return [...(panelElement()?.querySelectorAll('.aurora-filter-group-actions') ?? [])].map((footer) =>
		[...footer.querySelectorAll('button')].map((button) => button.textContent?.trim())
	);
}

function panelAdd() {
	return page.getByRole('button', { name: 'Add filter', exact: true }).last();
}

async function openPanel() {
	await page.getByRole('button', { name: /^Filters/ }).click();
	await expect.element(panel()).toBeVisible();
}

function card(name: string) {
	return page.getByRole('group', { name, exact: true }).first();
}

async function pickField(setupResult: Awaited<ReturnType<typeof setup>>, label: string) {
	await setupResult.addButton.click();
	await page.getByRole('option', { name: label, exact: true }).click();
	await expect.element(card(label)).toBeVisible();
}

const initial = () =>
	createFilters([
		filterCondition('service', 'in', [SERVICES[2]]),
		filterCondition('amount', 'gte', 50)
	]);

describe('Filters', () => {
	describe('bar', () => {
		test('shows the Filters button with the count, a pill per condition, Add filter and Clear', async () => {
			const { screen, filtersButton, addButton, clearButton } = await setup({}, initial());
			await expect.element(filtersButton).toHaveAttribute('aria-haspopup', 'dialog');
			await expect.element(filtersButton).toHaveAttribute('aria-expanded', 'false');
			expect(filtersButton.element().querySelector('.aurora-filters-count')?.textContent).toBe('2');
			expect(pills()).toEqual(['Service · is · Balayage', 'Amount · ≥ · 50 €']);
			await expect.element(addButton).toHaveAttribute('aria-haspopup', 'listbox');
			await expect.element(addButton).toHaveAttribute('aria-expanded', 'false');
			await expect.element(clearButton).toBeVisible();
			const root = screen.container.querySelector('.aurora-filters');
			expect(root).toHaveAttribute('data-count', '2');
			expect(root).not.toHaveAttribute('data-open');
			const pill = screen.getByRole('button', { name: 'Edit filter: Service is Balayage' });
			expect(pill.element().querySelector('svg path')?.getAttribute('d')).toBe(ICONS.service);
		});

		test('without conditions: no count, no pills, no Clear', async () => {
			const { screen, filtersButton } = await setup();
			await expect.element(filtersButton).toBeVisible();
			expect(filtersButton.element().querySelector('.aurora-filters-count')).toBeNull();
			expect(pills()).toEqual([]);
			await expect.element(screen.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
			expect(screen.container.querySelector('.aurora-filters')).toHaveAttribute('data-count', '0');
		});

		test('the count shows only complete conditions of visible fields', async () => {
			const { filtersButton } = await setup(
				{},
				createFilters([
					filterCondition('tenant', 'eq', 12, { locked: true }),
					filterCondition('client', 'contains', ''),
					filterCondition('paid', 'isFalse'),
					filterGroup('or', [filterCondition('amount', 'lt', 10), filterCondition('amount', 'gt', 90)])
				])
			);
			await expect
				.poll(() => filtersButton.element().querySelector('.aurora-filters-count')?.textContent)
				.toBe('3');
		});

		test('pills show label · operator · value for every kind of value', async () => {
			const formatted: FilterField = { ...fieldOf('client'), name: 'code', label: 'Code', format: (c) => `#${c.value}` };
			await setup(
				{ fields: [...fields, formatted] },
				createFilters([
					filterCondition('client', 'contains', 'Rossi'),
					filterCondition('client', 'empty'),
					filterCondition('amount', 'between', { from: 10 }),
					filterCondition('amount', 'between', { from: 10, to: 1234.5 }),
					filterCondition('date', 'is', '2026-10-09'),
					filterCondition('date', 'between', { from: '2026-10-01', to: '2026-10-31' }),
					filterCondition('date', 'period', 'thisMonth'),
					filterCondition('date', 'inLast', 30),
					filterCondition('service', 'notIn', SERVICES.slice(0, 3)),
					filterCondition('paid', 'isFalse'),
					filterCondition('code', 'is', 'A1')
				])
			);
			expect(pills()).toEqual([
				'Client · contains · Rossi',
				'Client · is empty',
				'Amount · between · from 10 €',
				'Amount · between · 10 € – 1,234.5 €',
				'Date · is · Oct 9, 2026',
				'Date · between · Oct 1, 2026 – Oct 31, 2026',
				'Date · in · This month',
				'Date · in the last · 30 days',
				'Service · is not · Cut +2',
				'Paid · No',
				'Code · is · #A1'
			]);
		});

		test('v4 bug: the × of a pill is its own button with a label, not a div inside the pill button', async () => {
			const { screen, value, onchange } = await setup({}, initial());
			const main = screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' });
			const remove = screen.getByRole('button', { name: 'Remove filter: Amount' });
			await expect.element(main).toHaveAttribute('type', 'button');
			await expect.element(remove).toHaveAttribute('type', 'button');
			expect(main.element().contains(remove.element())).toBe(false);
			expect(remove.element().contains(main.element())).toBe(false);
			expect(main.element().parentElement).toBe(remove.element().parentElement);
			await remove.click();
			expect(pills()).toEqual(['Service · is · Balayage']);
			expect(conditions(value.value)).toEqual([{ field: 'service', operator: 'in', value: [SERVICES[2]] }]);
			expect(lastChange(onchange).value).toEqual(value.value);
		});

		test('Clear removes every condition except the locked ones', async () => {
			const { clearButton, value } = await setup(
				{},
				createFilters([
					filterCondition('tenant', 'eq', 12, { locked: true }),
					filterCondition('status', 'in', [{ value: 'confirmed', label: 'Confirmed' }], { locked: true }),
					filterCondition('client', 'contains', 'Ros'),
					filterGroup('or', [filterCondition('amount', 'lt', 10), filterCondition('amount', 'gt', 90)])
				])
			);
			await clearButton.click();
			expect(conditions(value.value)).toEqual([
				{ field: 'tenant', operator: 'eq', value: 12 },
				{ field: 'status', operator: 'in', value: [{ value: 'confirmed', label: 'Confirmed' }] }
			]);
			expect(pills()).toEqual(['Status · is · Confirmed']);
			await expect.element(clearButton).not.toBeInTheDocument();
		});

		test('locked conditions have no × and their pill does not open the card', async () => {
			const { screen } = await setup(
				{},
				createFilters([filterCondition('client', 'is', 'Rossi', { locked: true })])
			);
			const pill = screen.getByRole('button', { name: 'Edit filter: Client is Rossi' });
			await expect.element(pill).toBeDisabled();
			await expect.element(pill).not.toHaveAttribute('aria-haspopup');
			expect(pill.element().parentElement).toHaveAttribute('data-locked');
			await expect.element(screen.getByRole('button', { name: /^Remove filter/ })).not.toBeInTheDocument();
			await pill.click({ force: true });
			await expect.element(card('Client')).not.toBeInTheDocument();
		});

		test('hidden fields never show, in the bar, the field list or the panel, but reach the builder', async () => {
			const setupResult = await setup(
				{},
				createFilters([filterCondition('tenant', 'eq', 12, { locked: true })])
			);
			const { screen, addButton, filtersButton, onchange } = setupResult;
			expect(pills()).toEqual([]);
			expect(screen.container.textContent).not.toContain('Salon');
			await addButton.click();
			await expect.element(screen.getByRole('listbox', { name: 'Add filter' })).toBeVisible();
			const options = screen.getByRole('option').elements().map((option) => option.textContent?.trim());
			expect(options).toHaveLength(8);
			expect(options).not.toContain('Salon');
			await userEvent.keyboard('{Escape}');
			await filtersButton.click();
			await expect.element(panel()).toBeVisible();
			expect(rows()).toHaveLength(0);
			expect(panelElement()!.textContent).not.toContain('Salon');
			await userEvent.keyboard('{Escape}');

			await pickField(setupResult, 'Paid');
			const { value, builder } = lastChange(onchange);
			expect(conditions(value)).toEqual([
				{ field: 'tenant', operator: 'eq', value: 12 },
				{ field: 'paid', operator: 'isTrue', value: undefined }
			]);
			expect(builder.toJson().modifiers).toEqual([
				{ method: 'where', kind: 'simple', key: 'appointments.salonId', operator: '=', value: 12, logicalOperator: 'and' },
				{ method: 'where', kind: 'simple', key: 'appointments.paid', operator: '=', value: true, logicalOperator: 'and' }
			]);
		});

		test('a pinned field is a pill until it has a condition; a click opens its card', async () => {
			const pinnedFields = fields.map((field) => (field.name === 'status' ? { ...field, pinned: true } : field));
			const { screen, value } = await setup({ fields: pinnedFields });
			const ghost = screen.getByRole('button', { name: 'Status', exact: true });
			await expect.element(ghost).toHaveClass('aurora-filters-pinned');
			await ghost.click();
			const editor = card('Status');
			await expect.element(editor).toBeVisible();
			await editor.getByRole('button', { name: 'Waiting' }).click();
			expect(pills()).toEqual(['Status · is · Waiting']);
			const pill = screen.getByRole('button', { name: 'Edit filter: Status is Waiting' });
			await expect.element(pill).toHaveAttribute('aria-expanded', 'true');
			await expect
				.poll(() => editor.element().getBoundingClientRect().top)
				.toBeGreaterThanOrEqual(pill.element().getBoundingClientRect().bottom);
			await userEvent.keyboard('{Escape}');
			await expect.element(editor).not.toBeInTheDocument();
			await expect.element(pill).toHaveFocus();
			await expect.element(screen.getByRole('button', { name: 'Status', exact: true })).not.toBeInTheDocument();
			expect(conditions(value.value)).toEqual([
				{ field: 'status', operator: 'in', value: [{ value: 'waiting', label: 'Waiting' }] }
			]);
			await screen.getByRole('button', { name: 'Remove filter: Status' }).click();
			await expect.element(screen.getByRole('button', { name: 'Status', exact: true })).toBeVisible();
		});

		test('a pinned bool field gets its pill at once, and the card follows it', async () => {
			const pinnedFields = fields.map((field) => (field.name === 'paid' ? { ...field, pinned: true } : field));
			const { screen } = await setup({ fields: pinnedFields });
			await screen.getByRole('button', { name: 'Paid', exact: true }).click();
			const editor = card('Paid');
			await expect.element(editor).toBeVisible();
			expect(pills()).toEqual(['Paid · Yes']);
			const pill = screen.getByRole('button', { name: /^Edit filter: Paid/ });
			await expect
				.poll(() => editor.element().getBoundingClientRect().top)
				.toBeGreaterThanOrEqual(pill.element().getBoundingClientRect().bottom);
			await editor.getByRole('radio', { name: 'No' }).click();
			expect(pills()).toEqual(['Paid · No']);
		});

		test('the card of a new filter moves from Add filter onto its pill once the pill exists', async () => {
			const result = await setup({}, initial());
			await pickField(result, 'Service');
			const editor = card('Service');
			const menu = () => editor.element().closest('.aurora-menu')!;
			const left = (element: Element) => Math.round(element.getBoundingClientRect().left);
			await expect.poll(() => left(menu())).toBe(left(result.addButton.element()));
			const before = left(result.addButton.element());

			await page.getByRole('option', { name: SERVICES[0].label as string, exact: true }).click();
			const pill = result.screen.getByRole('button', { name: /^Edit filter: Service/ }).last();
			await expect.element(pill).toHaveAttribute('aria-expanded', 'true');
			expect(left(result.addButton.element())).toBeGreaterThan(before);
			await expect.poll(() => left(menu())).toBe(left(pill.element()));
			await expect.element(editor).toBeVisible();
		});

		test('a click on the next pill reaches it even when the pill being edited goes away because it is left incomplete', async () => {
			const { screen, value } = await setup({}, initial());
			await screen.getByRole('button', { name: /^Edit filter: Service/ }).click();
			const service = card('Service');
			await expect.element(service).toBeVisible();
			await service.getByRole('button', { name: `Remove ${SERVICES[2].label}` }).click();
			expect(conditions(value.value)[0]).toEqual({ field: 'service', operator: 'in', value: [] });

			await screen.getByRole('button', { name: /^Edit filter: Amount/ }).click();
			await expect.element(card('Amount')).toBeVisible();
			await expect.element(screen.getByRole('button', { name: /^Edit filter: Amount/ })).toHaveAttribute('aria-expanded', 'true');
			await expect.poll(() => conditions(value.value)).toEqual([{ field: 'amount', operator: 'gte', value: 50 }]);
			expect(pills()).toHaveLength(1);
		});

		test('presets are toggle chips that add and remove conditions tagged with the preset id', async () => {
			const presets: FilterPreset[] = [
				{ id: 'today', label: 'Today', count: 18, conditions: [{ field: 'date', operator: 'period', value: 'today' }] },
				{
					id: 'unpaid',
					label: 'Not paid',
					conditions: [
						{ field: 'paid', operator: 'isFalse' },
						{ field: 'amount', operator: 'gt', value: 0 }
					]
				}
			];
			const { screen, value, onchange } = await setup({ presets }, initial());
			const group = screen.getByRole('group', { name: 'Filters' });
			const today = group.getByRole('button', { name: /^Today/ });
			await expect.element(today).toHaveAttribute('aria-pressed', 'false');
			expect(today.element().textContent).toContain('18');
			await today.click();
			await expect.element(today).toHaveAttribute('aria-pressed', 'true');
			expect(value.value!.items.slice(2)).toEqual([
				expect.objectContaining({ field: 'date', operator: 'period', value: 'today', preset: 'today' })
			]);
			expect(pills()).toContain('Date · in · Today');
			await group.getByRole('button', { name: 'Not paid' }).click();
			expect(conditions(value.value).slice(3)).toEqual([
				{ field: 'paid', operator: 'isFalse', value: undefined },
				{ field: 'amount', operator: 'gt', value: 0 }
			]);
			expect(lastChange(onchange).value).toEqual(value.value);

			await today.click();
			await expect.element(today).toHaveAttribute('aria-pressed', 'false');
			expect(value.value!.items.some((node) => 'preset' in node && node.preset === 'today')).toBe(false);
			expect(conditions(value.value)).toHaveLength(4);
		});

		test('prependSnippet, appendSnippet and actionsSnippet are rendered in the bar', async () => {
			const { screen } = await setup(
				{
					prependSnippet: snippet('<input aria-label="Search" />'),
					appendSnippet: snippet('<button type="button">Saved views</button>'),
					actionsSnippet: snippet('<button type="button">New appointment</button>')
				},
				initial()
			);
			const bar = screen.container.querySelector('.aurora-filters-bar')!;
			expect(bar.firstElementChild).toBe(screen.getByRole('textbox', { name: 'Search' }).element());
			const children = [...bar.children];
			const index = (element: Element) => children.indexOf(element);
			const append = screen.getByRole('button', { name: 'Saved views' }).element();
			expect(index(append)).toBeGreaterThan(index(screen.getByRole('button', { name: 'Clear' }).element()));
			const actions = bar.lastElementChild!;
			expect(actions).toHaveClass('aurora-filters-actions');
			expect(actions.textContent).toBe('New appointment');
		});

		test('pillSnippet replaces the text of the pill, which keeps its buttons', async () => {
			const seen: unknown[] = [];
			const pillSnippet = createRawSnippet<
				[{ condition: { field: string }; field: FilterField; operator: string; value: string }]
			>((params) => ({
				render: () => {
					const { condition, field, operator, value } = params();
					seen.push({ field: condition.field, label: field.label, operator, value });
					return `<b>${field.label}: ${value}</b>`;
				}
			}));
			const { screen } = await setup({ pillSnippet }, initial());
			expect(seen).toEqual([
				{ field: 'service', label: 'Service', operator: 'is', value: 'Balayage' },
				{ field: 'amount', label: 'Amount', operator: '≥', value: '50 €' }
			]);
			const main = screen.getByRole('button', { name: 'Edit filter: Service is Balayage' });
			expect(main.element().innerHTML).toContain('<b>Service: Balayage</b>');
			await expect.element(screen.getByRole('button', { name: 'Remove filter: Service' })).toBeVisible();
			await main.click();
			await expect.element(card('Service')).toBeVisible();
		});

		test('showPills={false} hides pills and pinned fields; class reaches each part', async () => {
			const pinnedFields = fields.map((field) => (field.name === 'status' ? { ...field, pinned: true } : field));
			const { screen, filtersButton } = await setup(
				{
					fields: pinnedFields,
					showPills: false,
					class: { container: 'c', bar: 'b', pill: 'p', panel: 'x' }
				},
				initial()
			);
			expect(pills()).toEqual([]);
			await expect.element(screen.getByRole('button', { name: 'Status', exact: true })).not.toBeInTheDocument();
			expect(screen.container.querySelector('.aurora-filters')).toHaveClass('c');
			expect(screen.container.querySelector('.aurora-filters-bar')).toHaveClass('b');
			await filtersButton.click();
			await expect.element(panel()).toHaveClass('x');
			await screen.rerender({ showPills: true });
			expect(screen.container.querySelector('.aurora-filters-pill')).toHaveClass('p');
		});
	});

	describe('adding from the bar', () => {
		test('Add filter lists the visible fields by category, with a search when they are more than 7', async () => {
			const { screen, addButton } = await setup();
			await addButton.click();
			await expect.element(addButton).toHaveAttribute('aria-expanded', 'true');
			const search = screen.getByRole('combobox', { name: 'Search fields' });
			await expect.element(search).toHaveFocus();
			const listbox = screen.getByRole('listbox', { name: 'Add filter' });
			await expect.element(search).toHaveAttribute('aria-controls', listbox.element().id);
			const categories = [...listbox.element().querySelectorAll('.aurora-filter-fields-category')].map(
				(category) => category.textContent
			);
			expect(categories).toEqual(['Client', 'Appointment', 'Payment']);
			const options = () => screen.getByRole('option').elements().map((option) => option.textContent?.trim());
			expect(options()).toEqual(['Client', 'Country', 'Tags', 'Service', 'Status', 'Date', 'Amount', 'Paid']);
			await userEvent.keyboard('pay');
			await expect.poll(options).toEqual(['Amount', 'Paid']);
			await userEvent.keyboard('{Backspace}{Backspace}{Backspace}stàtus');
			await expect.poll(options).toEqual(['Status']);
			await userEvent.keyboard('x');
			await expect.poll(options).toEqual([]);
			await expect.element(screen.getByText('No fields')).toBeVisible();
		});

		test('v4 bug: the field list has a search, driven by the keyboard', async () => {
			const { screen, addButton } = await setup();
			await addButton.click();
			const search = screen.getByRole('combobox', { name: 'Search fields' });
			await expect.element(search).toHaveFocus();
			const active = () => document.getElementById(search.element().getAttribute('aria-activedescendant')!);
			expect(active()?.textContent?.trim()).toBe('Client');
			await userEvent.keyboard('{ArrowDown}{ArrowDown}');
			expect(active()?.textContent?.trim()).toBe('Tags');
			await expect.element(screen.getByRole('option', { name: 'Tags' })).toHaveAttribute('aria-selected', 'true');
			await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
			expect(active()?.textContent?.trim()).toBe('Paid');
			await userEvent.keyboard('dat');
			expect(active()?.textContent?.trim()).toBe('Date');
			await userEvent.keyboard('{Enter}');
			await expect.element(card('Date')).toBeVisible();
		});

		test('with 7 fields or fewer there is no search and the list takes the focus', async () => {
			const { screen, addButton } = await setup({ fields: few });
			await addButton.click();
			const listbox = screen.getByRole('listbox', { name: 'Add filter' });
			await expect.element(listbox).toHaveFocus();
			await expect.element(screen.getByRole('combobox', { name: 'Search fields' })).not.toBeInTheDocument();
			await userEvent.keyboard('{ArrowDown}');
			const active = document.getElementById(listbox.element().getAttribute('aria-activedescendant')!);
			expect(active?.textContent?.trim()).toBe('Service');
			await userEvent.keyboard('{Enter}');
			await expect.element(card('Service')).toBeVisible();
		});

		test('picking a field opens its card; a complete value adds the condition and calls onchange', async () => {
			const setupResult = await setup();
			const { screen, value, onchange } = setupResult;
			await pickField(setupResult, 'Client');
			const input = card('Client').getByRole('textbox', { name: 'Client' });
			await expect.element(input).toHaveFocus();
			expect(onchange).not.toHaveBeenCalled();
			await userEvent.keyboard('Mario Rossi');
			expect(pills()).toEqual(['Client · contains · Mario Rossi']);
			expect(conditions(value.value)).toEqual([{ field: 'client', operator: 'contains', value: 'Mario Rossi' }]);
			const change = lastChange(onchange);
			expect(change.value).toEqual(value.value);
			expect(change.builder.toJson().modifiers).toHaveLength(2);
			await expect
				.element(screen.getByRole('button', { name: 'Edit filter: Client contains Mario Rossi' }))
				.toHaveAttribute('aria-expanded', 'true');
		});

		test('onchange waits applyDelay after the last change (300 ms by default)', async () => {
			const setupResult = await setup({ applyDelay: undefined });
			const { onchange } = setupResult;
			let lastInput = 0;
			let calledAt = 0;
			const track = (event: Event) => (lastInput = event.timeStamp);
			document.addEventListener('input', track, true);
			onchange.mockImplementation(() => (calledAt = performance.now()));
			await pickField(setupResult, 'Client');
			await userEvent.keyboard('Rossi');
			await expect.poll(() => onchange.mock.calls.length, { timeout: 2000, interval: 20 }).toBe(1);
			document.removeEventListener('input', track, true);
			expect(calledAt - lastInput).toBeGreaterThanOrEqual(280);
			expect(conditions(lastChange(onchange).value)).toEqual([
				{ field: 'client', operator: 'contains', value: 'Rossi' }
			]);
			await new Promise((resolve) => setTimeout(resolve, 400));
			expect(onchange).toHaveBeenCalledOnce();
		});

		test('closing the card with an incomplete new condition leaves no condition', async () => {
			const setupResult = await setup();
			const { value, onchange, addButton } = setupResult;
			await pickField(setupResult, 'Amount');
			await userEvent.keyboard('{Escape}');
			await expect.element(card('Amount')).not.toBeInTheDocument();
			await expect.element(addButton).toHaveFocus();
			expect(pills()).toEqual([]);
			expect(value.value?.items ?? []).toEqual([]);

			await pickField(setupResult, 'Amount');
			await userEvent.keyboard('5');
			expect(pills()).toEqual(['Amount · = · 5 €']);
			await userEvent.keyboard('{Backspace}');
			expect(pills()).toEqual(['Amount · =']);
			expect(document.querySelector('.aurora-filters-pill')).toHaveAttribute('data-incomplete');
			await userEvent.keyboard('{Escape}');
			await expect.element(card('Amount')).not.toBeInTheDocument();
			await expect.poll(pills).toEqual([]);
			expect(value.value?.items).toEqual([]);
			expect(lastChange(onchange).builder.toJson().modifiers).toEqual([]);
		});

		test('reopening the field list drops the incomplete condition of the card', async () => {
			const setupResult = await setup();
			const { value, addButton } = setupResult;
			await pickField(setupResult, 'Amount');
			await userEvent.keyboard('5{Backspace}');
			expect(conditions(value.value)).toEqual([{ field: 'amount', operator: 'eq', value: undefined }]);
			await addButton.click();
			await expect.element(page.getByRole('listbox', { name: 'Add filter' })).toBeVisible();
			expect(value.value?.items).toEqual([]);
			await userEvent.keyboard('{Escape}');
			await setupResult.filtersButton.click();
			expect(rows()).toHaveLength(0);
		});

		test('Enter in the value closes the card and gives the focus back to Add filter', async () => {
			const setupResult = await setup();
			await pickField(setupResult, 'Client');
			await userEvent.keyboard('Rossi{Enter}');
			await expect.element(card('Client')).not.toBeInTheDocument();
			await expect.element(setupResult.addButton).toHaveFocus();
			expect(pills()).toEqual(['Client · contains · Rossi']);
		});

		test('a bool field is complete at once: Paid · Yes, then No', async () => {
			const setupResult = await setup();
			const { onchange } = setupResult;
			await pickField(setupResult, 'Paid');
			expect(pills()).toEqual(['Paid · Yes']);
			await card('Paid').getByRole('radio', { name: 'No' }).click();
			expect(pills()).toEqual(['Paid · No']);
			expect(lastChange(onchange).builder.toJson().modifiers).toEqual([
				{ method: 'where', kind: 'simple', key: 'appointments.paid', operator: '=', value: false, logicalOperator: 'and' }
			]);
		});

		test('v4 bug: a false boolean is filtered as = false', async () => {
			const { onchange, screen } = await setup(
				{},
				createFilters([filterCondition('paid', 'isTrue')])
			);
			await screen.getByRole('button', { name: /^Edit filter: Paid/ }).click();
			await card('Paid').getByRole('radio', { name: 'No' }).click();
			expect(lastChange(onchange).builder.toJson().modifiers).toEqual([
				expect.objectContaining({ key: 'appointments.paid', operator: '=', value: false })
			]);
		});

		test('the same field can be added twice', async () => {
			const setupResult = await setup({}, initial());
			await pickField(setupResult, 'Amount');
			await userEvent.keyboard('100{Enter}');
			expect(pills()).toEqual(['Service · is · Balayage', 'Amount · ≥ · 50 €', 'Amount · = · 100 €']);
		});

		test('a date typed in the card becomes yyyy-MM-dd in the value', async () => {
			const setupResult = await setup();
			await pickField(setupResult, 'Date');
			await userEvent.keyboard('10092026');
			expect(conditions(setupResult.value.value)).toEqual([{ field: 'date', operator: 'is', value: '2026-10-09' }]);
			expect(pills()).toEqual(['Date · is · Oct 9, 2026']);
		});

		test('items picked in the Autocomplete of the card stay open for more picks', async () => {
			const setupResult = await setup();
			await pickField(setupResult, 'Service');
			const input = card('Service').getByRole('combobox', { name: 'Service' });
			await input.click();
			await page.getByRole('option', { name: 'Color' }).click();
			await page.getByRole('option', { name: 'Cut' }).click();
			expect(pills()).toEqual(['Service · is · Color +1']);
			await userEvent.keyboard('{Escape}');
			await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
			await expect.element(card('Service')).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await expect.element(card('Service')).not.toBeInTheDocument();
		});
	});

	describe('editing a pill', () => {
		test('a click on a pill opens its card with Remove; edits update the pill', async () => {
			const tree = initial();
			const { screen, value, onchange } = await setup({}, tree);
			const pill = screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' });
			await expect.element(pill).toHaveAttribute('aria-haspopup', 'dialog');
			await pill.click();
			const editor = card('Amount');
			await expect.element(editor).toBeVisible();
			await expect.element(screen.getByRole('button', { name: /^Edit filter: Amount/ })).toHaveAttribute('aria-expanded', 'true');
			const input = editor.getByRole('spinbutton', { name: 'Amount' });
			await expect.element(input).toHaveValue(50);
			await userEvent.fill(input, '80');
			expect(pills()).toEqual(['Service · is · Balayage', 'Amount · ≥ · 80 €']);
			await editor.getByRole('combobox', { name: 'Operator' }).selectOptions('lt');
			expect(pills()).toEqual(['Service · is · Balayage', 'Amount · < · 80 €']);
			expect(conditions(lastChange(onchange).value)[1]).toEqual({ field: 'amount', operator: 'lt', value: 80 });
			expect(value.value!.items[1].id).toBe(tree.items[1].id);

			await editor.getByRole('button', { name: 'Remove' }).click();
			await expect.element(editor).not.toBeInTheDocument();
			expect(pills()).toEqual(['Service · is · Balayage']);
		});

		test('the card of a pill focuses its value input', async () => {
			const { screen } = await setup({}, initial());
			await screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
			await expect.element(card('Amount').getByRole('spinbutton', { name: 'Amount' })).toHaveFocus();
		});

		test('v4 bug: Escape closes the card and gives the focus back', async () => {
			const { screen } = await setup({}, initial());
			const pill = screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' });
			await pill.click();
			await expect.element(card('Amount')).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await expect.element(card('Amount')).not.toBeInTheDocument();
			await expect.element(screen.getByRole('button', { name: /^Edit filter: Amount/ })).toHaveFocus();
		});

		test('the close button of the card closes it and keeps the edits', async () => {
			const { screen, value } = await setup({}, initial());
			await screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
			await userEvent.fill(card('Amount').getByRole('spinbutton'), '70');
			await card('Amount').getByRole('button', { name: 'Close' }).click();
			await expect.element(card('Amount')).not.toBeInTheDocument();
			expect(conditions(value.value)[1]).toEqual({ field: 'amount', operator: 'gte', value: 70 });
		});
	});

	describe('panel', () => {
		test('the Filters button opens a row per condition: Where/and, field, operator, value, delete', async () => {
			const { screen, filtersButton } = await setup({}, initial());
			await filtersButton.click();
			await expect.element(filtersButton).toHaveAttribute('aria-expanded', 'true');
			expect(screen.container.querySelector('.aurora-filters')).toHaveAttribute('data-open');
			await expect.element(panel()).toBeVisible();
			expect(panelElement()!.querySelector('.aurora-filters-panel-head')?.textContent).toContain('Filters');
			await expect.element(screen.getByRole('button', { name: 'Clear all' })).toBeVisible();
			const [service, amount] = rows();
			expect(rows().map((row) => row.logic)).toEqual(['Where', 'and']);
			expect(fieldSelect(service.element).value).toBe('service');
			expect(operatorSelect(service.element)).toHaveAccessibleName('Service Operator');
			expect(operatorSelect(service.element).value).toBe('in');
			expect(service.element.querySelector('.aurora-chip')?.textContent).toContain('Balayage');
			expect(fieldSelect(amount.element).value).toBe('amount');
			expect(operatorSelect(amount.element).value).toBe('gte');
			await expect.element(amount.locator.getByRole('spinbutton', { name: 'Amount' })).toHaveValue(50);
			for (const row of rows())
				await expect.element(row.locator.getByRole('button', { name: 'Remove filter' })).toBeVisible();
			await filtersButton.click();
			await expect.element(filtersButton).toHaveAttribute('aria-expanded', 'false');
			await expect.poll(panelElement).toBeNull();
		});

		test('Add filter adds an empty row; choosing a field sets its default operator', async () => {
			const { value, onchange } = await setup({}, initial());
			await openPanel();
			await panelAdd().click();
			const row = rows()[2];
			expect(row.logic).toBe('and');
			expect(fieldSelect(row.element).value).toBe('');
			expect(row.element.querySelectorAll('select')).toHaveLength(1);
			expect(conditions(value.value)[2]).toEqual({ field: '', operator: '', value: undefined });
			const options = [...fieldSelect(row.element).options].filter((option) => !option.hidden);
			expect(options.map((option) => option.textContent?.trim())).toEqual([
				'Client',
				'Country',
				'Tags',
				'Service',
				'Status',
				'Date',
				'Amount',
				'Paid'
			]);
			await userEvent.selectOptions(fieldSelect(row.element), 'amount');
			expect(operatorSelect(rows()[2].element).value).toBe('eq');
			await userEvent.fill(rows()[2].locator.getByRole('spinbutton', { name: 'Amount' }), '120');
			expect(conditions(value.value)[2]).toEqual({ field: 'amount', operator: 'eq', value: 120 });
			expect(pills()).toEqual(['Service · is · Balayage', 'Amount · ≥ · 50 €', 'Amount · = · 120 €']);
			expect(conditions(lastChange(onchange).value)).toEqual(conditions(value.value));
		});

		test('changing the field of a row resets operator and value', async () => {
			const { value, filtersButton } = await setup({}, initial());
			await openPanel();
			await userEvent.selectOptions(fieldSelect(rows()[0].element), 'client');
			const row = rows()[0];
			expect(operatorSelect(row.element).value).toBe('contains');
			await expect.element(row.locator.getByRole('textbox', { name: 'Client' })).toHaveValue('');
			expect(conditions(value.value)[0]).toEqual({ field: 'client', operator: 'contains', value: undefined });
			expect(pills()).toEqual(['Amount · ≥ · 50 €']);
			expect(filtersButton.element().querySelector('.aurora-filters-count')?.textContent).toBe('1');
		});

		test('changing the operator of a row keeps the value with the same input, resets it otherwise', async () => {
			const { value } = await setup({}, initial());
			await openPanel();
			await userEvent.selectOptions(operatorSelect(rows()[1].element), 'lt');
			expect(conditions(value.value)[1]).toEqual({ field: 'amount', operator: 'lt', value: 50 });
			await userEvent.selectOptions(operatorSelect(rows()[1].element), 'between');
			expect(conditions(value.value)[1]).toEqual({ field: 'amount', operator: 'between', value: undefined });
			await expect.element(rows()[1].locator.getByRole('spinbutton', { name: 'Amount From' })).toBeVisible();
			await userEvent.selectOptions(operatorSelect(rows()[1].element), 'empty');
			expect(rows()[1].element.querySelector('.aurora-filter-value')).toBeNull();
			expect(pills()).toEqual(['Service · is · Balayage', 'Amount · is empty']);
		});

		test('the delete button removes its row', async () => {
			const { value } = await setup({}, initial());
			await openPanel();
			await userEvent.click(rows()[0].element.querySelector('[aria-label="Remove filter"]')!);
			expect(rows().map((row) => row.logic)).toEqual(['Where']);
			expect(fieldSelect(rows()[0].element).value).toBe('amount');
			expect(conditions(value.value)).toEqual([{ field: 'amount', operator: 'gte', value: 50 }]);
		});

		test('without allowOr the rows are joined by "and", with no choice', async () => {
			await setup({}, initial());
			await openPanel();
			expect(rows()[1].element.querySelector('.aurora-filter-row-logic select')).toBeNull();
			await expect.element(page.getByRole('button', { name: 'Add group' })).not.toBeInTheDocument();
		});

		test('allowOr: the second row has an and/or select that changes the logic of the group', async () => {
			const { value, onchange, screen } = await setup({ allowOr: true }, initial());
			await openPanel();
			const logic = rows()[1].element.querySelector('select')!;
			expect(logic).toHaveAccessibleName('and / or');
			expect(logic.value).toBe('and');
			await userEvent.selectOptions(logic, 'or');
			expect(value.value!.logic).toBe('or');
			await panelAdd().click();
			expect(rows().map((row) => row.logic)).toEqual(['Where', '[or]', 'or']);
			expect(screen.container.querySelector('.aurora-filters-connective')?.textContent).toBe('or');
			const { builder } = lastChange(onchange);
			expect(builder.toJson().modifiers).toEqual([
				expect.objectContaining({ kind: 'grouped', logicalOperator: 'and' })
			]);
		});

		test('maxDepth 1: every filter is a box with Add nested filter, the root has one Add filter', async () => {
			const { value, onchange } = await setup({ allowOr: true, maxDepth: 1 }, initial());
			await openPanel();
			const kinds = (group?: Element) => rows(group).map((row) => row.element.dataset.kind);
			const nestIn = (row: Element) => page.elementLocator(row).getByRole('button', { name: 'Add nested filter' });
			await expect.element(page.getByRole('button', { name: 'Add group' })).not.toBeInTheDocument();
			expect(kinds()).toEqual(['box', 'box']);
			expect(rows().map((row) => row.logic)).toEqual(['Where', '[and]']);
			expect(footers()).toEqual([['Add nested filter'], ['Add nested filter'], ['Add filter']]);
			for (const row of rows()) {
				expect(row.element.querySelectorAll('.aurora-filter-row-logic')).toHaveLength(1);
				const buttons = [...row.element.querySelectorAll('.aurora-filter-row-actions button')];
				expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(['Remove filter']);
				expect(buttons[0]).not.toHaveAttribute('title');
				await expect.poll(() => tooltipText(buttons[0])).toBe('Remove filter');
			}
			const before = pills();

			const amountId = value.value!.items[1].id;
			await nestIn(rows()[1].element).click();
			const nested = () => panelElement()!.querySelector('.aurora-filter-group[data-depth="1"]')!;
			const nestedFooter = () => page.elementLocator(nested().querySelector(':scope > .aurora-filter-group-actions')!);
			expect(kinds()).toEqual(['box', 'group']);
			expect(nested()).toHaveAttribute('data-logic', 'or');
			expect(kinds(nested())).toEqual(['condition', 'condition']);
			expect(rows(nested()).map((row) => row.logic)).toEqual(['Where', '[or]']);
			expect(fieldSelect(rows(nested())[0].element).value).toBe('amount');
			expect(fieldSelect(rows(nested())[1].element).value).toBe('');
			expect((value.value!.items[1] as FilterGroup).items[0].id).toBe(amountId);
			expect(conditions(value.value)).toEqual([
				{ field: 'service', operator: 'in', value: [SERVICES[2]] },
				{
					logic: 'or',
					items: [
						{ field: 'amount', operator: 'gte', value: 50 },
						{ field: '', operator: '', value: undefined }
					]
				}
			]);
			expect(pills()).toEqual(before);
			expect(footers()).toEqual([['Add nested filter'], ['Add nested filter', 'Clear group'], ['Add filter']]);

			await userEvent.selectOptions(fieldSelect(rows(nested())[1].element), 'client');
			await userEvent.fill(rows(nested())[1].locator.getByRole('textbox', { name: 'Client' }), 'Rossi');
			expect(conditions(value.value)[1]).toEqual({
				logic: 'or',
				items: [
					{ field: 'amount', operator: 'gte', value: 50 },
					{ field: 'client', operator: 'contains', value: 'Rossi' }
				]
			});
			expect(pills()).toEqual([before[0], 'Any of 2 filters']);
			expect(lastChange(onchange).builder.toJson().modifiers.at(-1)).toMatchObject({
				kind: 'grouped',
				logicalOperator: 'and'
			});

			await nestedFooter().getByRole('button', { name: 'Add nested filter' }).click();
			expect(rows(nested()).map((row) => row.logic)).toEqual(['Where', '[or]', 'or']);
			await nestedFooter().getByRole('button', { name: 'Clear group' }).click();
			expect(kinds()).toEqual(['box']);
			expect(conditions(value.value)).toEqual([{ field: 'service', operator: 'in', value: [SERVICES[2]] }]);

			await panelAdd().click();
			expect(kinds()).toEqual(['box', 'box']);
			expect(fieldSelect(rows()[1].element).value).toBe('');
		});

		test('a nested group is OR under AND only with allowOr, else AND; left with one filter it dissolves; boxes nest down to maxDepth', async () => {
			const depth = (level: number) => panelElement()!.querySelector(`.aurora-filter-group[data-depth="${level}"]`)!;
			const kinds = (group?: Element) => rows(group).map((row) => row.element.dataset.kind);
			const nestIn = (row: Element) =>
				page.elementLocator(row.querySelector('.aurora-filter-box > .aurora-filter-group-actions')!).getByRole('button', {
					name: 'Add nested filter'
				});
			const removeIn = (row: Element) => page.elementLocator(row).getByRole('button', { name: 'Remove filter' });

			const plain = await setup({ maxDepth: 1 }, initial());
			await openPanel();
			await nestIn(rows()[0].element).click();
			expect(depth(1)).toHaveAttribute('data-logic', 'and');
			expect(rows(depth(1)).map((row) => row.logic)).toEqual(['Where', 'and']);
			expect(conditions(plain.value.value)[0]).toEqual({
				logic: 'and',
				items: [
					{ field: 'service', operator: 'in', value: [SERVICES[2]] },
					{ field: '', operator: '', value: undefined }
				]
			});
			await removeIn(rows(depth(1))[1].element).click();
			expect(depth(1)).toBeNull();
			expect(kinds()).toEqual(['box', 'box']);
			expect(footers()).toEqual([['Add nested filter'], ['Add nested filter'], ['Add filter']]);
			expect(conditions(plain.value.value)).toEqual([
				{ field: 'service', operator: 'in', value: [SERVICES[2]] },
				{ field: 'amount', operator: 'gte', value: 50 }
			]);
			await plain.screen.unmount();

			const deep = await setup(
				{ allowOr: true, maxDepth: 2 },
				createFilters([filterCondition('paid', 'isTrue'), filterCondition('amount', 'gte', 50)], 'or')
			);
			await openPanel();
			await nestIn(rows()[1].element).click();
			expect(depth(1)).toHaveAttribute('data-logic', 'and');
			expect(kinds(depth(1))).toEqual(['box', 'box']);
			await nestIn(rows(depth(1))[0].element).click();
			expect(depth(2)).toHaveAttribute('data-logic', 'or');
			expect(kinds(depth(1))).toEqual(['group', 'box']);
			expect(kinds(depth(2))).toEqual(['condition', 'condition']);
			expect(conditions(deep.value.value)).toEqual([
				{ field: 'paid', operator: 'isTrue', value: undefined },
				{
					logic: 'and',
					items: [
						{
							logic: 'or',
							items: [
								{ field: 'amount', operator: 'gte', value: 50 },
								{ field: '', operator: '', value: undefined }
							]
						},
						{ field: '', operator: '', value: undefined }
					]
				}
			]);
			expect(footers()).toEqual([
				['Add nested filter'],
				['Add nested filter', 'Clear group'],
				['Add nested filter'],
				['Add nested filter', 'Clear group'],
				['Add filter']
			]);
		});

		test('maxDepth 2: a group left with one filter never shows a box inside a box', async () => {
			const { value } = await setup({ allowOr: true, maxDepth: 2 }, createFilters([filterCondition('client', 'contains', 'Rossi')]));
			await openPanel();
			const depth = (level: number) => panelElement()!.querySelector(`.aurora-filter-group[data-depth="${level}"]`);
			await page.elementLocator(rows()[0].element).getByRole('button', { name: 'Add nested filter' }).click();
			expect(rows(depth(1)!).map((row) => row.element.dataset.kind)).toEqual(['box', 'box']);
			await page.elementLocator(rows(depth(1)!)[1].element).getByRole('button', { name: 'Remove filter' }).click();
			expect(depth(1)).toBeNull();
			expect(rows().map((row) => row.element.dataset.kind)).toEqual(['box']);
			expect(footers()).toEqual([['Add nested filter'], ['Add filter']]);
			expect(conditions(value.value)).toEqual([{ field: 'client', operator: 'contains', value: 'Rossi' }]);
		});

		test('the × of a group pill removes it whole; in the panel a group left with one condition dissolves', async () => {
			const { screen, value } = await setup(
				{ allowOr: true, maxDepth: 1 },
				createFilters([filterGroup('or', [filterCondition('amount', 'lt', 10), filterCondition('paid', 'isTrue')])])
			);
			await screen.getByRole('button', { name: 'Clear group' }).click();
			expect(conditions(value.value)).toEqual([]);
			await screen.unmount();

			const second = await setup(
				{ allowOr: true, maxDepth: 1 },
				createFilters([
					filterCondition('client', 'contains', 'Rossi'),
					filterGroup('or', [filterCondition('amount', 'lt', 10), filterCondition('paid', 'isTrue')])
				])
			);
			await openPanel();
			await page.elementLocator(rows(panelElement()!.querySelector('.aurora-filter-group[data-depth="1"]')!)[1].element)
				.getByRole('button', { name: 'Remove filter' })
				.click();
			expect(conditions(second.value.value)).toEqual([
				{ field: 'client', operator: 'contains', value: 'Rossi' },
				{ field: 'amount', operator: 'lt', value: 10 }
			]);
		});

		test('without maxDepth rows are plain with no Add nested filter; locked filters have no actions', async () => {
			const flat = await setup({ allowOr: true }, initial());
			await openPanel();
			expect(rows().map((row) => row.element.dataset.kind)).toEqual(['condition', 'condition']);
			expect(footers()).toEqual([['Add filter']]);
			await expect.element(page.getByRole('button', { name: 'Add nested filter' })).not.toBeInTheDocument();
			await flat.screen.unmount();

			await setup(
				{ maxDepth: 1 },
				createFilters([filterCondition('service', 'in', [SERVICES[0]], { locked: true }), filterCondition('amount', 'gte', 50)])
			);
			await openPanel();
			const [locked, free] = rows();
			expect([locked.element.dataset.kind, free.element.dataset.kind]).toEqual(['box', 'box']);
			expect(locked.element.querySelector('.aurora-filter-row-actions')).toBeNull();
			expect(locked.element.querySelector('.aurora-filter-group-actions')).toBeNull();
			expect(free.element.querySelector('.aurora-filter-row-actions [aria-label="Remove filter"]')).not.toBeNull();
			expect(footers()).toEqual([['Add nested filter'], ['Add filter']]);
		});

		test('the × of a group pill removes the group, and the pill opens the panel', async () => {
			const { screen, value } = await setup(
				{ allowOr: true, maxDepth: 1 },
				createFilters([
					filterCondition('paid', 'isTrue'),
					filterGroup('or', [filterCondition('amount', 'lt', 10), filterCondition('amount', 'gt', 90)])
				])
			);
			expect(pills()).toEqual(['Paid · Yes', 'Any of 2 filters']);
			await userEvent.click(screen.container.querySelectorAll('.aurora-filters-pill-main')[1]);
			await expect.element(panel()).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await expect.poll(panelElement).toBeNull();
			await screen.getByRole('button', { name: 'Clear group' }).click();
			expect(conditions(value.value)).toEqual([{ field: 'paid', operator: 'isTrue', value: undefined }]);
		});

		test('closing the panel drops the incomplete rows', async () => {
			const { value, filtersButton } = await setup({}, initial());
			await openPanel();
			await panelAdd().click();
			await panelAdd().click();
			await userEvent.selectOptions(fieldSelect(rows()[3].element), 'amount');
			expect(conditions(value.value)).toHaveLength(4);
			await filtersButton.click();
			await expect.poll(panelElement).toBeNull();
			expect(conditions(value.value)).toEqual(conditions(initial()));

			await openPanel();
			await panelAdd().click();
			await userEvent.keyboard('{Escape}');
			await expect.poll(panelElement).toBeNull();
			expect(conditions(value.value)).toEqual(conditions(initial()));
		});

		test('Clear all keeps the locked conditions; locked rows are disabled and have no delete', async () => {
			const { value, screen } = await setup(
				{},
				createFilters([
					filterCondition('tenant', 'eq', 12, { locked: true }),
					filterCondition('service', 'in', [SERVICES[0]], { locked: true }),
					filterCondition('amount', 'gte', 50)
				])
			);
			await openPanel();
			const [locked, free] = rows();
			expect(rows()).toHaveLength(2);
			expect(locked.logic).toBe('Where');
			expect(locked.element).toHaveAttribute('data-locked');
			expect(fieldSelect(locked.element)).toBeDisabled();
			expect(operatorSelect(locked.element)).toBeDisabled();
			expect(locked.element.querySelector('.aurora-filter-row-value')).toHaveAttribute('inert');
			expect(locked.element.querySelector('[aria-label="Remove filter"]')).toBeNull();
			expect(free.element.querySelector('[aria-label="Remove filter"]')).not.toBeNull();
			await screen.getByRole('button', { name: 'Clear all' }).click();
			expect(conditions(value.value)).toEqual([
				{ field: 'tenant', operator: 'eq', value: 12 },
				{ field: 'service', operator: 'in', value: [SERVICES[0]] }
			]);
			expect(rows()).toHaveLength(1);
		});

		test('opening the panel closes the card, and the card closes the panel', async () => {
			const setupResult = await setup({}, initial());
			await pickField(setupResult, 'Client');
			await setupResult.filtersButton.click();
			await expect.element(card('Client')).not.toBeInTheDocument();
			await expect.element(panel()).toBeVisible();
			await setupResult.screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
			await expect.element(card('Amount')).toBeVisible();
			await expect.poll(panelElement).toBeNull();
		});
	});

	describe('confirm', () => {
		test('the card works on a draft: Apply adds the condition, at once', async () => {
			const setupResult = await setup({ confirm: true, applyDelay: 5000 });
			const { value, onchange, addButton } = setupResult;
			await pickField(setupResult, 'Client');
			await userEvent.keyboard('Rossi');
			expect(pills()).toEqual([]);
			expect(value.value?.items ?? []).toEqual([]);
			expect(onchange).not.toHaveBeenCalled();
			await expect.element(card('Client').getByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
			await card('Client').getByRole('button', { name: 'Apply' }).click();
			await expect.element(card('Client')).not.toBeInTheDocument();
			await expect.element(addButton).toHaveFocus();
			expect(pills()).toEqual(['Client · contains · Rossi']);
			expect(onchange).toHaveBeenCalledOnce();
			expect(conditions(lastChange(onchange).value)).toEqual([
				{ field: 'client', operator: 'contains', value: 'Rossi' }
			]);
		});

		test('v4 bug: Cancel discards the edits of the card', async () => {
			const { screen, value, onchange } = await setup({ confirm: true }, initial());
			await screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
			await userEvent.fill(card('Amount').getByRole('spinbutton'), '80');
			await card('Amount').getByRole('combobox', { name: 'Operator' }).selectOptions('lt');
			await card('Amount').getByRole('button', { name: 'Cancel' }).click();
			await expect.element(card('Amount')).not.toBeInTheDocument();
			expect(pills()).toEqual(['Service · is · Balayage', 'Amount · ≥ · 50 €']);
			expect(conditions(value.value)).toEqual(conditions(initial()));
			expect(onchange).not.toHaveBeenCalled();

			await screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
			await expect.element(card('Amount').getByRole('spinbutton')).toHaveValue(50);
			await userEvent.fill(card('Amount').getByRole('spinbutton'), '80');
			await userEvent.keyboard('{Escape}');
			await expect.element(card('Amount')).not.toBeInTheDocument();
			expect(pills()).toEqual(['Service · is · Balayage', 'Amount · ≥ · 50 €']);

			await screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
			await userEvent.fill(card('Amount').getByRole('spinbutton'), '80');
			await userEvent.keyboard('{Enter}');
			expect(pills()).toEqual(['Service · is · Balayage', 'Amount · ≥ · 80 €']);
			expect(onchange).toHaveBeenCalledOnce();
		});

		test('the panel works on a draft: Apply commits it without incomplete rows, Cancel discards it', async () => {
			const { value, onchange, filtersButton } = await setup({ confirm: true }, initial());
			await openPanel();
			await userEvent.fill(rows()[1].locator.getByRole('spinbutton', { name: 'Amount' }), '80');
			await panelAdd().click();
			expect(rows()).toHaveLength(3);
			expect(conditions(value.value)).toEqual(conditions(initial()));
			expect(pills()).toEqual(['Service · is · Balayage', 'Amount · ≥ · 50 €']);
			await panel().getByRole('button', { name: 'Apply' }).click();
			await expect.poll(panelElement).toBeNull();
			expect(conditions(value.value)).toEqual([
				{ field: 'service', operator: 'in', value: [SERVICES[2]] },
				{ field: 'amount', operator: 'gte', value: 80 }
			]);
			expect(onchange).toHaveBeenCalledOnce();

			await openPanel();
			await userEvent.click(rows()[0].element.querySelector('[aria-label="Remove filter"]')!);
			expect(rows()).toHaveLength(1);
			await panel().getByRole('button', { name: 'Cancel' }).click();
			await expect.poll(panelElement).toBeNull();
			expect(conditions(value.value)).toHaveLength(2);

			await openPanel();
			expect(rows()).toHaveLength(2);
			await userEvent.click(rows()[0].element.querySelector('[aria-label="Remove filter"]')!);
			await filtersButton.click();
			await expect.poll(panelElement).toBeNull();
			expect(conditions(value.value)).toHaveLength(2);
			expect(onchange).toHaveBeenCalledOnce();
		});
	});

	describe('mobile', () => {
		instantDrawers();

		async function onMobile(run: () => Promise<void>) {
			await page.viewport(800, 700);
			try {
				await run();
			} finally {
				await page.viewport(1280, 800);
			}
		}

		function sheet() {
			return page.getByRole('dialog', { name: 'Filters' });
		}

		async function onPhone(run: () => Promise<void>) {
			await page.viewport(390, 800);
			try {
				await run();
			} finally {
				await page.viewport(1280, 800);
			}
		}

		test('on a phone the bar is compact: pills and Clear on one row that scrolls, no Add filter, Filters only as an icon next to a search', async () => {
			await onPhone(async () => {
				const { screen } = await setup({ prependSnippet: snippet('<input type="search" aria-label="Search" />') }, initial());
				const root = screen.container.querySelector('.aurora-filters')!;
				await expect.poll(() => root.hasAttribute('data-compact')).toBe(true);
				const button = screen.getByRole('button', { name: 'Filters (2)' });
				await expect.element(button).toBeInTheDocument();
				expect(button.element().textContent?.trim()).toBe('2');
				expect(screen.container.querySelector('.aurora-filters-add')).toBeNull();
				const row = root.querySelector('.aurora-filters-row')!;
				expect(row.querySelectorAll('.aurora-filters-pill')).toHaveLength(2);
				expect(row.textContent).toContain('Clear');
				expect(getComputedStyle(row).overflowX).toBe('auto');
				const middles = [...row.children].map((child) => {
					const box = child.getBoundingClientRect();
					return box.top + box.height / 2;
				});
				expect(Math.max(...middles) - Math.min(...middles)).toBeLessThan(4);
			});
		});

		test('on a phone without a search the Filters button keeps its text', async () => {
			await onPhone(async () => {
				const { screen } = await setup({}, initial());
				const root = screen.container.querySelector('.aurora-filters')!;
				await expect.poll(() => root.hasAttribute('data-compact')).toBe(true);
				const button = screen.getByRole('button', { name: /^Filters/ }).element();
				expect(button.textContent?.replace(/\s+/g, ' ').trim()).toBe('Filters 2');
				expect(screen.container.querySelector('.aurora-filters-add')).toBeNull();
			});
		});

		test('on a phone closing the sheet gives the focus back to the Filters button', async () => {
			await onPhone(async () => {
				const { screen } = await setup({}, initial());
				const button = screen.getByRole('button', { name: /^Filters/ });
				await button.click();
				await expect.element(sheet()).toBeVisible();
				await userEvent.keyboard('{Escape}');
				await expect.element(sheet()).not.toBeInTheDocument();
				await expect.element(button).toHaveFocus();
			});
		});

		test('a narrow bar is compact on desktop too, and adds from the panel', async () => {
			const box = document.createElement('div');
			box.style.width = '500px';
			document.body.append(box);
			const value = { current: initial() };
			const screen = await render(Filters, {
				target: box,
				props: {
					fields,
					applyDelay: 0,
					prependSnippet: snippet('<input type="search" aria-label="Search" />'),
					get value() {
						return value.current;
					},
					set value(next) {
						value.current = next;
					}
				}
			});
			const root = box.querySelector('.aurora-filters')!;
			await expect.poll(() => root.hasAttribute('data-compact')).toBe(true);
			expect(box.querySelector('.aurora-filters-add')).toBeNull();
			await screen.getByRole('button', { name: 'Filters (2)' }).click();
			await expect.element(page.getByRole('button', { name: /Add filter/ }).last()).toBeVisible();
			screen.unmount();
			box.remove();
		});

		test('on a tablet the bar keeps its texts and Add filter', async () => {
			await onMobile(async () => {
				const { screen, addButton } = await setup({}, initial());
				await expect.element(addButton).toBeInTheDocument();
				expect(screen.container.querySelector('.aurora-filters')!.hasAttribute('data-compact')).toBe(false);
			});
		});

		test('Add filter opens a bottom sheet with the rows and a new one; Show results closes it', async () => {
			await onMobile(async () => {
				const { addButton, value } = await setup({}, initial());
				await addButton.click();
				await expect.element(sheet()).toBeVisible();
				const dialog = sheet().element();
				expect(dialog.tagName).toBe('DIALOG');
				expect(dialog.matches(':modal')).toBe(true);
				expect(dialog).toHaveAttribute('data-position', 'bottom');
				expect(rows().map((row) => row.logic)).toEqual(['Where', 'and', 'and']);
				expect(fieldSelect(rows()[2].element).value).toBe('');
				expect(panelElement()!.querySelector('.aurora-filters-panel-head')).toBeNull();
				await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
				await userEvent.selectOptions(fieldSelect(rows()[2].element), 'paid');
				expect(pills()).toContain('Paid · Yes');
				await panelAdd().click();
				await sheet().getByRole('button', { name: 'Show results' }).click();
				await expect.element(sheet()).not.toBeInTheDocument();
				expect(conditions(value.value)).toEqual([
					...conditions(initial()),
					{ field: 'paid', operator: 'isTrue', value: undefined }
				]);
			});
		});

		test('the Filters button and a pill open the sheet; Close and Escape close it', async () => {
			await onMobile(async () => {
				const { screen, filtersButton, value } = await setup({}, initial());
				await filtersButton.click();
				await expect.element(sheet()).toBeVisible();
				expect(rows()).toHaveLength(2);
				await sheet().getByRole('button', { name: 'Close' }).click();
				await expect.element(sheet()).not.toBeInTheDocument();
				await screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
				await expect.element(sheet()).toBeVisible();
				await expect.element(card('Amount')).not.toBeInTheDocument();
				await userEvent.keyboard('{Escape}');
				await expect.element(sheet()).not.toBeInTheDocument();
				expect(conditions(value.value)).toEqual(conditions(initial()));
			});
		});

		test('a pinned field adds its condition in the sheet', async () => {
			await onMobile(async () => {
				const pinnedFields = fields.map((field) => (field.name === 'paid' ? { ...field, pinned: true } : field));
				const { screen, value } = await setup({ fields: pinnedFields });
				await screen.getByRole('button', { name: 'Paid', exact: true }).click();
				await expect.element(sheet()).toBeVisible();
				expect(fieldSelect(rows()[0].element).value).toBe('paid');
				expect(conditions(value.value)).toEqual([{ field: 'paid', operator: 'isTrue', value: undefined }]);
			});
		});

		test('confirm: Show results applies the draft, Close discards it', async () => {
			await onMobile(async () => {
				const { filtersButton, value, onchange } = await setup({ confirm: true }, initial());
				await filtersButton.click();
				await userEvent.click(rows()[0].element.querySelector('[aria-label="Remove filter"]')!);
				await sheet().getByRole('button', { name: 'Close' }).click();
				await expect.element(sheet()).not.toBeInTheDocument();
				expect(conditions(value.value)).toHaveLength(2);
				expect(onchange).not.toHaveBeenCalled();
				await filtersButton.click();
				await userEvent.click(rows()[0].element.querySelector('[aria-label="Remove filter"]')!);
				await sheet().getByRole('button', { name: 'Show results' }).click();
				await expect.element(sheet()).not.toBeInTheDocument();
				expect(conditions(value.value)).toEqual([{ field: 'amount', operator: 'gte', value: 50 }]);
				expect(onchange).toHaveBeenCalledOnce();
			});
		});

		test('mobileDrawer={false} keeps the menus on small screens', async () => {
			await onMobile(async () => {
				const { addButton } = await setup({ mobileDrawer: false });
				await addButton.click();
				await expect.element(page.getByRole('listbox', { name: 'Add filter' })).toBeVisible();
				await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
			});
		});
	});

	describe('value and onchange', () => {
		test('negativesIncludeEmpty reaches the query of onchange', async () => {
			const { value, onchange } = await setup({ negativesIncludeEmpty: true });
			value.value = createFilters([filterCondition('amount', 'ne', 5)]);
			await expect.poll(() => onchange.mock.calls.length).toBeGreaterThan(0);
			const change = onchange.mock.lastCall![0];
			expect(change.builder.toJson()).toEqual(
				filtersToBuilder(change.value, fields, { negativesIncludeEmpty: true }).toJson()
			);
			expect(JSON.stringify(change.builder.toJson())).toContain('"kind":"null"');
		});

		test('bind:value is two-way: a change from outside updates the pills and the count', async () => {
			const { value, filtersButton } = await setup({}, initial());
			value.value = createFilters([filterCondition('client', 'is', 'Rossi'), filterCondition('paid', 'isFalse')]);
			await expect.poll(pills).toEqual(['Client · is · Rossi', 'Paid · No']);
			expect(filtersButton.element().querySelector('.aurora-filters-count')?.textContent).toBe('2');
			value.value = createFilters();
			await expect.poll(pills).toEqual([]);
		});

		test('a change of value from outside calls onchange after applyDelay, only when the query changes', async () => {
			const { value, onchange } = await setup({ applyDelay: 50 }, initial());
			value.value = createFilters([
				filterCondition('service', 'in', [SERVICES[2]]),
				filterCondition('amount', 'gte', 50)
			]);
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(onchange).not.toHaveBeenCalled();
			value.value = createFilters([...value.value.items, filterCondition('client', 'contains', '')]);
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(onchange).not.toHaveBeenCalled();
			const next = createFilters([filterCondition('paid', 'isTrue')]);
			value.value = next;
			expect(onchange).not.toHaveBeenCalled();
			await expect.poll(() => onchange.mock.calls.length).toBe(1);
			expect(lastChange(onchange).value).toEqual(next);
		});

		test('without value the filters start empty and the first change sets it', async () => {
			const setupResult = await setup();
			expect(setupResult.value.value).toBeUndefined();
			await pickField(setupResult, 'Paid');
			expect(conditions(setupResult.value.value)).toEqual([{ field: 'paid', operator: 'isTrue', value: undefined }]);
			expect(setupResult.value.value!.logic).toBe('and');
		});

		test('builder: the filters are added to a copy of the given builder', async () => {
			const builder = new FilterBuilder().whereNull('deletedAt').orderBy('startsAt', 'desc');
			const before = JSON.stringify(builder.toJson());
			const setupResult = await setup({ builder }, initial());
			await pickField(setupResult, 'Paid');
			const change = setupResult.onchange.mock.lastCall![0];
			expect(change.builder).not.toBe(builder);
			expect(JSON.stringify(builder.toJson())).toBe(before);
			expect(change.builder.toJson()).toEqual(filtersToBuilder(change.value, fields, { builder }).toJson());
			expect(change.builder.toJson().modifiers.slice(0, 2)).toEqual(builder.toJson().modifiers);
		});

		test('weekStart decides the weeks of the periods in the query', async () => {
			const { value, onchange } = await setup({ weekStart: 0 });
			value.value = createFilters([filterCondition('date', 'period', 'thisWeek')]);
			await expect.poll(() => onchange.mock.calls.length).toBe(1);
			const { builder } = onchange.mock.lastCall![0];
			const sunday = filtersToBuilder(value.value, fields, { weekStart: 0 }).toJson();
			const monday = filtersToBuilder(value.value, fields, { weekStart: 1 }).toJson();
			expect(builder.toJson()).toEqual(sunday);
			expect(sunday).not.toEqual(monday);
		});

		test('a custom field uses inputSnippet in the card and in the panel', async () => {
			const inputSnippet = createRawSnippet<
				[{ field: FilterField; operator: string; value: unknown; setValue: (value: unknown) => void }]
			>((params) => ({
				render: () => `<input aria-label="Code value" value="${params().value ?? ''}" />`,
				setup: (node) => {
					node.addEventListener('input', () => params().setValue((node as HTMLInputElement).value));
				}
			}));
			const code: FilterField = {
				name: 'code',
				label: 'Code',
				type: 'custom',
				apply: (builder, condition) => builder.where('code', 'ilike', `${condition.value}%`)
			};
			const setupResult = await setup({ fields: [...few, code], inputSnippet });
			const { value, onchange } = setupResult;
			await pickField(setupResult, 'Code');
			await userEvent.fill(card('Code').getByRole('textbox', { name: 'Code value' }), 'AB');
			expect(conditions(value.value)).toEqual([{ field: 'code', operator: 'custom', value: 'AB' }]);
			expect(pills()).toEqual(['Code · AB']);
			const { builder } = onchange.mock.lastCall![0];
			expect(builder.toJson().modifiers).toEqual([
				expect.objectContaining({ key: 'code', operator: 'ilike', value: 'AB%' })
			]);
			await userEvent.keyboard('{Escape}');
			await setupResult.filtersButton.click();
			await expect.element(rows()[0].locator.getByRole('textbox', { name: 'Code value' })).toHaveValue('AB');
		});

		test('labels and locale translate the bar, the pills and the panel', async () => {
			const labels = {
				filters: 'Filtri',
				addFilter: 'Aggiungi filtro',
				clear: 'Azzera',
				clearAll: 'Azzera tutto',
				where: 'Dove',
				and: 'e',
				editFilter: 'Modifica filtro',
				removeFilter: 'Rimuovi filtro',
				searchFields: 'Cerca campi',
				units: { days: 'giorni' },
				operators: { is: 'è', gte: 'almeno', inLast: 'negli ultimi' }
			};
			const { screen } = await setup(
				{ labels, locale: 'it' },
				createFilters([
					filterCondition('date', 'is', '2026-10-09'),
					filterCondition('amount', 'gte', 1234.5),
					filterCondition('date', 'inLast', 7)
				])
			);
			expect(pills()).toEqual(['Date · è · 9 ott 2026', 'Amount · almeno · 1234,5 €', 'Date · negli ultimi · 7 giorni']);
			await expect.element(screen.getByRole('button', { name: 'Azzera', exact: true })).toBeVisible();
			await expect.element(screen.getByRole('button', { name: 'Rimuovi filtro: Amount' })).toBeVisible();
			await expect.element(screen.getByRole('button', { name: 'Modifica filtro: Amount almeno 1234,5 €' })).toBeVisible();
			await screen.getByRole('button', { name: 'Aggiungi filtro' }).click();
			await expect.element(screen.getByRole('combobox', { name: 'Cerca campi' })).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await screen.getByRole('button', { name: /^Filtri/ }).click();
			expect(rows().map((row) => row.logic)).toEqual(['Dove', 'e', 'e']);
			await expect.element(screen.getByRole('button', { name: 'Azzera tutto' })).toBeVisible();
			await expect.element(rows()[0].locator.getByRole('combobox', { name: 'Date', exact: true })).toHaveValue('09/10/2026');
		});
	});

	test('v4 bug: Escape closes the field list, the card and the panel', async () => {
		const setupResult = await setup({}, initial());
		const { addButton, filtersButton } = setupResult;
		await addButton.click();
		await expect.element(page.getByRole('listbox', { name: 'Add filter' })).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
		await expect.element(addButton).toHaveFocus();
		await expect.element(addButton).toHaveAttribute('aria-expanded', 'false');

		await pickField(setupResult, 'Client');
		await userEvent.keyboard('{Escape}');
		await expect.element(card('Client')).not.toBeInTheDocument();

		await filtersButton.click();
		await expect.element(panel()).toBeVisible();
		await userEvent.click(panelElement()!.querySelector('input[type="number"]')!);
		await userEvent.keyboard('{Escape}');
		await expect.poll(panelElement).toBeNull();
		await expect.element(filtersButton).toHaveFocus();
	});

	describe('added after the first review', () => {
		test('onchange gets a copy of value without the incomplete conditions', async () => {
			const setupResult = await setup({}, initial());
			const { value, onchange } = setupResult;
			await pickField(setupResult, 'Amount');
			await userEvent.keyboard('5');
			expect(conditions(lastChange(onchange).value)).toHaveLength(3);
			await userEvent.keyboard('{Backspace}');
			expect(conditions(value.value)).toHaveLength(3);
			const change = lastChange(onchange);
			expect(conditions(change.value)).toEqual(conditions(initial()));
			expect(change.value).not.toBe(value.value);
		});

		test('Apply and Enter give the focus back to the pill that opened the card', async () => {
			const confirmed = await setup({ confirm: true }, initial());
			const pill = confirmed.screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' });
			await pill.click();
			await userEvent.fill(card('Amount').getByRole('spinbutton'), '60');
			await card('Amount').getByRole('button', { name: 'Apply' }).click();
			await expect.element(card('Amount')).not.toBeInTheDocument();
			await expect.element(confirmed.screen.getByRole('button', { name: 'Edit filter: Amount ≥ 60 €' })).toHaveFocus();
			await confirmed.screen.unmount();

			const immediate = await setup({}, initial());
			await immediate.screen.getByRole('button', { name: 'Edit filter: Service is Balayage' }).click();
			await expect.element(card('Service')).toBeVisible();
			await immediate.screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
			await userEvent.fill(card('Amount').getByRole('spinbutton'), '70');
			await userEvent.keyboard('{Enter}');
			await expect.element(card('Amount')).not.toBeInTheDocument();
			await expect.element(immediate.screen.getByRole('button', { name: 'Edit filter: Amount ≥ 70 €' })).toHaveFocus();
		});

		test('with confirm the card of an existing condition offers Remove, which applies at once', async () => {
			const { screen, value, onchange } = await setup({ confirm: true }, initial());
			await screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
			await card('Amount').getByRole('button', { name: 'Remove' }).click();
			await expect.element(card('Amount')).not.toBeInTheDocument();
			expect(conditions(value.value)).toEqual([{ field: 'service', operator: 'in', value: [SERVICES[2]] }]);
			expect(onchange).toHaveBeenCalledOnce();
		});

		test('the panel is a dialog named Filters, controlled by the Filters button while open', async () => {
			const { filtersButton } = await setup({}, initial());
			await expect.element(filtersButton).not.toHaveAttribute('aria-controls');
			await filtersButton.click();
			const dialog = page.getByRole('dialog', { name: 'Filters' });
			await expect.element(dialog).toBeVisible();
			expect(dialog.element()).toHaveClass('aurora-filters-panel-menu');
			expect(dialog.element().contains(panelElement())).toBe(true);
			await expect.element(filtersButton).toHaveAttribute('aria-controls', dialog.element().id);
			await filtersButton.click();
			await expect.element(filtersButton).not.toHaveAttribute('aria-controls');
		});

		test('the group pill tells whether the panel is open', async () => {
			const { screen } = await setup(
				{ maxDepth: 1 },
				createFilters([filterGroup('or', [filterCondition('amount', 'lt', 10), filterCondition('amount', 'gt', 90)])])
			);
			const groupPill = screen.getByRole('button', { name: 'Any of 2 filters' });
			await expect.element(groupPill).toHaveAttribute('aria-haspopup', 'dialog');
			await expect.element(groupPill).toHaveAttribute('aria-expanded', 'false');
			await groupPill.click();
			await expect.element(groupPill).toHaveAttribute('aria-expanded', 'true');
		});

		test('a preset chip is named with its count', async () => {
			const presets: FilterPreset[] = [
				{ id: 'today', label: 'Today', count: 18, conditions: [{ field: 'date', operator: 'period', value: 'today' }] },
				{ id: 'paid', label: 'Paid', conditions: [{ field: 'paid', operator: 'isTrue' }] }
			];
			const { screen } = await setup({ presets });
			await expect.element(screen.getByRole('button', { name: 'Today · 18', exact: true })).toBeVisible();
			await expect.element(screen.getByRole('button', { name: 'Paid', exact: true })).toBeVisible();
		});

		test('Clear and Clear all appear only with a condition the user can remove', async () => {
			const cases: [FilterGroup, boolean][] = [
				[createFilters([filterCondition('tenant', 'eq', 12)]), false],
				[createFilters([filterCondition('client', 'is', 'Rossi', { locked: true })]), false],
				[createFilters([filterCondition('tenant', 'eq', 12), filterCondition('paid', 'isTrue')]), true]
			];
			for (const [tree, shown] of cases) {
				const { screen, clearButton, filtersButton } = await setup({}, tree);
				await filtersButton.click();
				await expect.element(panel()).toBeVisible();
				const clearAll = screen.getByRole('button', { name: 'Clear all' });
				if (shown) {
					await expect.element(clearButton).toBeVisible();
					await expect.element(clearAll).toBeVisible();
				} else {
					await expect.element(clearButton).not.toBeInTheDocument();
					await expect.element(clearAll).not.toBeInTheDocument();
				}
				await screen.unmount();
			}
		});

		test('a pinned field keeps its place: its pills stand where the ghost pill was', async () => {
			const pinnedFields = fields.map((field) => (field.name === 'status' ? { ...field, pinned: true } : field));
			const { screen, value } = await setup({ fields: pinnedFields }, initial());
			const order = () =>
				[...screen.container.querySelectorAll('.aurora-filters-pinned, .aurora-filters-pill-main')].map(
					(element) => element.textContent?.replace(/\s+/g, ' ').trim()
				);
			expect(order()).toEqual(['Status', 'Service is Balayage', 'Amount ≥ 50 €']);
			await screen.getByRole('button', { name: 'Status', exact: true }).click();
			await card('Status').getByRole('button', { name: 'Waiting' }).click();
			expect(order()).toEqual(['Status is Waiting', 'Service is Balayage', 'Amount ≥ 50 €']);
			await userEvent.keyboard('{Escape}');
			value.value = createFilters([
				...value.value!.items,
				filterCondition('status', 'notIn', [{ value: 'cancelled', label: 'Cancelled' }])
			]);
			await expect
				.poll(order)
				.toEqual(['Status is Waiting', 'Status is not Cancelled', 'Service is Balayage', 'Amount ≥ 50 €']);
		});

		test('one Escape closes the card right after closing the list of its Autocomplete', async () => {
			const setupResult = await setup();
			await pickField(setupResult, 'Service');
			await card('Service').getByRole('combobox', { name: 'Service' }).click();
			await expect.element(page.getByRole('listbox')).toBeVisible();
			await userEvent.keyboard('{Escape}{Escape}');
			await expect.element(card('Service')).not.toBeInTheDocument();
			await expect.element(setupResult.addButton).toHaveFocus();
		});

		test('defaultValue starts the condition from Add filter, the pinned pill and the panel', async () => {
			const confirmed = [{ value: 'confirmed', label: 'Confirmed' }];
			const withDefault = fields.map((field) =>
				field.name === 'status'
					? { ...(field as SelectFilterField), defaultValue: confirmed }
					: field.name === 'amount'
						? { ...field, pinned: true, defaultValue: 100 }
						: field
			);
			const setupResult = await setup({ fields: withDefault });
			const { screen, value } = setupResult;
			await pickField(setupResult, 'Status');
			await expect
				.element(card('Status').getByRole('button', { name: 'Confirmed' }))
				.toHaveAttribute('aria-pressed', 'true');
			expect(pills()).toEqual(['Status · is · Confirmed']);
			await userEvent.keyboard('{Escape}');

			await screen.getByRole('button', { name: 'Amount', exact: true }).click();
			await expect.element(card('Amount').getByRole('spinbutton')).toHaveValue(100);
			expect(pills()).toEqual(['Amount · = · 100 €', 'Status · is · Confirmed']);
			await userEvent.keyboard('{Escape}');

			await openPanel();
			await panelAdd().click();
			await userEvent.selectOptions(fieldSelect(rows()[2].element), 'status');
			expect(conditions(value.value)[2]).toEqual({ field: 'status', operator: 'in', value: confirmed });
		});

		test('field.isComplete decides when a condition gets a pill and reaches the query', async () => {
			const code: FilterField = {
				name: 'code',
				label: 'Code',
				type: 'string',
				operators: ['is'],
				isComplete: (condition) => typeof condition.value === 'string' && condition.value.length >= 3
			};
			const list = [...few, code];
			const setupResult = await setup({ fields: list });
			const { onchange, filtersButton } = setupResult;
			await pickField(setupResult, 'Code');
			await userEvent.keyboard('AB');
			expect(pills()).toEqual([]);
			expect(onchange).not.toHaveBeenCalled();
			await userEvent.keyboard('C');
			expect(pills()).toEqual(['Code · is · ABC']);
			expect(lastChange(onchange, list).builder.toJson().modifiers).toEqual([
				expect.objectContaining({ key: 'code', operator: '~*', value: '^ABC$' })
			]);
			expect(filtersButton.element().querySelector('.aurora-filters-count')?.textContent).toBe('1');
		});

		test('pills of custom values: arrays list labels or values, objects need format', async () => {
			const custom: FilterField[] = [
				{ name: 'tags', label: 'Tags', type: 'custom', apply: () => {} },
				{ name: 'range', label: 'Range', type: 'custom', apply: () => {} },
				{
					name: 'window',
					label: 'Window',
					type: 'custom',
					apply: () => {},
					format: (condition) => `${(condition.value as { hours: number }).hours} h`
				}
			];
			await setup(
				{ fields: [...few, ...custom] },
				createFilters([
					filterCondition('tags', 'custom', [{ value: 1, label: 'VIP' }, { value: 2 }, 'new']),
					filterCondition('range', 'custom', { min: 1 }),
					filterCondition('window', 'custom', { hours: 4 }),
					filterCondition('tags', 'custom', [])
				])
			);
			expect(pills()).toEqual(['Tags · VIP, 2, new', 'Range', 'Window · 4 h']);
		});

		test('an operator of the app without apply uses the apply of its field, with values kept in $state', async () => {
			const tags: FilterField = {
				name: 'tags',
				label: 'Tags',
				type: 'custom',
				operators: [{ name: 'hasAny', label: 'has any of', input: 'custom' }],
				apply: (builder, condition) => builder.whereIn('tagId', condition.value as number[])
			};
			const { onchange, value } = await setup({ fields: [...few, tags] });
			value.value = createFilters([filterCondition('tags', 'hasAny', [1, 2])]);
			await expect.poll(() => onchange.mock.calls.length).toBe(1);
			expect(onchange.mock.lastCall![0].builder.toJson().modifiers).toEqual([
				expect.objectContaining({ kind: 'in', key: 'tagId', value: [1, 2] })
			]);
			expect(pills()).toEqual(['Tags · has any of · 1, 2']);
		});

		test('onremove gets the complete conditions the user removes, never the incomplete ones', async () => {
			const onremove = vi.fn<(change: { conditions: FilterCondition[] }) => void>();
			const presets: FilterPreset[] = [
				{ id: 'unpaid', label: 'Not paid', conditions: [{ field: 'paid', operator: 'isFalse' }] }
			];
			const tree = createFilters([
				filterCondition('service', 'in', [SERVICES[2]]),
				filterCondition('amount', 'gte', 50),
				filterCondition('client', 'is', 'Rossi'),
				filterCondition('date', 'inLast', 7),
				filterCondition('tenant', 'eq', 12, { locked: true })
			]);
			const removed = () => onremove.mock.lastCall![0].conditions.map((condition) => condition.field);
			const setupResult = await setup({ onremove, presets }, tree);
			const { screen, clearButton } = setupResult;

			await screen.getByRole('button', { name: 'Remove filter: Service' }).click();
			expect(removed()).toEqual(['service']);
			expect(onremove.mock.lastCall![0].conditions[0]).toMatchObject({ operator: 'in', value: [SERVICES[2]] });

			await screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
			await card('Amount').getByRole('button', { name: 'Remove' }).click();
			expect(removed()).toEqual(['amount']);

			await openPanel();
			await userEvent.click(rows()[0].element.querySelector('[aria-label="Remove filter"]')!);
			expect(removed()).toEqual(['client']);
			await panelAdd().click();
			await userEvent.click(rows()[1].element.querySelector('[aria-label="Remove filter"]')!);
			await userEvent.keyboard('{Escape}');
			await expect.poll(panelElement).toBeNull();
			expect(onremove).toHaveBeenCalledTimes(3);

			await screen.getByRole('button', { name: 'Not paid' }).click();
			await screen.getByRole('button', { name: 'Not paid' }).click();
			expect(removed()).toEqual(['paid']);

			await pickField(setupResult, 'Amount');
			await userEvent.keyboard('5{Backspace}');
			await screen.getByRole('button', { name: 'Remove filter: Amount' }).click();
			expect(onremove).toHaveBeenCalledTimes(4);

			await screen.getByRole('button', { name: 'Not paid' }).click();
			await clearButton.click();
			expect(removed()).toEqual(['date', 'paid']);
			expect(onremove).toHaveBeenCalledTimes(5);
		});

		test('onopen tells which view opens, with the field of a card', async () => {
			const onopen = vi.fn();
			const setupResult = await setup({ onopen, maxDepth: 1 }, createFilters([
				filterCondition('amount', 'gte', 50),
				filterGroup('or', [filterCondition('paid', 'isTrue'), filterCondition('client', 'is', 'Rossi')])
			]));
			const { screen, filtersButton } = setupResult;
			const views = () => onopen.mock.calls.map(([event]) => [event.view, event.field?.name]);
			await pickField(setupResult, 'Date');
			expect(views()).toEqual([['fields', undefined], ['editor', 'date']]);
			await userEvent.keyboard('{Escape}');
			await screen.getByRole('button', { name: 'Edit filter: Amount ≥ 50 €' }).click();
			expect(views().at(-1)).toEqual(['editor', 'amount']);
			await userEvent.keyboard('{Escape}');
			await filtersButton.click();
			expect(views().at(-1)).toEqual(['panel', undefined]);
			await filtersButton.click();
			await expect.poll(panelElement).toBeNull();
			await screen.getByRole('button', { name: 'Any of 2 filters' }).click();
			expect(views().at(-1)).toEqual(['panel', undefined]);
			expect(onopen).toHaveBeenCalledTimes(5);
		});

		test('onopen on mobile: every editor is the panel', async () => {
			await page.viewport(800, 700);
			try {
				const onopen = vi.fn();
				const { addButton } = await setup({ onopen });
				await addButton.click();
				await expect.element(page.getByRole('dialog', { name: 'Filters' })).toBeVisible();
				expect(onopen.mock.calls).toEqual([[{ view: 'panel' }]]);
			} finally {
				await page.viewport(1280, 800);
			}
		});

		test('locale it alone translates the bar, the pills, the list, the card and the panel', async () => {
			const setupResult = await setup(
				{ locale: 'it', fields: few },
				createFilters([filterCondition('paid', 'isTrue'), filterCondition('amount', 'between', { from: 10 })])
			);
			const { screen } = setupResult;
			expect(pills()).toEqual(['Paid · Sì', 'Amount · tra · da 10 €']);
			await expect.element(screen.getByRole('button', { name: /^Filtri/ })).toBeVisible();
			await expect.element(screen.getByRole('button', { name: 'Azzera', exact: true })).toBeVisible();
			await expect.element(screen.getByRole('button', { name: 'Rimuovi filtro: Paid' })).toBeVisible();
			await screen.getByRole('button', { name: 'Aggiungi filtro' }).click();
			await expect.element(screen.getByRole('listbox', { name: 'Aggiungi filtro' })).toBeVisible();
			await page.getByRole('option', { name: 'Client' }).click();
			const editor = card('Client');
			await expect.element(editor.getByRole('combobox', { name: 'Operatore' })).toHaveValue('contains');
			expect(
				[...(editor.getByRole('combobox', { name: 'Operatore' }).element() as HTMLSelectElement).options].map(
					(option) => option.textContent?.trim()
				)
			).toEqual(['contiene', 'non contiene', 'è', 'non è', 'è vuoto', 'non è vuoto']);
			await expect.element(editor.getByRole('button', { name: 'Chiudi' })).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await screen.getByRole('button', { name: /^Filtri/ }).click();
			await expect.element(page.getByRole('dialog', { name: 'Filtri' })).toBeVisible();
			expect(rows().map((row) => row.logic)).toEqual(['Dove', 'e']);
			await expect.element(screen.getByRole('button', { name: 'Azzera tutto' })).toBeVisible();
			await expect.element(page.getByRole('button', { name: 'Aggiungi filtro', exact: true }).last()).toBeVisible();
			expect(rows()[1].locator.getByRole('spinbutton', { name: 'Amount Da' }).element()).toHaveAttribute('placeholder', 'Da');
		});

		test('a field that holds several values (a relation) says "has any of", "has none of", "has all of"', async () => {
			const setupResult = await setup();
			await pickField(setupResult, 'Tags');
			const operator = card('Tags').getByRole('combobox', { name: 'Operator' });
			expect(
				[...(operator.element() as HTMLSelectElement).options].map((option) => option.textContent?.trim())
			).toEqual(['has any of', 'has none of', 'has all of', 'is empty', 'is not empty']);
			await operator.selectOptions('notIn');
			await card('Tags').getByRole('combobox', { name: 'Tags' }).click();
			await page.getByRole('option', { name: 'VIP' }).click();
			await expect.poll(pills).toEqual(['Tags · has none of · VIP']);
		});

		test('the builder of onchange has toQueryParam, one option is = / <> instead of IN, and a negative keeps the empty rows by default', async () => {
			const { value, onchange } = await setup();
			value.value = createFilters([
				filterCondition('service', 'in', [SERVICES[2]]),
				filterCondition('service', 'notIn', [SERVICES[0]]),
				filterCondition('status', 'in', [
					{ value: 'confirmed', label: 'Confirmed' },
					{ value: 'waiting', label: 'Waiting' }
				])
			]);
			await expect.poll(() => onchange.mock.calls.length).toBe(1);
			const { builder } = lastChange(onchange);
			expect(builder.toQueryParam()).toBe(JSON.stringify(builder.toJson()));
			expect(builder.toJson().modifiers).toEqual([
				expect.objectContaining({ key: 'appointments.serviceId', operator: '=', value: 3 }),
				expect.objectContaining({
					kind: 'grouped',
					children: [
						expect.objectContaining({ kind: 'null', key: 'appointments.serviceId' }),
						expect.objectContaining({ key: 'appointments.serviceId', operator: '<>', value: 1, logicalOperator: 'or' })
					]
				}),
				expect.objectContaining({ kind: 'in', key: 'appointments.status', value: ['confirmed', 'waiting'] })
			]);
		});
	});
	describe('saved filters', () => {
		afterEach(() => localStorage.clear());

		const KEY = 'aurora-test-saved-filters';
		const savedButton = () => page.getByRole('button', { name: 'Saved filters', exact: true });
		const savedDialog = () => page.getByRole('dialog', { name: 'Saved filters' });
		const nameInput = () => savedDialog().getByRole('textbox', { name: 'Save current filters: Name' });
		const saveButton = () => savedDialog().getByRole('button', { name: 'Save', exact: true });
		const savedNames = () =>
			[...document.querySelectorAll('.aurora-filters-saved-apply')].map((button) => button.textContent?.trim());
		const stored = (name: string, value: FilterGroup): SavedFilter => ({ id: `saved-${name}`, name, value });
		const ids = (tree: FilterGroup): string[] => [
			tree.id,
			...tree.items.flatMap((node) => (isFilterGroup(node) ? ids(node) : [node.id]))
		];
		const tenant = () => filterCondition('tenant', 'eq', 12, { locked: true });

		test('the Saved filters button appears with savable, saved or savedKey', async () => {
			const plain = await setup();
			await expect.element(plain.filtersButton).toBeVisible();
			await expect.element(savedButton()).not.toBeInTheDocument();
			await plain.screen.unmount();
			for (const props of [{ savable: true }, { saved: [] }, { savedKey: KEY }]) {
				const { screen } = await setup(props);
				await expect.element(savedButton()).toHaveAttribute('aria-haspopup', 'dialog');
				await expect.element(savedButton()).toHaveAttribute('aria-expanded', 'false');
				await screen.unmount();
			}
		});

		test('the button opens a dialog with the list and a form; Save needs a name and a complete condition', async () => {
			const onsavedchange = vi.fn();
			await setup(
				{ savable: true, onsavedchange },
				createFilters([tenant(), filterCondition('client', 'contains', '')])
			);
			await savedButton().click();
			await expect.element(savedDialog()).toBeVisible();
			await expect.element(savedButton()).toHaveAttribute('aria-expanded', 'true');
			await expect.element(savedDialog().getByText('No saved filters')).toBeVisible();
			await expect.element(saveButton()).toBeDisabled();
			await userEvent.fill(nameInput(), 'Nothing');
			await expect.element(saveButton()).toBeDisabled();
			await userEvent.keyboard('{Enter}');
			expect(onsavedchange).not.toHaveBeenCalled();
			expect(savedNames()).toEqual([]);
			await savedButton().click();
			await expect.element(savedDialog()).not.toBeInTheDocument();
			await expect.element(savedButton()).toHaveAttribute('aria-expanded', 'false');
		});

		test('Save stores the complete conditions under the trimmed name, without the locked ones', async () => {
			const onsavedchange = vi.fn<(list: SavedFilter[]) => void>();
			const { value } = await setup(
				{ savable: true, onsavedchange },
				createFilters([
					tenant(),
					filterCondition('amount', 'gte', 50),
					filterGroup('or', [filterCondition('paid', 'isTrue'), filterCondition('service', 'in', [SERVICES[0]])])
				])
			);
			await savedButton().click();
			await userEvent.fill(nameInput(), '   ');
			await expect.element(saveButton()).toBeDisabled();
			await userEvent.fill(nameInput(), '  Big spenders ');
			await expect.element(saveButton()).toBeEnabled();
			await saveButton().click();
			expect(onsavedchange).toHaveBeenCalledOnce();
			const [list] = onsavedchange.mock.calls[0];
			expect(list).toEqual([{ id: expect.any(String), name: 'Big spenders', value: expect.any(Object) }]);
			expect(conditions(list[0].value)).toEqual([
				{ field: 'amount', operator: 'gte', value: 50 },
				{
					logic: 'or',
					items: [
						{ field: 'paid', operator: 'isTrue', value: undefined },
						{ field: 'service', operator: 'in', value: [SERVICES[0]] }
					]
				}
			]);
			expect(filterConditions(list[0].value).some((condition) => condition.locked)).toBe(false);
			expect(savedNames()).toEqual(['Big spenders']);
			await expect.element(nameInput()).toHaveValue('');
			await expect.element(savedDialog().getByText('No saved filters')).not.toBeInTheDocument();
			expect(filterConditions(value.value!).find((condition) => condition.locked)).toMatchObject({
				field: 'tenant',
				value: 12
			});

			await userEvent.fill(nameInput(), 'With Enter');
			await userEvent.keyboard('{Enter}');
			expect(onsavedchange).toHaveBeenCalledTimes(2);
			expect(onsavedchange.mock.lastCall![0].map((item) => item.name)).toEqual(['Big spenders', 'With Enter']);
			expect(savedNames()).toEqual(['Big spenders', 'With Enter']);
		});

		test('a saved item applies its tree with new ids, keeps the current locked conditions and focuses the button', async () => {
			const other = stored(
				'Cheap',
				createFilters([
					filterCondition('tenant', 'eq', 99, { locked: true }),
					filterCondition('amount', 'lt', 20),
					filterGroup('or', [filterCondition('paid', 'isFalse'), filterCondition('date', 'is', '2026-10-09')])
				])
			);
			const onsavedchange = vi.fn<(list: SavedFilter[]) => void>();
			const onremove = vi.fn();
			const current = createFilters([tenant(), filterCondition('client', 'contains', 'Rossi')]);
			const { value, onchange } = await setup({ saved: [other], onsavedchange, onremove }, current);
			await savedButton().click();
			expect(savedNames()).toEqual(['Cheap']);
			await userEvent.fill(nameInput(), 'Mine');
			await saveButton().click();
			const mine = onsavedchange.mock.lastCall![0][1];
			expect(conditions(mine.value)).toEqual([{ field: 'client', operator: 'contains', value: 'Rossi' }]);

			await savedDialog().getByRole('button', { name: 'Cheap', exact: true }).click();
			await expect.element(savedDialog()).not.toBeInTheDocument();
			await expect.element(savedButton()).toHaveFocus();
			expect(conditions(value.value)).toEqual([
				{ field: 'amount', operator: 'lt', value: 20 },
				{
					logic: 'or',
					items: [
						{ field: 'paid', operator: 'isFalse', value: undefined },
						{ field: 'date', operator: 'is', value: '2026-10-09' }
					]
				},
				{ field: 'tenant', operator: 'eq', value: 12 }
			]);
			const locked = filterConditions(value.value!).filter((condition) => condition.locked);
			expect(locked).toEqual([current.items[0]]);
			for (const id of ids(value.value!)) expect(ids(other.value)).not.toContain(id);
			expect(pills()).toEqual(['Amount · < · 20 €', 'Any of 2 filters']);
			await expect.poll(() => lastChange(onchange).value).toEqual(value.value);
			expect(onremove).toHaveBeenCalledExactlyOnceWith({ conditions: [current.items[1]] });

			await savedButton().click();
			await savedDialog().getByRole('button', { name: 'Mine', exact: true }).click();
			expect(conditions(value.value)).toEqual([
				{ field: 'client', operator: 'contains', value: 'Rossi' },
				{ field: 'tenant', operator: 'eq', value: 12 }
			]);
		});

		test('a saved OR tree is wrapped in a group when locked conditions stay, so they still hold', async () => {
			const either = stored(
				'Either',
				createFilters([filterCondition('amount', 'lt', 20), filterCondition('paid', 'isFalse')], 'or')
			);
			const { value, onchange } = await setup({ saved: [either] }, createFilters([tenant()]));
			await savedButton().click();
			await savedDialog().getByRole('button', { name: 'Either', exact: true }).click();
			expect(value.value!.logic).toBe('and');
			expect(conditions(value.value)).toEqual([
				{
					logic: 'or',
					items: [
						{ field: 'amount', operator: 'lt', value: 20 },
						{ field: 'paid', operator: 'isFalse', value: undefined }
					]
				},
				{ field: 'tenant', operator: 'eq', value: 12 }
			]);
			await expect.poll(() => onchange.mock.calls.length).toBeGreaterThan(0);
			expect(lastChange(onchange).builder.toJson().modifiers).toEqual([
				{
					method: 'where',
					kind: 'grouped',
					logicalOperator: 'and',
					children: [
						expect.objectContaining({ key: 'appointments.amount', operator: '<', value: 20 }),
						expect.objectContaining({ key: 'appointments.paid', value: false, logicalOperator: 'or' })
					]
				},
				expect.objectContaining({ key: 'appointments.salonId', operator: '=', value: 12, logicalOperator: 'and' })
			]);
		});

		test('without locked conditions a saved OR tree stays OR at the root', async () => {
			const either = stored(
				'Either',
				createFilters([filterCondition('amount', 'lt', 20), filterCondition('paid', 'isFalse')], 'or')
			);
			const { value } = await setup({ saved: [either] }, initial());
			await savedButton().click();
			await savedDialog().getByRole('button', { name: 'Either', exact: true }).click();
			expect(value.value!.logic).toBe('or');
			expect(conditions(value.value)).toEqual(conditions(either.value));
		});

		test('the delete button removes a saved item and calls onsavedchange', async () => {
			const onsavedchange = vi.fn<(list: SavedFilter[]) => void>();
			const list = [
				stored('A', createFilters([filterCondition('paid', 'isTrue')])),
				stored('B', createFilters([filterCondition('paid', 'isFalse')]))
			];
			const { value } = await setup({ saved: list, onsavedchange }, initial());
			const before = value.value;
			await savedButton().click();
			expect(savedNames()).toEqual(['A', 'B']);
			await savedDialog().getByRole('button', { name: 'Delete saved filters: A' }).click();
			expect(onsavedchange).toHaveBeenCalledExactlyOnceWith([list[1]]);
			expect(savedNames()).toEqual(['B']);
			await savedDialog().getByRole('button', { name: 'Delete saved filters: B' }).click();
			expect(onsavedchange).toHaveBeenLastCalledWith([]);
			await expect.element(savedDialog().getByText('No saved filters')).toBeVisible();
			expect(value.value).toBe(before);
		});

		test('bind:saved is two-way', async () => {
			const saved = bound<SavedFilter[] | undefined>([stored('A', createFilters([filterCondition('paid', 'isTrue')]))]);
			await setup(
				{
					get saved() {
						return saved.value;
					},
					set saved(next) {
						saved.value = next;
					}
				},
				initial()
			);
			await savedButton().click();
			expect(savedNames()).toEqual(['A']);
			saved.value = [...saved.value!, stored('B', createFilters([filterCondition('paid', 'isFalse')]))];
			await expect.poll(savedNames).toEqual(['A', 'B']);
			await userEvent.fill(nameInput(), 'C');
			await saveButton().click();
			expect(saved.value!.map((item) => item.name)).toEqual(['A', 'B', 'C']);
			expect(conditions(saved.value![2].value)).toEqual(conditions(initial()));
			await savedDialog().getByRole('button', { name: 'Delete saved filters: A' }).click();
			expect(saved.value!.map((item) => item.name)).toEqual(['B', 'C']);
		});

		test('savedKey keeps the list in localStorage and reads it on mount, skipping invalid items', async () => {
			const tree = createFilters([filterCondition('paid', 'isTrue')]);
			localStorage.setItem(
				KEY,
				JSON.stringify([stored('Stored', tree), { name: 'No id', value: tree }, null, { id: 'x', name: 'No value' }])
			);
			const onsavedchange = vi.fn<(list: SavedFilter[]) => void>();
			const first = await setup({ savedKey: KEY, onsavedchange }, initial());
			await savedButton().click();
			expect(savedNames()).toEqual(['Stored']);
			expect(onsavedchange).not.toHaveBeenCalled();
			await userEvent.fill(nameInput(), 'Mine');
			await saveButton().click();
			const persisted = JSON.parse(localStorage.getItem(KEY)!) as SavedFilter[];
			expect(persisted.map((item) => item.name)).toEqual(['Stored', 'Mine']);
			expect(conditions(persisted[1].value)).toEqual(conditions(initial()));
			expect(onsavedchange.mock.lastCall![0]).toEqual(persisted);
			await savedDialog().getByRole('button', { name: 'Delete saved filters: Stored' }).click();
			expect((JSON.parse(localStorage.getItem(KEY)!) as SavedFilter[]).map((item) => item.name)).toEqual(['Mine']);
			await first.screen.unmount();

			const second = await setup({ savedKey: KEY });
			await savedButton().click();
			expect(savedNames()).toEqual(['Mine']);
			await savedDialog().getByRole('button', { name: 'Mine', exact: true }).click();
			expect(conditions(second.value.value)).toEqual(conditions(initial()));
		});

		test('invalid stored JSON is ignored; a missing key keeps the saved list of the app', async () => {
			localStorage.setItem(KEY, '{not json');
			const broken = await setup({ savedKey: KEY }, initial());
			await savedButton().click();
			await expect.element(savedDialog().getByText('No saved filters')).toBeVisible();
			await userEvent.fill(nameInput(), 'Fixed');
			await saveButton().click();
			expect((JSON.parse(localStorage.getItem(KEY)!) as SavedFilter[]).map((item) => item.name)).toEqual(['Fixed']);
			await broken.screen.unmount();

			localStorage.setItem(KEY, '{"id":"x","name":"Not a list"}');
			const object = await setup({ savedKey: KEY });
			await savedButton().click();
			await expect.element(savedDialog().getByText('No saved filters')).toBeVisible();
			await object.screen.unmount();

			const app = [stored('From the app', createFilters([filterCondition('paid', 'isTrue')]))];
			await setup({ saved: app, savedKey: 'aurora-test-missing-key' });
			await savedButton().click();
			expect(savedNames()).toEqual(['From the app']);
		});
	});
});

describe('Filters: operator sets, compact rows, presets and nested menus', () => {
	const radios = (name: string) =>
		card(name)
			.getByRole('radio')
			.elements()
			.map((radio) => radio.textContent?.trim());
	const values = (select: HTMLSelectElement) => [...select.options].map((option) => option.value);

	test('operatorSet and typeOperators reach the card, the panel and the operator of new conditions', async () => {
		const setupResult = await setup({ operatorSet: 'basic', typeOperators: { number: ['between', 'eq'] } });
		await pickField(setupResult, 'Client');
		expect(radios('Client')).toEqual(['contains', 'is']);
		await userEvent.keyboard('{Escape}');
		await expect.element(card('Client')).not.toBeInTheDocument();

		await pickField(setupResult, 'Amount');
		expect(radios('Amount')).toEqual(['between', '=']);
		await expect.element(card('Amount').getByRole('radio', { name: 'between' })).toHaveAttribute('aria-checked', 'true');
		await expect.element(card('Amount').getByRole('spinbutton', { name: 'Amount From' })).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(card('Amount')).not.toBeInTheDocument();

		await openPanel();
		await panelAdd().click();
		await userEvent.selectOptions(fieldSelect(rows()[0].element), 'date');
		expect(operatorSelect(rows()[0].element).value).toBe('is');
		expect(values(operatorSelect(rows()[0].element))).toEqual(['is', 'between', 'period']);
		await userEvent.selectOptions(fieldSelect(rows()[0].element), 'amount');
		expect(operatorSelect(rows()[0].element).value).toBe('between');
		expect(values(operatorSelect(rows()[0].element))).toEqual(['between', 'eq']);
		await setupResult.screen.unmount();

		const all = await setup({ operatorSet: 'all' });
		await pickField(all, 'Client');
		expect(values(card('Client').getByRole('combobox', { name: 'Operator' }).element() as HTMLSelectElement)).toEqual([
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

	test('a condition with an operator the fields do not offer keeps its pill, its query and its operator', async () => {
		const { screen, value, onchange, filtersButton } = await setup(
			{ operatorSet: 'basic' },
			createFilters([filterCondition('client', 'startsWith', 'Ro')])
		);
		expect(pills()).toEqual(['Client · starts with · Ro']);
		expect(filtersButton.element().querySelector('.aurora-filters-count')?.textContent).toBe('1');
		value.value = createFilters([...value.value!.items, filterCondition('amount', 'notBetween', { from: 1, to: 9 })]);
		await expect.poll(() => onchange.mock.calls.length).toBe(1);
		const query = JSON.stringify(lastChange(onchange).builder.toJson());
		expect(query).toContain('"^Ro"');
		expect(query).toContain('"operator":"<","value":1');
		expect(pills()).toEqual(['Client · starts with · Ro', 'Amount · not between · 1 € – 9 €']);

		await screen.getByRole('button', { name: 'Edit filter: Client starts with Ro' }).click();
		expect(radios('Client')).toEqual(['contains', 'is', 'starts with']);
		await expect.element(card('Client').getByRole('radio', { name: 'starts with' })).toHaveAttribute('aria-checked', 'true');
		await expect.element(card('Client').getByRole('textbox', { name: 'Client' })).toHaveValue('Ro');
		await userEvent.keyboard('{Escape}');

		await openPanel();
		expect(operatorSelect(rows()[0].element).value).toBe('startsWith');
		expect(values(operatorSelect(rows()[0].element))).toEqual(['contains', 'is', 'startsWith']);
		expect(operatorSelect(rows()[1].element).value).toBe('notBetween');
		await expect.element(rows()[1].locator.getByRole('spinbutton', { name: 'Amount From' })).toHaveValue(1);
	});

	test('the panel is 880px wide with 16px of padding by default', async () => {
		await setup({}, initial());
		await openPanel();
		const style = getComputedStyle(panelElement()!);
		expect(style.width).toBe('880px');
		expect(style.padding).toBe('16px');
	});

	test('nested groups alternate two tones, set by --filters-group-background and --filters-group-alt-background', async () => {
		await setup(
			{ allowOr: true, maxDepth: 2 },
			createFilters([
				filterCondition('paid', 'isTrue'),
				filterGroup('or', [
					filterCondition('amount', 'gte', 50),
					filterGroup('and', [filterCondition('amount', 'lt', 10), filterCondition('paid', 'isFalse')])
				])
			])
		);
		await openPanel();
		const group = (level: number) => panelElement()!.querySelector<HTMLElement>(`.aurora-filter-group[data-depth="${level}"]`)!;
		const background = (level: number) => getComputedStyle(group(level)).backgroundColor;
		expect(group(0)).not.toHaveAttribute('data-alt');
		expect(group(1)).not.toHaveAttribute('data-alt');
		expect(group(2)).toHaveAttribute('data-alt');
		expect(background(2)).not.toBe(background(1));
		expect(getComputedStyle(group(2)).padding).toBe('14px');

		const root = document.documentElement.style;
		root.setProperty('--filters-group-background', 'rgb(1, 2, 3)');
		root.setProperty('--filters-group-alt-background', 'rgb(4, 5, 6)');
		try {
			expect(background(1)).toBe('rgb(1, 2, 3)');
			expect(background(2)).toBe('rgb(4, 5, 6)');
		} finally {
			root.removeProperty('--filters-group-background');
			root.removeProperty('--filters-group-alt-background');
		}
	});

	test('panel rows use compact inputs; the card keeps the wide ones', async () => {
		const { screen } = await setup(
			{},
			createFilters([
				filterCondition('date', 'is', '2026-10-09'),
				filterCondition('date', 'between', { from: '2026-10-01' }),
				filterCondition('client', 'anyOf', ['a', 'b', 'c', 'd']),
				filterCondition('service', 'in', SERVICES.slice(0, 3)),
				filterCondition('status', 'in', [{ value: 'confirmed', label: 'Confirmed' }])
			])
		);
		await openPanel();
		const [date, range, client, service, status] = rows();
		const format = '.aurora-date-picker-text-field-format';
		await expect
			.element(date.locator.getByRole('combobox', { name: 'Date', exact: true }))
			.toHaveAttribute('placeholder', 'mm/dd/yyyy');
		expect(date.element.querySelector(format)).toBeNull();
		const ends = [...range.element.querySelectorAll('.aurora-filter-row-value input')];
		expect(ends.map((input) => input.getAttribute('placeholder'))).toEqual(['mm/dd/yyyy', 'mm/dd/yyyy']);
		expect(range.element.querySelector(format)).toBeNull();

		const listChips = () =>
			[...client.element.querySelectorAll('.aurora-filter-value-chips .aurora-chip')].map((chip) => chip.textContent?.trim());
		expect(listChips()).toEqual(['a', 'b']);
		const more = client.locator.getByRole('button', { name: '+2' });
		await expect.poll(() => tooltipText(more.element())).toBe('c, d');
		await more.click();
		await expect.poll(listChips).toEqual(['a', 'b', 'c', 'd']);
		await client.locator.getByRole('button', { name: 'Show less' }).click();
		await expect.poll(listChips).toEqual(['a', 'b']);

		expect(service.element.querySelectorAll('.aurora-autocomplete-selection .aurora-chip')).toHaveLength(1);
		expect(service.element.querySelector('.aurora-autocomplete-counter')?.textContent?.trim()).toBe('+2');
		expect(status.element.querySelector('.aurora-filter-value-toggles')).toBeNull();
		await expect
			.element(status.locator.getByRole('combobox', { name: 'Status', exact: true }))
			.toHaveAttribute('placeholder', 'Choose…');
		await panelAdd().click();
		await userEvent.selectOptions(fieldSelect(rows()[5].element), 'amount');
		await expect.element(rows()[5].locator.getByRole('spinbutton', { name: 'Amount' })).toHaveAttribute('placeholder', 'Value');

		await userEvent.keyboard('{Escape}');
		await expect.poll(panelElement).toBeNull();
		await screen.getByRole('button', { name: 'Edit filter: Date is Oct 9, 2026' }).click();
		const editor = card('Date').element();
		expect(editor.querySelector(format)).not.toBeNull();
		expect(editor.querySelector('.aurora-filter-value input')).not.toHaveAttribute('placeholder');
		await userEvent.keyboard('{Escape}');
		await screen.getByRole('button', { name: 'Edit filter: Status is Confirmed' }).click();
		await expect.element(card('Status').getByRole('button', { name: 'Waiting' })).toBeVisible();
	});

	test('a date-and-time condition round-trips through its field, in the card and in a panel row', async () => {
		const delivered: FilterField = {
			name: 'delivered',
			label: 'Delivered',
			type: 'date',
			withTime: true,
			column: 'orders.deliveredAt'
		};
		const list = [...fields, delivered];
		const { screen, value, onchange } = await setup(
			{ fields: list },
			createFilters([filterCondition('delivered', 'before', '2026-10-09T08:15')])
		);
		const pill = screen.getByRole('button', { name: /^Edit filter: Delivered before/ });
		await expect.element(pill).toHaveTextContent('Oct 9, 2026, 8:15 AM');
		await pill.click();
		const field = card('Delivered').getByRole('combobox', { name: 'Delivered', exact: true });
		await expect.element(field).toHaveValue('10/09/2026 08:15 AM');
		await expect.element(field).toHaveAttribute('placeholder', 'mm/dd/yyyy hh:mm am');
		await userEvent.fill(field, '10/09/2026 02:30 PM');
		await expect.poll(() => conditions(value.value)).toEqual([
			{ field: 'delivered', operator: 'before', value: '2026-10-09T14:30' }
		]);
		await expect.poll(() => onchange.mock.calls.length).toBeGreaterThan(0);
		const typed = lastChange(onchange, list).builder.toJson();
		expect(typed).toEqual(
			filtersToBuilder(createFilters([filterCondition('delivered', 'before', '2026-10-09T14:30')]), list).toJson()
		);
		expect(typed.modifiers).toEqual([
			{
				method: 'where',
				kind: 'simple',
				key: 'orders.deliveredAt',
				operator: '<',
				value: new Date(2026, 9, 9, 14, 30),
				logicalOperator: 'and'
			}
		]);
		await userEvent.keyboard('{Escape}');
		await userEvent.keyboard('{Escape}');
		await expect.element(card('Delivered')).not.toBeInTheDocument();

		await openPanel();
		const [row] = rows();
		const input = row.locator.getByRole('combobox', { name: 'Delivered', exact: true });
		await expect.element(input).toHaveValue('10/09/2026 02:30 PM');
		await expect.element(input).toHaveAttribute('placeholder', 'mm/dd/yyyy hh:mm am');
		expect(row.element.querySelector('.aurora-date-time-picker-text-field-format')).toBeNull();
		await userEvent.selectOptions(operatorSelect(row.element), 'between');
		const from = row.locator.getByRole('combobox', { name: 'Delivered From', exact: true });
		await expect.element(from).toHaveAttribute('placeholder', 'From');
		await userEvent.fill(from, '10/01/2026 09:00 AM');
		await expect.poll(() => conditions(value.value)).toEqual([
			{ field: 'delivered', operator: 'between', value: { from: '2026-10-01T09:00' } }
		]);
		expect(lastChange(onchange, list).builder.toJson().modifiers).toEqual([
			{
				method: 'where',
				kind: 'simple',
				key: 'orders.deliveredAt',
				operator: '>=',
				value: new Date(2026, 9, 1, 9, 0),
				logicalOperator: 'and'
			}
		]);
	});

	test('a click outside closes the open list of a row first, then the panel', async () => {
		const { screen } = await setup({ appendSnippet: snippet('<button type="button">Outside</button>') }, initial());
		await openPanel();
		await rows()[0].locator.getByRole('combobox', { name: 'Service', exact: true }).click();
		await expect.element(page.getByRole('listbox')).toBeVisible();
		const outside = screen.getByRole('button', { name: 'Outside' });
		await outside.click();
		await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
		await expect.element(panel()).toBeVisible();
		await outside.click();
		await expect.poll(panelElement).toBeNull();
	});

	describe('presets', () => {
		const confirmed = [{ value: 'confirmed', label: 'Confirmed' }];
		const presets: FilterPreset[] = [
			{ id: 'today', label: 'Today', conditions: [{ field: 'date', operator: 'period', value: 'today' }] },
			{
				id: 'unpaid',
				label: 'Not paid',
				conditions: [
					{ field: 'paid', operator: 'isFalse' },
					{ field: 'amount', operator: 'gt', value: 0 }
				]
			},
			{ id: 'confirmed', label: 'Confirmed', conditions: [{ field: 'status', operator: 'in', value: confirmed }] },
			{ id: 'mine', label: 'Mine', conditions: [{ field: 'client', operator: 'is', value: 'Me', locked: true }] }
		];
		const chip = (name: string) =>
			page.getByRole('group', { name: 'Filters', exact: true }).getByRole('button', { name, exact: true });
		const pressed = (name: string, state: boolean) =>
			expect.element(chip(name)).toHaveAttribute('aria-pressed', String(state));

		test('a chip is on while every condition of its preset is in the tree, however it got there', async () => {
			const { value } = await setup(
				{ presets },
				createFilters([filterCondition('date', 'period', 'today'), filterCondition('paid', 'isFalse')])
			);
			await pressed('Today', true);
			await pressed('Not paid', false);
			value.value = createFilters([...value.value!.items, filterGroup('or', [filterCondition('amount', 'gt', 0)])]);
			await pressed('Not paid', true);
			value.value = createFilters([filterCondition('date', 'period', 'yesterday')]);
			await pressed('Today', false);
			await pressed('Not paid', false);
		});

		test('editing a condition of a preset turns its chip off; going back turns it on', async () => {
			const { screen } = await setup({ presets });
			await chip('Today').click();
			await pressed('Today', true);
			await screen.getByRole('button', { name: 'Edit filter: Date in Today' }).click();
			const period = card('Date').getByRole('combobox', { name: 'Date', exact: true });
			await period.selectOptions('yesterday');
			await pressed('Today', false);
			await period.selectOptions('today');
			await pressed('Today', true);
			await card('Date').getByRole('combobox', { name: 'Operator' }).selectOptions('is');
			await pressed('Today', false);
		});

		test('clicking an active chip removes exactly the conditions it matched', async () => {
			const tree = createFilters([
				filterCondition('paid', 'isFalse'),
				filterCondition('amount', 'gt', 5),
				filterCondition('amount', 'gt', 0),
				filterCondition('paid', 'isFalse')
			]);
			const onremove = vi.fn<(change: { conditions: FilterCondition[] }) => void>();
			const { value } = await setup({ presets, onremove }, tree);
			await pressed('Not paid', true);
			await chip('Not paid').click();
			await pressed('Not paid', false);
			expect(value.value!.items.map((node) => node.id)).toEqual([tree.items[1].id, tree.items[3].id]);
			expect(onremove.mock.lastCall![0].conditions.map((condition) => condition.id)).toEqual([
				tree.items[0].id,
				tree.items[2].id
			]);
		});

		test('v5 fix: locked conditions match only locked preset conditions, so a chip never removes a constraint of the app', async () => {
			const constraint = filterCondition('status', 'in', confirmed, { locked: true });
			const { value } = await setup({ presets }, createFilters([constraint]));
			await pressed('Confirmed', false);
			await chip('Confirmed').click();
			await pressed('Confirmed', true);
			expect(filterConditions(value.value!).map((condition) => !!condition.locked)).toEqual([true, false]);
			await chip('Confirmed').click();
			await pressed('Confirmed', false);
			expect(value.value!.items).toEqual([constraint]);

			await chip('Mine').click();
			await pressed('Mine', true);
			const added = filterConditions(value.value!).at(-1)!;
			expect(added).toMatchObject({ field: 'client', operator: 'is', value: 'Me', locked: true, preset: 'mine' });
			await expect.element(page.getByRole('button', { name: 'Remove filter: Client' })).not.toBeInTheDocument();
			await chip('Mine').click();
			await pressed('Mine', false);
			expect(value.value!.items).toEqual([constraint]);
		});
	});
});

describe('Filters locale', () => {
	test('follow setDefaultLocale, and the locale prop wins over it', async () => {
		const inherited = await renderWithDefaultLocale('it', Filters, { fields, applyDelay: 0 });
		await expect.element(inherited.getByRole('button', { name: 'Aggiungi filtro', exact: true }).first()).toBeVisible();
		await inherited.unmount();
		const own = await renderWithDefaultLocale('it', Filters, { fields, applyDelay: 0, locale: 'en' });
		await expect.element(own.getByRole('button', { name: 'Add filter', exact: true }).first()).toBeVisible();
	});
});
