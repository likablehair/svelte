import { createRawSnippet, type Component } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ColumnManagerComponent from '#lib/components/composed/tables/ColumnManager.svelte';
import type { TableColumn, TableColumnState } from '#lib/utils/table/types.js';
import WithTable from '../fixtures/column-manager/WithTable.svelte';
import { instantDrawers, renderWithDefaultLocale, tooltipText } from '../helpers.js';

const ColumnManager = ColumnManagerComponent as Component<any>;

const columns: TableColumn[] = [
	{ key: 'code', label: 'Code', pinned: true },
	{ key: 'name', label: 'Name', required: true },
	{ key: 'price', label: 'Price', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } },
	{ key: 'stock', label: 'Stock', type: 'number', hidden: true, description: 'Pieces in the shop' },
	{ key: 'added', label: 'Added', type: 'date', hidden: true, info: 'Day of the first order' }
];

const many: TableColumn[] = [
	...columns,
	{ key: 'city', label: 'Città', hidden: true },
	{ key: 'notes', label: 'Notes', hidden: true },
	{ key: 'vat', label: 'VAT number', hidden: true }
];

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

function names(selector: string) {
	return [...document.querySelectorAll(`${selector} .aurora-column-manager-name`)].map((node) =>
		node.textContent?.trim()
	);
}

const visibleNames = () => names('.aurora-column-manager-list');
const availableNames = () => names('.aurora-column-manager-available');

function headers() {
	return [...document.querySelectorAll('.aurora-table thead th')].map((cell) => cell.textContent?.trim());
}

function openManager(props: Record<string, unknown> = {}) {
	const open = bound(true);
	const state = bound<TableColumnState[] | undefined>(props.columnState as TableColumnState[] | undefined);
	const result = render(ColumnManager, {
		columns,
		...props,
		get open() {
			return open.value;
		},
		set open(next) {
			open.value = next;
		},
		get columnState() {
			return state.value;
		},
		set columnState(next) {
			state.value = next;
		}
	});
	return { rendered: result, open, state };
}

const keys = (state: TableColumnState[] | undefined) =>
	state?.map((entry) => `${entry.visible ? '' : '-'}${entry.pinned ? '*' : ''}${entry.key}`);

describe('ColumnManager', () => {
	instantDrawers();

	test('is closed until open, then a dialog named by its title with the count of the visible columns', async () => {
		const open = bound(false);
		render(ColumnManager, {
			columns,
			get open() {
				return open.value;
			},
			set open(next) {
				open.value = next;
			}
		});
		expect(document.querySelector('dialog')).toBeNull();
		open.value = true;
		const dialog = page.getByRole('dialog', { name: 'Table columns' });
		await expect.element(dialog).toBeVisible();
		await expect.element(dialog.getByRole('heading', { level: 2 })).toHaveTextContent('3 of 5 columns visible');
	});

	test('lists the visible columns, pinned first, and the hidden ones with their type and description', async () => {
		openManager({ columnState: [{ key: 'price', visible: true }] });
		await expect.element(page.getByRole('list', { name: 'Visible' })).toBeVisible();
		expect(visibleNames()).toEqual(['Code', 'Price', 'Name']);
		expect(availableNames()).toEqual(['Stock', 'Added']);
		const cards = [...document.querySelectorAll('.aurora-column-manager-card')].map((card) =>
			card.textContent?.replace(/\s+/g, ' ').trim()
		);
		expect(cards).toEqual(['Stock Number Pieces in the shop', 'Added Date Day of the first order']);
		await expect.element(page.getByText('2 available')).toBeVisible();
		await expect.element(page.getByText('drag to reorder')).toBeVisible();
	});

	test('the tag reads the kind of the column: currency, percentage, date and time, yes/no, none for custom', async () => {
		openManager({
			columns: [
				{ key: 'a', label: 'A', hidden: true, type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } },
				{ key: 'b', label: 'B', hidden: true, type: 'number', numberFormat: { style: 'percent' } },
				{ key: 'c', label: 'C', hidden: true, type: 'datetime' },
				{ key: 'd', label: 'D', hidden: true, type: 'boolean' },
				{ key: 'e', label: 'E', hidden: true, type: 'custom' },
				{ key: 'f', label: 'F' }
			]
		});
		await expect.element(page.getByRole('list', { name: 'Available' })).toBeVisible();
		const tags = [...document.querySelectorAll('.aurora-column-manager-card')].map(
			(card) => card.querySelector('.aurora-column-manager-tag')?.textContent ?? null
		);
		expect(tags).toEqual(['Currency', 'Percentage', 'Date and time', 'Yes/No', null]);
	});

	test('a column icon replaces the icon of its type', async () => {
		openManager({ columns: [{ key: 'a', label: 'A', icon: 'M1 1H2Z' }, { key: 'b', label: 'B' }] });
		await expect.element(page.getByRole('list', { name: 'Visible' })).toBeVisible();
		const paths = [...document.querySelectorAll('.aurora-column-manager-type-icon path')].map((path) =>
			path.getAttribute('d')
		);
		expect(paths[0]).toBe('M1 1H2Z');
		expect(paths[1]).not.toBe('M1 1H2Z');
	});

	test('edits change the bound state at once, so a table bound to it follows', async () => {
		render(WithTable, { columns });
		await userEvent.click(page.getByRole('button', { name: 'Columns' }));
		expect(headers()).toEqual(['Code', 'Name', 'Price']);
		await userEvent.click(page.getByRole('button', { name: 'Add Stock' }));
		await expect.poll(headers).toEqual(['Code', 'Name', 'Price', 'Stock']);
		await userEvent.click(page.getByRole('button', { name: 'Hide Price' }));
		await expect.poll(headers).toEqual(['Code', 'Name', 'Stock']);
		await userEvent.click(page.getByRole('button', { name: 'Pin Stock' }));
		await expect.poll(headers).toEqual(['Code', 'Stock', 'Name']);
	});

	test('closing without saving puts back the state it opened with and calls oncancel', async () => {
		const oncancel = vi.fn();
		const onsave = vi.fn();
		const initial: TableColumnState[] = [{ key: 'price', visible: false }];
		const { open, state } = openManager({ columnState: initial, oncancel, onsave });
		await userEvent.click(page.getByRole('button', { name: 'Add Stock' }));
		expect(keys(state.value)).toEqual(['*code', 'name', 'stock', '-price', '-added']);
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => open.value).toBe(false);
		expect(state.value).toEqual(initial);
		expect(oncancel).toHaveBeenCalledTimes(1);
		expect(onsave).not.toHaveBeenCalled();
	});

	test('closing from outside cancels as well', async () => {
		const oncancel = vi.fn();
		const { open, state } = openManager({ oncancel });
		await userEvent.click(page.getByRole('button', { name: 'Add Stock' }));
		open.value = false;
		await expect.poll(() => state.value).toBeUndefined();
		expect(oncancel).toHaveBeenCalledTimes(1);
	});

	test('"Save view" calls onsave with the full state, keeps it and closes', async () => {
		const onsave = vi.fn();
		const oncancel = vi.fn();
		const { open, state } = openManager({ onsave, oncancel });
		await userEvent.click(page.getByRole('button', { name: 'Add Added' }));
		await userEvent.click(page.getByRole('button', { name: 'Save view' }));
		expect(onsave).toHaveBeenCalledTimes(1);
		const saved = onsave.mock.calls[0][0].columnState;
		expect(keys(saved)).toEqual(['*code', 'name', 'price', 'added', '-stock']);
		expect(JSON.parse(JSON.stringify(saved))).toEqual(saved);
		await expect.poll(() => open.value).toBe(false);
		expect(state.value).toEqual(saved);
		expect(oncancel).not.toHaveBeenCalled();
	});

	test('"Reset" goes back to the default view, widths included, and is disabled there', async () => {
		const { state } = openManager({
			columnState: [
				{ key: 'stock', visible: true, width: 120 },
				{ key: 'code', visible: true, pinned: false }
			]
		});
		const reset = page.getByRole('button', { name: 'Reset' });
		await expect.element(reset).toBeEnabled();
		await userEvent.click(reset);
		expect(keys(state.value)).toEqual(['*code', 'name', 'price', '-stock', '-added']);
		expect(state.value?.some((entry) => entry.width)).toBe(false);
		await expect.element(reset).toBeDisabled();
	});

	test('required columns and the last visible one cannot be hidden, and the tooltip says why', async () => {
		const { state } = openManager({
			columns: [
				{ key: 'a', label: 'A', required: true },
				{ key: 'b', label: 'B' },
				{ key: 'c', label: 'C', hidden: true }
			]
		});
		const hideA = page.getByRole('button', { name: 'Hide A' });
		await expect.element(hideA).toHaveAttribute('aria-disabled', 'true');
		expect(tooltipText(hideA.element())).toBe('Always visible');
		expect(tooltipText(page.getByRole('button', { name: 'Hide B' }).element())).toBe('Hide');
		(hideA.element() as HTMLElement).click();
		expect(visibleNames()).toEqual(['A', 'B']);

		openManager({ columns: [{ key: 'x', label: 'X' }, { key: 'y', label: 'Y', hidden: true }] });
		const hideX = page.getByRole('button', { name: 'Hide X' });
		await expect.element(hideX).toHaveAttribute('aria-disabled', 'true');
		expect(tooltipText(hideX.element())).toBe('At least one column stays visible');
		expect(state.value).toBeUndefined();
	});

	test('pin buttons are toggles: pinned columns move first and say "Unpin"', async () => {
		const { state } = openManager();
		const pinCode = page.getByRole('button', { name: 'Pin Code' });
		await expect.element(pinCode).toHaveAttribute('aria-pressed', 'true');
		expect(tooltipText(pinCode.element())).toBe('Unpin');
		const pinPrice = page.getByRole('button', { name: 'Pin Price' });
		await expect.element(pinPrice).toHaveAttribute('aria-pressed', 'false');
		expect(tooltipText(pinPrice.element())).toBe('Pin to the left');
		await userEvent.click(pinPrice);
		expect(visibleNames()).toEqual(['Code', 'Price', 'Name']);
		await expect.element(pinPrice).toHaveAttribute('aria-pressed', 'true');
		await expect.element(pinPrice).toHaveFocus();
		await userEvent.click(pinCode);
		expect(keys(state.value)).toEqual(['*price', 'code', 'name', '-stock', '-added']);
	});

	test('pinnable false removes the pin buttons and marks the pinned columns', async () => {
		openManager({ pinnable: false });
		await expect.element(page.getByRole('list', { name: 'Visible' })).toBeVisible();
		expect(document.querySelectorAll('[aria-pressed]')).toHaveLength(0);
		const marks = document.querySelectorAll('.aurora-column-manager-pinned');
		expect(marks).toHaveLength(1);
		expect(marks[0].closest('li')?.textContent).toContain('Code');
		expect(marks[0].querySelector('title')?.textContent).toBe('Pinned');
	});

	test('the handle moves a column with the arrow keys, inside its group, and announces the position', async () => {
		const { state } = openManager({
			columnState: [
				{ key: 'code', visible: true, pinned: true },
				{ key: 'price', visible: true, pinned: true },
				{ key: 'name', visible: true },
				{ key: 'stock', visible: true }
			]
		});
		const move = page.getByRole('button', { name: 'Move Price' });
		await expect.element(move).toHaveAccessibleDescription('Up and down arrows to move it');
		(move.element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowUp}');
		expect(keys(state.value)).toEqual(['*price', '*code', 'name', 'stock', '-added']);
		await expect.element(move).toHaveFocus();
		await expect
			.element(page.getByText('Price, position 1 of 2'))
			.toBeInTheDocument();
		await userEvent.keyboard('{ArrowUp}');
		expect(keys(state.value)).toEqual(['*price', '*code', 'name', 'stock', '-added']);
		const moveName = page.getByRole('button', { name: 'Move Name' });
		(moveName.element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowUp}');
		expect(keys(state.value)).toEqual(['*price', '*code', 'name', 'stock', '-added']);
		await userEvent.keyboard('{ArrowDown}');
		expect(keys(state.value)).toEqual(['*price', '*code', 'stock', 'name', '-added']);
	});

	test('the handle drags a column with the pointer', async () => {
		const { state } = openManager({
			columnState: [
				{ key: 'code', visible: true, pinned: true },
				{ key: 'name', visible: true },
				{ key: 'price', visible: true },
				{ key: 'stock', visible: true }
			]
		});
		const grip = page.getByRole('button', { name: 'Move Name' }).element() as HTMLElement;
		const row = grip.closest('li')!;
		const step = row.getBoundingClientRect().height + 4;
		const start = grip.getBoundingClientRect();
		const x = start.left + start.width / 2;
		const y = start.top + start.height / 2;
		const pointer = (type: string, clientY: number) =>
			new PointerEvent(type, { bubbles: true, button: 0, pointerId: 7, clientX: x, clientY });
		grip.dispatchEvent(pointer('pointerdown', y));
		await expect.poll(() => row.hasAttribute('data-dragging')).toBe(true);
		document.dispatchEvent(pointer('pointermove', y + step * 1.6));
		expect(keys(state.value)).toEqual(['*code', 'price', 'stock', 'name', '-added']);
		document.dispatchEvent(pointer('pointermove', y + step * 0.6));
		expect(keys(state.value)).toEqual(['*code', 'price', 'name', 'stock', '-added']);
		document.dispatchEvent(pointer('pointermove', y - step * 3));
		expect(keys(state.value)).toEqual(['*code', 'name', 'price', 'stock', '-added']);
		document.dispatchEvent(pointer('pointerup', y - step * 3));
		await expect.poll(() => row.hasAttribute('data-dragging')).toBe(false);
	});

	test('search filters both lists by name, type and description, accents aside, and highlights the matches', async () => {
		openManager({ columns: many });
		const search = page.getByRole('searchbox', { name: 'Search by name, type or description…' });
		await userEvent.fill(search, 'citta');
		expect(visibleNames()).toEqual([]);
		expect(availableNames()).toEqual(['Città']);
		expect([...document.querySelectorAll('dialog mark')].map((mark) => mark.textContent)).toEqual(['Città']);
		await expect.element(page.getByText('1 result')).toBeVisible();
		await userEvent.fill(search, 'number');
		expect(visibleNames()).toEqual([]);
		expect(availableNames()).toEqual(['Stock', 'VAT number']);
		await userEvent.fill(search, 'first order');
		expect(availableNames()).toEqual(['Added']);
		await userEvent.fill(search, 'pri');
		expect(visibleNames()).toEqual(['Price']);
		await expect.element(page.getByRole('button', { name: 'Move Price' })).toBeDisabled();
		await expect.element(page.getByText('drag to reorder')).not.toBeInTheDocument();
		await userEvent.fill(search, 'zzz');
		await expect.element(page.getByText('No column matches “zzz”')).toBeVisible();
	});

	test('search shows with more than 7 columns, or with searchable', async () => {
		const first = openManager();
		await expect.element(page.getByRole('list', { name: 'Visible' })).toBeVisible();
		expect(document.querySelector('input[type="search"]')).toBeNull();
		await (await first.rendered).unmount();
		openManager({ searchable: true });
		await expect.element(page.getByRole('searchbox')).toBeVisible();
	});

	test('adding a column moves the focus to the next one to add, hiding to the next visible one', async () => {
		openManager();
		await userEvent.click(page.getByRole('button', { name: 'Add Stock' }));
		await expect.element(page.getByRole('button', { name: 'Add Added' })).toHaveFocus();
		await userEvent.click(page.getByRole('button', { name: 'Add Added' }));
		await expect.element(page.getByRole('button', { name: 'Hide Added' })).toHaveFocus();
		await expect.element(page.getByText('Every column is visible')).toBeVisible();
		await userEvent.click(page.getByRole('button', { name: 'Hide Price' }));
		await expect.element(page.getByRole('button', { name: 'Hide Stock' })).toHaveFocus();
	});

	test('a click anywhere on an available card adds the column', async () => {
		const { state } = openManager();
		await userEvent.click(page.getByText('Pieces in the shop'));
		expect(keys(state.value)).toEqual(['*code', 'name', 'price', 'stock', '-added']);
	});

	test('is a bottom sheet below 640px and a drawer on the right above', async () => {
		openManager();
		const dialog = page.getByRole('dialog');
		await expect.element(dialog).toHaveAttribute('data-position', 'right');
		await page.viewport(500, 700);
		try {
			await expect.element(dialog).toHaveAttribute('data-position', 'bottom');
		} finally {
			await page.viewport(1280, 800);
		}
	});

	test('the texts follow locale, and labels win', async () => {
		openManager({ locale: 'it', labels: { save: 'Applica' } });
		await expect.element(page.getByRole('dialog', { name: 'Colonne della tabella' })).toBeVisible();
		await expect.element(page.getByText('3 di 5 colonne visibili')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Applica' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Nascondi Price' })).toBeVisible();
		await expect.element(page.getByText('Pieces in the shop')).toBeVisible();
		await expect.element(page.getByText('Numero', { exact: true })).toBeVisible();
	});

	test('the default locale of the app applies, and the locale prop wins', async () => {
		const first = renderWithDefaultLocale('it', ColumnManager, { columns, open: true });
		await expect.element(page.getByRole('dialog', { name: 'Colonne della tabella' })).toBeVisible();
		await (await first).unmount();
		renderWithDefaultLocale('it', ColumnManager, { columns, open: true, locale: 'en' });
		await expect.element(page.getByRole('dialog', { name: 'Table columns' })).toBeVisible();
	});

	test('snippets replace a column, the empty search and the buttons', async () => {
		const { open, state } = openManager({
			columns: many,
			columnSnippet: createRawSnippet((params: () => { column: TableColumn; visible: boolean }) => ({
				render: () => `<b class="custom">${params().column.key}:${params().visible}</b>`
			})),
			emptySnippet: createRawSnippet((params: () => { query: string }) => ({
				render: () => `<p>Nothing for ${params().query}</p>`
			})),
			actionsSnippet: createRawSnippet(() => ({ render: () => '<button type="button">Done</button>' }))
		});
		await expect.element(page.getByText('code:true')).toBeVisible();
		await expect.element(page.getByText('stock:false')).toBeVisible();
		expect(document.querySelector('.aurora-column-manager-type-icon')).toBeNull();
		await expect.element(page.getByRole('button', { name: 'Move Code' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Done' })).toBeVisible();
		expect(page.getByRole('button', { name: 'Save view' }).query()).toBeNull();
		await userEvent.fill(page.getByRole('searchbox'), 'qq');
		await expect.element(page.getByText('Nothing for qq')).toBeVisible();
		expect(open.value).toBe(true);
		expect(state.value).toBeUndefined();
	});

	test('actionsSnippet receives save, reset and cancel', async () => {
		const onsave = vi.fn();
		const actions = createRawSnippet(
			(params: () => { save: () => void; reset: () => void; cancel: () => void }) => ({
				render: () => '<div><button type="button">Keep</button></div>',
				setup: (node) => {
					node.querySelector('button')!.addEventListener('click', () => params().save());
				}
			})
		);
		const { open } = openManager({ actionsSnippet: actions, onsave });
		await userEvent.click(page.getByRole('button', { name: 'Keep' }));
		expect(onsave).toHaveBeenCalledTimes(1);
		await expect.poll(() => open.value).toBe(false);
	});

	test('native attributes reach the dialog, classes reach the parts, variables style the instance', async () => {
		const first = openManager({
			id: 'columns',
			'data-testid': 'manager',
			class: { drawer: 'my-drawer', item: 'my-item', card: 'my-card', panel: 'my-panel' }
		});
		const dialog = page.getByTestId('manager');
		await expect.element(dialog).toHaveAttribute('id', 'columns');
		await expect.element(dialog).toHaveClass('aurora-column-manager');
		await expect.element(dialog).toHaveClass('my-drawer');
		expect(document.querySelectorAll('li.my-item')).toHaveLength(3);
		expect(document.querySelectorAll('li.my-card')).toHaveLength(2);
		expect(document.querySelector('.my-panel')).not.toBeNull();
		await (await first.rendered).unmount();
		const target = document.createElement('div');
		target.style.setProperty('--column-manager-width', '300px');
		document.body.append(target);
		render(ColumnManager, { target, props: { columns, open: true } });
		await expect.element(page.getByRole('dialog')).toBeVisible();
		expect(document.querySelector('.aurora-drawer-panel')!.getBoundingClientRect().width).toBe(300);
	});

	test('v4 bug: unsaved changes stayed when the drawer was opened again', async () => {
		const { open, state } = openManager();
		await userEvent.click(page.getByRole('button', { name: 'Add Stock' }));
		await userEvent.click(page.getByRole('button', { name: 'Close' }));
		await expect.poll(() => open.value).toBe(false);
		open.value = true;
		await expect.element(page.getByRole('button', { name: 'Add Stock' })).toBeVisible();
		expect(visibleNames()).toEqual(['Code', 'Name', 'Price']);
		expect(state.value).toBeUndefined();
	});

	test('v4 bug: the columns passed in were changed', async () => {
		const original = structuredClone(columns.map(({ key, hidden, pinned }) => ({ key, hidden, pinned })));
		openManager();
		await userEvent.click(page.getByRole('button', { name: 'Add Stock' }));
		await userEvent.click(page.getByRole('button', { name: 'Pin Price' }));
		await userEvent.click(page.getByRole('button', { name: 'Hide Code' }));
		expect(columns.map(({ key, hidden, pinned }) => ({ key, hidden, pinned }))).toEqual(original);
	});

	test('v4 bug: switches and icons had no accessible name', async () => {
		openManager();
		await expect.element(page.getByRole('list', { name: 'Visible' })).toBeVisible();
		for (const button of document.querySelectorAll('dialog button')) {
			expect(button.getAttribute('aria-label') || button.textContent?.trim()).toBeTruthy();
		}
		await expect.element(page.getByRole('heading', { name: 'Visible', level: 3 })).toBeVisible();
		await expect.element(page.getByRole('heading', { name: 'Available', level: 3 })).toBeVisible();
	});
});
