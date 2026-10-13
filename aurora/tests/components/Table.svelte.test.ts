import { createRawSnippet, type Component } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TableComponent from '#lib/components/simple/tables/Table.svelte';
import type { TableColumn, TableColumnState, TableSort } from '#lib/utils/table/types.js';
import { renderWithDefaultLocale, snippet, tooltipText } from '../helpers.js';

type Product = { id: number; name: string; stock: number | null; price: number; added?: unknown; active?: boolean };

const Table = TableComponent as Component<any>;

const products: Product[] = [
	{ id: 1, name: 'Shampoo', stock: 42, price: 14.9, added: new Date(2026, 8, 3), active: true },
	{ id: 2, name: 'Mask', stock: 4, price: 22.5, added: '2026-09-01T10:30:00', active: false },
	{ id: 3, name: 'Argan oil', stock: null, price: 18, added: null }
];

const columns: TableColumn<Product>[] = [
	{ key: 'name', label: 'Product', sortable: true },
	{ key: 'stock', label: 'Stock', type: 'number', sortable: true },
	{ key: 'price', label: 'Price', type: 'number', numberFormat: { style: 'currency', currency: 'EUR' } }
];

function valueSnippet(tag: string) {
	return createRawSnippet((params: () => { value: unknown }) => ({
		render: () => `<${tag}>${String(params().value)}</${tag}>`
	}));
}

function rowSnippet(markup: (row: Product) => string) {
	return createRawSnippet((params: () => { row: Product }) => ({ render: () => markup(params().row) }));
}

function bodyRows(root: Element) {
	return [...root.querySelectorAll('tbody tr.aurora-table-row')];
}

function texts(root: Element) {
	return bodyRows(root).map((row) =>
		[...row.querySelectorAll('.aurora-table-cell')].map((cell) => cell.textContent?.trim())
	);
}

function headerTexts(root: Element) {
	return [...root.querySelectorAll('thead th')].map((cell) => cell.textContent?.trim());
}

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

function narrow(width = 400) {
	const host = document.createElement('div');
	host.style.width = `${width}px`;
	document.body.append(host);
	return host;
}

describe('Table', () => {
	test('renders a table with column headers, formatted cells and an accessible name', async () => {
		const screen = await render(Table, { rows: products, columns, caption: 'Products' });
		const table = screen.getByRole('table', { name: 'Products' });
		await expect.element(table).toBeInTheDocument();
		expect(headerTexts(table.element())).toEqual(['Product', 'Stock', 'Price']);
		for (const header of table.element().querySelectorAll('thead th')) expect(header.getAttribute('scope')).toBe('col');
		expect(texts(table.element())).toEqual([
			['Shampoo', '42', '€14.90'],
			['Mask', '4', '€22.50'],
			['Argan oil', '—', '€18.00']
		]);
		const price = table.element().querySelector('tbody td[data-type="number"]')!;
		expect(price.getAttribute('data-align')).toBe('end');
	});

	test('formats dates, date-times and booleans in the language of locale', async () => {
		const screen = await render(Table, {
			locale: 'it',
			rows: products,
			columns: [
				{ key: 'added', label: 'Added', type: 'date' },
				{ key: 'addedAt', label: 'Added at', type: 'datetime', value: (row: Product) => row.added },
				{ key: 'active', label: 'Active', type: 'boolean' }
			] as TableColumn<Product>[]
		});
		const root = screen.container;
		const cells = bodyRows(root).map((row) => [...row.querySelectorAll('.aurora-table-cell')]);
		expect(cells[0][0].textContent?.trim()).toBe('03/09/2026');
		expect(cells[1][0].textContent?.trim()).toBe('01/09/2026');
		expect(cells[1][1].textContent?.trim()).toBe('01/09/2026, 10:30');
		expect(cells[2][0].textContent?.trim()).toBe('—');
		expect(cells[0][2].querySelector('svg[role="img"]')?.textContent).toBe('Sì');
		expect(cells[1][2].textContent?.trim()).toBe('No');
		expect(cells[1][2].querySelector('.aurora-table-visually-hidden')).not.toBeNull();
	});

	test('shows empty values with the empty text of the column, else of the table', async () => {
		const screen = await render(Table, {
			rows: products,
			empty: 'n/a',
			columns: [
				{ key: 'stock', label: 'Stock' },
				{ key: 'added', label: 'Added', empty: 'Never' }
			] as TableColumn<Product>[]
		});
		const last = bodyRows(screen.container)[2];
		expect([...last.querySelectorAll('.aurora-table-cell')].map((cell) => cell.textContent?.trim())).toEqual([
			'n/a',
			'Never'
		]);
		expect(last.querySelector('.aurora-table-empty')).not.toBeNull();
	});

	test('v4 bug: an empty date cell no longer crashes the table', async () => {
		const screen = await render(Table, {
			rows: [{ id: 1, name: 'A', stock: 1, price: 1, added: undefined }],
			columns: [{ key: 'added', label: 'Added', type: 'date' }] as TableColumn<Product>[]
		});
		expect(texts(screen.container)).toEqual([['—']]);
	});

	test('format(), a cell snippet and the cellSnippet of custom columns draw the cells', async () => {
		const screen = await render(Table, {
			rows: products.slice(0, 1),
			columns: [
				{ key: 'name', label: 'Product', format: (value: string, row: Product) => `${value} #${row.id}` },
				{ key: 'stock', label: 'Stock', cell: valueSnippet('b') },
				{ key: 'price', label: 'Price', type: 'custom' }
			] as TableColumn<Product>[],
			cellSnippet: valueSnippet('i')
		});
		const cells = bodyRows(screen.container)[0].querySelectorAll('.aurora-table-cell');
		expect(cells[0].textContent?.trim()).toBe('Shampoo #1');
		expect(cells[1].querySelector('b')?.textContent).toBe('42');
		expect(cells[2].querySelector('i')?.textContent).toBe('14.9');
	});

	test('a header snippet replaces the label and info adds a tooltip button', async () => {
		const screen = await render(Table, {
			rows: products,
			columns: [
				{ key: 'name', label: 'Product', header: snippet('<em>Item</em>') },
				{ key: 'stock', label: 'Stock', info: 'Units in the warehouse' }
			] as TableColumn<Product>[]
		});
		expect(screen.container.querySelector('thead em')?.textContent).toBe('Item');
		const info = screen.getByRole('button', { name: 'About Stock' });
		await expect.element(info).toBeInTheDocument();
		await expect.poll(() => tooltipText(info.element())).toBe('Units in the warehouse');
	});

	test('forwards native attributes to the root and the class parts to their elements', async () => {
		const screen = await render(Table, {
			rows: products,
			columns,
			id: 'products',
			'data-testid': 'table',
			class: { container: 'app-root', table: 'app-table', header: 'app-header', row: 'app-row', cell: 'app-cell' },
			rowClass: (row: Product) => (row.stock === null ? 'app-out' : undefined)
		});
		const root = screen.getByTestId('table').element();
		expect(root.id).toBe('products');
		expect(root.classList.contains('app-root')).toBe(true);
		expect(root.querySelector('table')?.classList.contains('app-table')).toBe(true);
		expect(root.querySelectorAll('th.app-header')).toHaveLength(3);
		expect(root.querySelectorAll('tr.app-row')).toHaveLength(3);
		expect(root.querySelectorAll('td.app-cell')).toHaveLength(9);
		expect(bodyRows(root).map((row) => row.classList.contains('app-out'))).toEqual([false, false, true]);
	});

	test('sortable headers sort the rows ascending, descending, then unsorted, with aria-sort', async () => {
		const sort = bound<TableSort>();
		const onsortchange = vi.fn();
		const screen = await render(Table, {
			rows: products,
			columns,
			get sort() {
				return sort.value;
			},
			set sort(value) {
				sort.value = value;
			},
			onsortchange
		});
		const button = screen.getByRole('button', { name: 'Stock' });
		const header = button.element().closest('th')!;
		const first = () => texts(screen.container).map((row) => row[0]);
		expect(screen.container.querySelectorAll('thead button')).toHaveLength(2);

		await button.click();
		expect(first()).toEqual(['Mask', 'Shampoo', 'Argan oil']);
		expect(header.getAttribute('aria-sort')).toBe('ascending');
		expect(header.getAttribute('data-sorted')).toBe('asc');
		expect(sort.value).toEqual({ key: 'stock', direction: 'asc' });
		expect(onsortchange).toHaveBeenLastCalledWith({ sort: { key: 'stock', direction: 'asc' } });

		await button.click();
		expect(first()).toEqual(['Shampoo', 'Mask', 'Argan oil']);
		expect(header.getAttribute('aria-sort')).toBe('descending');

		await button.click();
		expect(first()).toEqual(['Shampoo', 'Mask', 'Argan oil']);
		expect(header.hasAttribute('aria-sort')).toBe(false);
		expect(sort.value).toBeUndefined();
		expect(onsortchange).toHaveBeenLastCalledWith({ sort: undefined });
	});

	test('v4 bug: a sortable header now sorts the rows, not only the arrow', async () => {
		const screen = await render(Table, { rows: products, columns, sort: { key: 'name', direction: 'asc' } });
		expect(texts(screen.container).map((row) => row[0])).toEqual(['Argan oil', 'Mask', 'Shampoo']);
	});

	test('with sorting="manual" the rows keep the order of the app', async () => {
		const onsortchange = vi.fn();
		const screen = await render(Table, { rows: products, columns, sorting: 'manual', onsortchange });
		await screen.getByRole('button', { name: 'Product' }).click();
		expect(onsortchange).toHaveBeenCalledWith({ sort: { key: 'name', direction: 'asc' } });
		expect(texts(screen.container).map((row) => row[0])).toEqual(['Shampoo', 'Mask', 'Argan oil']);
	});

	test('the sort button is reached with the keyboard and sorts on Enter', async () => {
		const screen = await render(Table, { rows: products, columns });
		await userEvent.keyboard('{Tab}');
		await expect.element(screen.getByRole('button', { name: 'Product' })).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		expect(texts(screen.container)[0][0]).toBe('Argan oil');
	});

	test('v4 bug: rows and headers are not focusable unless they do something', async () => {
		const screen = await render(Table, { rows: products, columns: columns.map((column) => ({ ...column, sortable: false })) });
		expect(screen.container.querySelectorAll('[tabindex]')).toHaveLength(0);
	});

	test('multiple selection: checkboxes with names, bind:selected and onselectionchange', async () => {
		const selected = bound<Product[]>([]);
		const onselectionchange = vi.fn();
		const screen = await render(Table, {
			rows: products,
			columns,
			selectable: 'multiple',
			get selected() {
				return selected.value;
			},
			set selected(value) {
				selected.value = value;
			},
			onselectionchange
		});
		const all = screen.getByRole('checkbox', { name: 'Select all rows' });
		await screen.getByRole('checkbox', { name: 'Select Mask' }).click();
		expect(selected.value?.map((row) => row.id)).toEqual([2]);
		expect(onselectionchange).toHaveBeenLastCalledWith({ selected: [products[1]], selectedAll: false, excluded: [] });
		expect(bodyRows(screen.container).map((row) => row.hasAttribute('data-selected'))).toEqual([false, true, false]);
		await expect.element(all).toBePartiallyChecked();

		await all.click();
		expect(selected.value?.map((row) => row.id).sort()).toEqual([1, 2, 3]);
		await expect.element(all).toBeChecked();

		await all.click();
		expect(selected.value).toEqual([]);
		await expect.element(all).not.toBeChecked();
	});

	test('shift-click selects the range from the last clicked row', async () => {
		const selected = bound<Product[]>([]);
		const rows = [...products, { id: 4, name: 'Comb', stock: 9, price: 3 }];
		const screen = await render(Table, {
			rows,
			columns,
			selectable: 'multiple',
			get selected() {
				return selected.value;
			},
			set selected(value) {
				selected.value = value;
			}
		});
		await screen.getByRole('checkbox', { name: 'Select Mask' }).click();
		await userEvent.keyboard('{Shift>}');
		await screen.getByRole('checkbox', { name: 'Select Comb' }).click();
		await userEvent.keyboard('{/Shift}');
		expect(selected.value?.map((row) => row.id)).toEqual([2, 3, 4]);
		await userEvent.keyboard('{Shift>}');
		await screen.getByRole('checkbox', { name: 'Select Shampoo' }).click();
		await userEvent.keyboard('{/Shift}');
		expect(selected.value?.map((row) => row.id).sort()).toEqual([1, 2, 3, 4]);
	});

	test('single selection keeps at most one row and has no "select all"', async () => {
		const selected = bound<Product[]>([products[0]]);
		const screen = await render(Table, {
			rows: products,
			columns,
			selectable: 'single',
			get selected() {
				return selected.value;
			},
			set selected(value) {
				selected.value = value;
			}
		});
		expect(screen.container.querySelector('thead input')).toBeNull();
		await screen.getByRole('checkbox', { name: 'Select Argan oil' }).click();
		expect(selected.value).toEqual([products[2]]);
		await screen.getByRole('checkbox', { name: 'Select Argan oil' }).click();
		expect(selected.value).toEqual([]);
	});

	test('selectedAll marks every row except the excluded ones, and unchecking a row excludes it', async () => {
		const excluded = bound<Product[]>([products[1]]);
		const onselectionchange = vi.fn();
		const screen = await render(Table, {
			rows: products,
			columns,
			selectable: 'multiple',
			selectedAll: true,
			get excluded() {
				return excluded.value;
			},
			set excluded(value) {
				excluded.value = value;
			},
			onselectionchange
		});
		expect(bodyRows(screen.container).map((row) => row.hasAttribute('data-selected'))).toEqual([true, false, true]);
		await screen.getByRole('checkbox', { name: 'Select Shampoo' }).click();
		expect(excluded.value?.map((row) => row.id)).toEqual([2, 1]);
		expect(onselectionchange).toHaveBeenLastCalledWith({ selected: [], selectedAll: true, excluded: [products[1], products[0]] });
		await screen.getByRole('checkbox', { name: 'Select all rows' }).click();
		expect(excluded.value).toEqual([]);
		await screen.getByRole('checkbox', { name: 'Select all rows' }).click();
		expect(onselectionchange).toHaveBeenLastCalledWith({ selected: [], selectedAll: false, excluded: [] });
	});

	test('expandable rows: a toggle per row, the detail row, bind:expanded and expandable()', async () => {
		const expanded = bound<(string | number)[]>([]);
		const onexpandedchange = vi.fn();
		const screen = await render(Table, {
			rows: products,
			columns,
			expandedSnippet: rowSnippet((row) => `<p>Notes of ${row.name}</p>`),
			expandable: (row: Product) => row.id !== 3,
			get expanded() {
				return expanded.value;
			},
			set expanded(value) {
				expanded.value = value;
			},
			onexpandedchange
		});
		const toggles = screen.getByRole('button', { name: 'Show details' });
		expect(toggles.elements()).toHaveLength(2);
		await toggles.nth(1).click();
		expect(expanded.value).toEqual([2]);
		expect(onexpandedchange).toHaveBeenCalledWith({ expanded: [2] });
		const toggle = screen.getByRole('button', { name: 'Hide details' });
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
		const detail = document.getElementById(toggle.element().getAttribute('aria-controls')!)!;
		expect(detail.textContent?.trim()).toBe('Notes of Mask');
		expect(detail.getAttribute('colspan')).toBe('4');
		await toggle.click();
		expect(expanded.value).toEqual([]);
		expect(screen.container.querySelector('.aurora-table-detail-row')).toBeNull();
	});

	test('rowHref: a real link in the first cell and a click on the row follows it', async () => {
		const screen = await render(Table, {
			rows: products,
			columns,
			rowHref: (row: Product) => `#product-${row.id}`
		});
		const link = screen.getByRole('link', { name: 'Mask' });
		await expect.element(link).toHaveAttribute('href', '#product-2');
		expect(link.element().closest('td')?.classList.contains('aurora-table-cell')).toBe(true);
		bodyRows(screen.container)[2].querySelectorAll('td')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await expect.poll(() => location.hash).toBe('#product-3');
		history.replaceState(null, '', location.pathname + location.search);
	});

	test('rowHref: Ctrl-click and middle click open the row in a new tab', async () => {
		const open = vi.spyOn(window, 'open').mockReturnValue(null);
		const screen = await render(Table, { rows: products, columns, rowHref: (row: Product) => `/products/${row.id}` });
		const cell = bodyRows(screen.container)[0].querySelectorAll('td')[1];
		cell.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
		expect(open).toHaveBeenLastCalledWith('/products/1', '_blank', 'noopener');
		cell.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 1 }));
		expect(open).toHaveBeenCalledTimes(2);
		open.mockRestore();
	});

	test('onrowclick: rows are focusable, react to click, Enter and Space, not to their buttons', async () => {
		const onrowclick = vi.fn();
		const onaction = vi.fn();
		const screen = await render(Table, {
			rows: products,
			columns,
			onrowclick,
			actionsSnippet: rowSnippet((row) => `<button type="button">Edit ${row.name}</button>`)
		});
		const rows = bodyRows(screen.container) as HTMLElement[];
		expect(rows.map((row) => row.getAttribute('tabindex'))).toEqual(['0', '0', '0']);
		rows[0].querySelectorAll('td')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onrowclick).toHaveBeenLastCalledWith(products[0], expect.any(MouseEvent));
		rows[1].focus();
		await userEvent.keyboard('{Enter}');
		expect(onrowclick).toHaveBeenLastCalledWith(products[1], expect.any(KeyboardEvent));
		await userEvent.keyboard(' ');
		expect(onrowclick).toHaveBeenCalledTimes(3);
		const edit = screen.getByRole('button', { name: 'Edit Mask' });
		edit.element().addEventListener('click', onaction);
		await edit.click();
		expect(onaction).toHaveBeenCalledOnce();
		expect(onrowclick).toHaveBeenCalledTimes(3);
	});

	test('onrowclick can stop the navigation of rowHref with preventDefault', async () => {
		const screen = await render(Table, {
			rows: products,
			columns,
			rowHref: (row: Product) => `#stopped-${row.id}`,
			onrowclick: (_row: Product, event: MouseEvent | KeyboardEvent) => event.preventDefault()
		});
		bodyRows(screen.container)[0].querySelectorAll('td')[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(location.hash).not.toBe('#stopped-1');
	});

	test('the actions column has a hidden header and shows the buttons of each row', async () => {
		const screen = await render(Table, {
			rows: products,
			columns,
			actionsSnippet: rowSnippet((row) => `<button type="button">Edit ${row.name}</button>`)
		});
		const header = screen.container.querySelector('thead th.aurora-table-actions')!;
		expect(header.textContent?.trim()).toBe('Actions');
		await expect.element(screen.getByRole('button', { name: 'Edit Argan oil' })).toBeInTheDocument();
		expect(bodyRows(screen.container)[0].lastElementChild?.classList.contains('aurora-table-actions')).toBe(true);
	});

	test('actions are always visible by default, only on hover or focus with actionsVisibility="hover"', async () => {
		const actionsSnippet = rowSnippet((row) => `<button type="button">Edit ${row.name}</button>`);
		const screen = await render(Table, { rows: products, columns, actionsSnippet });
		const root = screen.container.querySelector('.aurora-table')!;
		const opacity = (index: number) =>
			getComputedStyle(root.querySelectorAll('.aurora-table-actions-content')[index]).opacity;
		expect(root.getAttribute('data-actions-visibility')).toBe('always');
		expect(opacity(1)).toBe('1');
		await userEvent.hover(screen.container.querySelector('thead th')!);
		await screen.rerender({ rows: products, columns, actionsSnippet, actionsVisibility: 'hover' });
		expect(root.getAttribute('data-actions-visibility')).toBe('hover');
		await expect.poll(() => opacity(1)).toBe('0');
		await userEvent.hover(bodyRows(root)[1]);
		await expect.poll(() => opacity(1)).toBe('1');
		await userEvent.hover(screen.container.querySelector('thead th')!);
		await expect.poll(() => opacity(1)).toBe('0');
		(root.querySelectorAll('.aurora-table-actions-content button')[1] as HTMLElement).focus();
		await expect.poll(() => opacity(1)).toBe('1');
	});

	test('v4 bug: pinned columns are moved first, wherever they are declared', async () => {
		const screen = await render(Table, {
			rows: products,
			columns: [...columns.slice(0, 2), { ...columns[2], pinned: true }],
			selectable: 'multiple'
		});
		const headers = [...screen.container.querySelectorAll('thead th')];
		expect(headers.map((cell) => cell.textContent?.trim())).toEqual(['', 'Price', 'Product', 'Stock']);
		expect(headers.map((cell) => cell.hasAttribute('data-pinned'))).toEqual([true, true, false, false]);
		await expect.poll(() => (headers[1] as HTMLElement).style.insetInlineStart).toBe(`${headers[0].getBoundingClientRect().width}px`);
	});

	test('columnState sets order, visibility and widths; hidden columns start hidden', async () => {
		const screen = await render(Table, {
			rows: products,
			columns: [...columns, { key: 'added', label: 'Added', hidden: true }],
			columnState: [
				{ key: 'price', visible: true, width: 150 },
				{ key: 'name', visible: false }
			]
		});
		expect(headerTexts(screen.container)).toEqual(['Price', 'Stock', '']);
		const table = screen.container.querySelector('table')!;
		expect(table.hasAttribute('data-fixed')).toBe(true);
		expect((table.querySelector('col') as HTMLElement).style.width).toBe('150px');
		expect(table.querySelector('th.aurora-table-filler')?.getAttribute('aria-hidden')).toBe('true');
	});

	test('resizable columns: the separator changes the width with the arrow keys and saves it', async () => {
		const state = bound<TableColumnState[]>();
		const oncolumnstatechange = vi.fn();
		const screen = await render(Table, {
			rows: products,
			columns: [{ ...columns[0], resizable: false }, columns[1], { ...columns[2], minWidth: '120px' }],
			resizable: true,
			get columnState() {
				return state.value;
			},
			set columnState(value) {
				state.value = value;
			},
			oncolumnstatechange
		});
		expect(screen.container.querySelectorAll('[role="separator"]')).toHaveLength(2);
		const separator = screen.getByRole('separator', { name: 'Resize Stock' });
		await expect.element(separator).toHaveAttribute('aria-orientation', 'vertical');
		const before = screen.container.querySelectorAll('thead th')[1].getBoundingClientRect().width;
		(separator.element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowRight}');
		const stock = state.value?.find((entry) => entry.key === 'stock');
		expect(stock?.width).toBe(Math.round(before + 10));
		expect(state.value?.every((entry) => typeof entry.width === 'number')).toBe(true);
		expect(oncolumnstatechange).toHaveBeenCalledOnce();
		await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
		expect(state.value?.find((entry) => entry.key === 'stock')?.width).toBe(Math.round(before - 40));
		const price = screen.getByRole('separator', { name: 'Resize Price' });
		(price.element() as HTMLElement).focus();
		for (let step = 0; step < 20; step++) await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
		expect(state.value?.find((entry) => entry.key === 'price')?.width).toBe(120);
	});

	test('v4 bug: a click elsewhere in the page does not report a column resize', async () => {
		const oncolumnstatechange = vi.fn();
		const screen = await render(Table, { rows: products, columns, resizable: true, oncolumnstatechange });
		await screen.getByRole('button', { name: 'Product' }).click();
		document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
		document.body.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
		expect(oncolumnstatechange).not.toHaveBeenCalled();
	});

	test('columnsKey saves the column state in the browser and restores it', async () => {
		localStorage.setItem('table-test', JSON.stringify([{ key: 'price', visible: true }, { key: 'name', visible: false }]));
		const first = await render(Table, { rows: products, columns, columnsKey: 'table-test', resizable: true });
		await expect.poll(() => headerTexts(first.container)).toEqual(['Price', 'Stock']);
		(first.getByRole('separator', { name: 'Resize Stock' }).element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowRight}');
		const saved = JSON.parse(localStorage.getItem('table-test')!);
		expect(saved.map((entry: TableColumnState) => entry.key)).toEqual(['price', 'name', 'stock']);
		expect(typeof saved[2].width).toBe('number');
		localStorage.setItem('table-test', '{broken');
		const second = await render(Table, { rows: products, columns, columnsKey: 'table-test' });
		expect(headerTexts(second.container).slice(-3)).toEqual(['Product', 'Stock', 'Price']);
		localStorage.removeItem('table-test');
	});

	test('loading with rows: aria-busy and a progress bar; without rows: placeholder rows', async () => {
		const screen = await render(Table, { rows: products, columns, loading: true });
		const table = screen.container.querySelector('table')!;
		expect(table.getAttribute('aria-busy')).toBe('true');
		expect(screen.container.querySelector('.aurora-table')?.hasAttribute('data-loading')).toBe(true);
		expect(table.querySelector('.aurora-table-progress-row')?.getAttribute('aria-hidden')).toBe('true');
		await screen.rerender({ rows: [], columns, loading: true, loadingRows: 3 });
		expect(table.querySelectorAll('.aurora-table-skeleton-row')).toHaveLength(3);
		expect(table.querySelector('.aurora-table-no-data-row')).toBeNull();
	});

	test('without rows it shows NoData with noDataTitle, or noDataSnippet', async () => {
		const screen = await render(Table, { rows: [], columns, noDataTitle: 'No products yet', selectable: 'multiple' });
		const cell = screen.container.querySelector('.aurora-table-no-data-row td')!;
		expect(cell.getAttribute('colspan')).toBe('4');
		expect(cell.textContent).toContain('No products yet');
		await expect.element(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeDisabled();
		await screen.rerender({ rows: [], columns, noDataSnippet: snippet('<p>Add a product</p>') });
		expect(screen.container.querySelector('.aurora-table-no-data-row p')?.textContent).toBe('Add a product');
	});

	test('footer: a text or a snippet that receives every row', async () => {
		const total = createRawSnippet((params: () => { rows: Product[] }) => ({
			render: () => `<strong>${params().rows.reduce((sum, row) => sum + (row.stock ?? 0), 0)}</strong>`
		}));
		const screen = await render(Table, {
			rows: products,
			columns: [{ ...columns[0], footer: 'Total' }, { ...columns[1], footer: total }, columns[2]]
		});
		const cells = [...screen.container.querySelectorAll('tfoot td')].map((cell) => cell.textContent?.trim());
		expect(cells).toEqual(['Total', '46', '']);
	});

	test('narrower than cardBreakpoint the rows become cards with fields, selection and actions', async () => {
		const host = narrow();
		const selected = bound<Product[]>([]);
		const screen = await render(Table, {
			target: host,
			props: {
				rows: products,
				columns,
				selectable: 'multiple',
				get selected() {
					return selected.value;
				},
				set selected(value) {
					selected.value = value;
				},
				actionsSnippet: rowSnippet((row) => `<button type="button">Edit ${row.name}</button>`)
			}
		});
		const root = host.querySelector('.aurora-table')!;
		await expect.poll(() => root.hasAttribute('data-cards')).toBe(true);
		expect(root.querySelector('table')).toBeNull();
		const cards = [...root.querySelectorAll('.aurora-table-card')];
		expect(cards.map((card) => card.querySelector('.aurora-table-card-title')?.textContent?.trim())).toEqual([
			'Shampoo',
			'Mask',
			'Argan oil'
		]);
		const fields = [...cards[2].querySelectorAll('.aurora-table-card-field')].map((field) => [
			field.querySelector('dt')?.textContent?.trim(),
			field.querySelector('dd')?.textContent?.trim()
		]);
		expect(fields).toEqual([
			['Stock', '—'],
			['Price', '€18.00']
		]);
		await expect.element(screen.getByRole('button', { name: 'Edit Mask' })).toBeInTheDocument();
		await screen.getByRole('checkbox', { name: 'Select all' }).click();
		expect(selected.value).toHaveLength(3);
		host.remove();
	});

	test('in cards the sorting is a select, and cardTitle picks the title column', async () => {
		const host = narrow();
		const screen = await render(Table, { target: host, props: { rows: products, columns, cardTitle: 'price' } });
		await expect.poll(() => host.querySelector('[data-cards]')).not.toBeNull();
		expect(host.querySelector('.aurora-table-card-title')?.textContent?.trim()).toBe('€14.90');
		const select = screen.getByRole('combobox', { name: 'Sort by' });
		await select.selectOptions('Product, descending');
		expect([...host.querySelectorAll('.aurora-table-card-title')].map((title) => title.textContent?.trim())).toEqual([
			'€14.90',
			'€22.50',
			'€18.00'
		]);
		expect([...host.querySelectorAll('.aurora-table-card dd')].filter((_, index) => index % 2 === 0).map((dd) => dd.textContent?.trim())).toEqual([
			'Shampoo',
			'Mask',
			'Argan oil'
		]);
		host.remove();
	});

	test('cards with many columns show cardColumns and the others behind "Show more fields"', async () => {
		const host = narrow();
		const wide: TableColumn<Product>[] = [
			...columns,
			{ key: 'added', label: 'Added', type: 'date' },
			{ key: 'active', label: 'Active', type: 'boolean' },
			{ key: 'code', label: 'Code', value: (row: Product) => `P-${row.id}` },
			{ key: 'note', label: 'Note' }
		];
		const fieldLabels = (card: Element) => [...card.querySelectorAll('dt')].map((dt) => dt.textContent?.trim());
		const screen = await render(Table, { target: host, props: { rows: products, columns: wide } });
		await expect.poll(() => host.querySelector('[data-cards]')).not.toBeNull();
		const card = () => host.querySelectorAll('.aurora-table-card')[1];
		expect(fieldLabels(card())).toEqual(['Stock', 'Price', 'Added', 'Active']);
		const more = screen.getByRole('button', { name: 'Show 2 more fields' }).nth(1);
		await expect.element(more).toHaveAttribute('aria-expanded', 'false');
		await more.click();
		expect(fieldLabels(card())).toEqual(['Stock', 'Price', 'Added', 'Active', 'Code', 'Note']);
		const fewer = screen.getByRole('button', { name: 'Show fewer fields' });
		await expect.element(fewer).toHaveAttribute('aria-expanded', 'true');
		expect(document.getElementById(fewer.element().getAttribute('aria-controls')!)?.textContent).toContain('P-2');
		expect(fieldLabels(host.querySelectorAll('.aurora-table-card')[0])).toHaveLength(4);
		const active = [...card().querySelectorAll('.aurora-table-card-field')].find((field) => field.textContent?.includes('Active'))!;
		expect(active.querySelector('dd .aurora-table-empty')?.textContent).toBe('No');
		await fewer.click();
		expect(fieldLabels(card())).toHaveLength(4);
		await screen.rerender({ rows: products, columns: wide, cardColumns: ['note', 'price'], locale: 'it' });
		expect(fieldLabels(card())).toEqual(['Price', 'Note']);
		await expect.element(screen.getByRole('button', { name: 'Mostra altri 4 campi' }).first()).toBeInTheDocument();
		await screen.rerender({ rows: products, columns: wide.slice(0, 6), cardColumns: undefined });
		expect(fieldLabels(card())).toEqual(['Stock', 'Price', 'Added', 'Active', 'Code']);
		expect(host.querySelector('.aurora-table-card-more')).toBeNull();
		host.remove();
	});

	test('cardBreakpoint={false} keeps the table on a narrow width', async () => {
		const host = narrow(300);
		await render(Table, { target: host, props: { rows: products, columns, cardBreakpoint: false } });
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(host.querySelector('table')).not.toBeNull();
		expect(host.querySelector('[data-cards]')).toBeNull();
		host.remove();
	});

	test('texts follow locale, setDefaultLocale and labels', async () => {
		const own = await render(Table, { rows: products, columns, selectable: 'multiple', locale: 'it', labels: { selectAll: 'Tutte' } });
		await expect.element(own.getByRole('checkbox', { name: 'Tutte' })).toBeInTheDocument();
		await expect.element(own.getByRole('checkbox', { name: 'Seleziona Mask' })).toBeInTheDocument();
		own.unmount();
		const inherited = await renderWithDefaultLocale('it', Table, { rows: products, columns, selectable: 'multiple' });
		await expect.element(inherited.getByRole('checkbox', { name: 'Seleziona tutte le righe' })).toBeInTheDocument();
		inherited.unmount();
		const wins = await renderWithDefaultLocale('it', Table, { rows: products, columns, selectable: 'multiple', locale: 'en' });
		await expect.element(wins.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
	});

	test('instance CSS variables style the header, the cells and the selected rows', async () => {
		const screen = await render(Table, {
			rows: products,
			columns,
			selectable: 'multiple',
			selected: [products[0]],
			style:
				'--table-header-background: rgb(1, 2, 3); --table-header-color: rgb(4, 5, 6); --table-cell-padding: 3px 7px; --table-row-selected-background: rgb(7, 8, 9); --table-width: 500px'
		});
		const root = screen.container.querySelector('.aurora-table') as HTMLElement;
		expect(root.getBoundingClientRect().width).toBe(500);
		const header = root.querySelector('thead th.aurora-table-header')!;
		expect(getComputedStyle(header).backgroundImage).toContain('rgb(1, 2, 3)');
		expect(getComputedStyle(header).color).toBe('rgb(4, 5, 6)');
		const cell = root.querySelector('tbody td.aurora-table-cell')!;
		expect(getComputedStyle(cell).padding).toBe('3px 7px');
		expect(getComputedStyle(cell).backgroundColor).toBe('rgb(7, 8, 9)');
	});
});
