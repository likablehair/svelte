import { type Component } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DataTableComponent from '#lib/components/composed/tables/DataTable.svelte';
import { createFilters, filterCondition, type FilterField } from '#lib/utils/filters/model.js';
import type { DataTableQuery, TableColumn } from '#lib/utils/table/types.js';
import { renderWithDefaultLocale, snippet, tooltipText } from '../helpers.js';

type Person = { id: number; name: string; age: number };

const DataTable = DataTableComponent as Component<any>;

const people: Person[] = Array.from({ length: 45 }, (_, index) => ({
	id: index + 1,
	name: `Person ${String(index + 1).padStart(2, '0')}`,
	age: 20 + (index % 30)
}));

const columns: TableColumn<Person>[] = [
	{ key: 'name', label: 'Name', sortable: true },
	{ key: 'age', label: 'Age', type: 'number', sortable: true }
];

const fields: FilterField[] = [{ name: 'age', label: 'Age', type: 'number', column: 'people.age' }];

type Request = DataTableQuery & { signal: AbortSignal };

function slice(query: { page: number; pageSize: number }, total = people.length) {
	const all = people.slice(0, total);
	return { rows: all.slice((query.page - 1) * query.pageSize, query.page * query.pageSize), total };
}

function instantLoader(total = people.length) {
	return vi.fn(async (query: Request) => slice(query, total));
}

function deferredLoader() {
	const calls: { query: Request; resolve: (value: unknown) => void; reject: (error: unknown) => void }[] = [];
	const loader = vi.fn(
		(query: Request) =>
			new Promise((resolve, reject) => {
				calls.push({ query, resolve, reject });
			})
	);
	return { loader, calls };
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

function names(root: Element) {
	return [...root.querySelectorAll('tbody tr.aurora-table-row')].map(
		(row) => row.querySelector('.aurora-table-cell')?.textContent?.trim()
	);
}

function range(root: Element) {
	return root.querySelector('.aurora-data-table-range')?.textContent?.trim();
}

function merge(...parts: object[]) {
	const result = {};
	for (const part of parts) Object.defineProperties(result, Object.getOwnPropertyDescriptors(part));
	return result;
}

const lastCall = <T,>(fn: { mock: { calls: T[][] } }) => fn.mock.calls.at(-1)![0];

describe('DataTable', () => {
	test('shows the rows it receives with the range and the pages', async () => {
		const screen = await render(DataTable, { columns, ...slice({ page: 1, pageSize: 20 }) });
		await expect.element(screen.getByRole('cell', { name: 'Person 01', exact: true })).toBeInTheDocument();
		expect(names(screen.container)).toHaveLength(20);
		expect(range(screen.container)).toBe('1–20 of 45');
		await expect.element(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
		await expect.element(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('20');
	});

	test('calls the loader on mount without rows, with the first query and a signal', async () => {
		const { loader, calls } = deferredLoader();
		const screen = await render(DataTable, { columns, loader });
		await expect.poll(() => loader.mock.calls.length).toBe(1);
		const { query } = calls[0];
		expect(query).toMatchObject({ page: 1, pageSize: 20, search: '', sort: undefined });
		expect(query.builder.toJson().modifiers).toEqual([]);
		expect(query.signal).toBeInstanceOf(AbortSignal);
		await expect.element(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
		calls[0].resolve(slice(query));
		await expect.element(screen.getByRole('cell', { name: 'Person 01', exact: true })).toBeInTheDocument();
		expect(screen.getByRole('table').element().hasAttribute('aria-busy')).toBe(false);
		expect(range(screen.container)).toBe('1–20 of 45');
	});

	test('does not load what it already has from rows', async () => {
		const loader = instantLoader();
		const screen = await render(DataTable, { columns, loader, ...slice({ page: 1, pageSize: 20 }) });
		await expect.element(screen.getByRole('cell', { name: 'Person 01', exact: true })).toBeInTheDocument();
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(loader).not.toHaveBeenCalled();
	});

	test('loads another page from the paginator and updates page', async () => {
		const loader = instantLoader();
		const pageState = bound<number>();
		const screen = await render(DataTable, {
			columns,
			loader,
			...slice({ page: 1, pageSize: 20 }),
			get page() {
				return pageState.value;
			},
			set page(value) {
				pageState.value = value;
			}
		});
		await screen.getByRole('button', { name: 'Page 2' }).click();
		await expect.element(screen.getByRole('cell', { name: 'Person 21', exact: true })).toBeInTheDocument();
		expect(lastCall(loader)).toMatchObject({ page: 2, pageSize: 20 });
		expect(pageState.value).toBe(2);
		expect(range(screen.container)).toBe('21–40 of 45');
		await screen.getByRole('button', { name: 'Page 3' }).click();
		await expect.element(screen.getByRole('cell', { name: 'Person 41', exact: true })).toBeInTheDocument();
		expect(range(screen.container)).toBe('41–45 of 45');
	});

	test('sorting asks the server, with orderBy or the sort of the column, and goes back to page 1', async () => {
		const loader = instantLoader();
		const sorted: TableColumn<Person>[] = [
			{ key: 'name', label: 'Name', sortable: true, sort: ({ builder, direction }) => builder.orderBy('people.lastName', direction) },
			{ key: 'age', label: 'Age', type: 'number', sortable: true }
		];
		const onsortchange = vi.fn();
		const screen = await render(DataTable, { columns: sorted, loader, page: 2, onsortchange, ...slice({ page: 2, pageSize: 20 }) });
		await screen.getByRole('button', { name: /^Age/ }).click();
		await expect.poll(() => loader.mock.calls.length).toBe(1);
		expect(lastCall(loader)).toMatchObject({ page: 1, sort: { key: 'age', direction: 'asc' } });
		expect(lastCall(loader).builder.toJson().modifiers).toEqual([
			{ method: 'orderBy', sortBy: 'age', sortDirection: 'asc' }
		]);
		expect(onsortchange).toHaveBeenCalledWith({ sort: { key: 'age', direction: 'asc' } });
		await screen.getByRole('button', { name: /^Name/ }).click();
		await expect.poll(() => loader.mock.calls.length).toBe(2);
		expect(lastCall(loader).builder.toJson().modifiers).toEqual([
			{ method: 'orderBy', sortBy: 'people.lastName', sortDirection: 'asc' }
		]);
	});

	test('the search reaches the query as an ilike on searchColumns, after the debounce', async () => {
		const loader = instantLoader();
		const searchState = bound<string>();
		const screen = await render(DataTable, {
			columns,
			loader,
			searchColumns: ['people.firstName', 'people.lastName'],
			...slice({ page: 1, pageSize: 20 }),
			get search() {
				return searchState.value;
			},
			set search(value) {
				searchState.value = value;
			}
		});
		await userEvent.type(screen.getByRole('searchbox', { name: 'Search…' }), 'Ann');
		expect(loader).not.toHaveBeenCalled();
		await expect.poll(() => loader.mock.calls.length).toBe(1);
		expect(searchState.value).toBe('Ann');
		const query = lastCall(loader);
		expect(query.search).toBe('Ann');
		expect((query.builder.toJson().modifiers[0] as any).children.map((child: any) => [child.key, child.value])).toEqual([
			['people.firstName', '%Ann%'],
			['people.lastName', '%Ann%']
		]);
	});

	test('searchable shows the field without searchColumns, and the text only reaches query.search', async () => {
		const onquerychange = vi.fn();
		const screen = await render(DataTable, { columns, searchable: true, onquerychange, ...slice({ page: 1, pageSize: 20 }) });
		await userEvent.type(screen.getByRole('searchbox'), 'x{Enter}');
		await expect.poll(() => onquerychange.mock.calls.length).toBe(1);
		expect(lastCall(onquerychange).search).toBe('x');
		expect(lastCall(onquerychange).builder.toJson().modifiers).toEqual([]);
	});

	test('without search, filters and toolbar buttons there is no toolbar', async () => {
		const screen = await render(DataTable, { columns, ...slice({ page: 1, pageSize: 20 }) });
		await expect.element(screen.getByRole('table')).toBeInTheDocument();
		expect(screen.container.querySelector('.aurora-data-table-toolbar')).toBeNull();
	});

	test('filters reach the builder, go back to page 1 and clear the selection', async () => {
		const loader = instantLoader();
		const filterState = bound(createFilters());
		const selectedState = bound<Person[]>([people[0]]);
		const onselectionchange = vi.fn();
		const screen = await render(DataTable, {
			columns,
			loader,
			filterFields: fields,
			selectable: 'multiple',
			page: 2,
			onselectionchange,
			...slice({ page: 2, pageSize: 20 }),
			get filterValue() {
				return filterState.value;
			},
			set filterValue(value) {
				filterState.value = value;
			},
			get selected() {
				return selectedState.value;
			},
			set selected(value) {
				selectedState.value = value;
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
		filterState.value = createFilters([filterCondition('age', 'gt', 30)]);
		await expect.poll(() => loader.mock.calls.length).toBe(1);
		const query = lastCall(loader);
		expect(query.page).toBe(1);
		expect(JSON.stringify(query.builder.toJson())).toContain('people.age');
		expect(query.filterValue.items).toHaveLength(1);
		expect(selectedState.value).toEqual([]);
		expect(onselectionchange).toHaveBeenCalledWith({ selected: [], selectedAll: false, excluded: [] });
	});

	test('an incomplete condition does not make a new query', async () => {
		const onquerychange = vi.fn();
		const filterState = bound(createFilters());
		render(DataTable, {
			columns,
			filterFields: fields,
			onquerychange,
			...slice({ page: 1, pageSize: 20 }),
			get filterValue() {
				return filterState.value;
			},
			set filterValue(value) {
				filterState.value = value;
			}
		});
		filterState.value = createFilters([filterCondition('age', 'gt', undefined)]);
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(onquerychange).not.toHaveBeenCalled();
	});

	test('changing the page size goes back to page 1', async () => {
		const loader = instantLoader();
		const sizeState = bound<number>();
		const screen = await render(DataTable, {
			columns,
			loader,
			page: 2,
			...slice({ page: 2, pageSize: 20 }),
			get pageSize() {
				return sizeState.value;
			},
			set pageSize(value) {
				sizeState.value = value;
			}
		});
		await screen.getByRole('combobox', { name: 'Rows per page' }).selectOptions('50');
		await expect.poll(() => loader.mock.calls.length).toBe(1);
		expect(sizeState.value).toBe(50);
		expect(lastCall(loader)).toMatchObject({ page: 1, pageSize: 50 });
		await expect.element(screen.getByRole('cell', { name: 'Person 45', exact: true })).toBeInTheDocument();
	});

	test('pageSizes sets the choices and hides the selector with one', async () => {
		const screen = await render(DataTable, { columns, pageSize: 10, pageSizes: [10, 25], ...slice({ page: 1, pageSize: 10 }) });
		const select = screen.getByRole('combobox', { name: 'Rows per page' }).element() as HTMLSelectElement;
		expect([...select.options].map((option) => option.value)).toEqual(['10', '25']);
		screen.unmount();
		const single = await render(DataTable, { columns, pageSize: 10, pageSizes: [10], ...slice({ page: 1, pageSize: 10 }) });
		await expect.element(single.getByRole('table')).toBeInTheDocument();
		expect(single.container.querySelector('select')).toBeNull();
	});

	test('a newer query aborts the older one and its answer is ignored', async () => {
		const { loader, calls } = deferredLoader();
		const screen = await render(DataTable, { columns, loader, ...slice({ page: 1, pageSize: 20 }) });
		await screen.getByRole('button', { name: 'Page 2' }).click();
		await screen.getByRole('button', { name: 'Page 3' }).click();
		await expect.poll(() => calls.length).toBe(2);
		expect(calls[0].query.signal.aborted).toBe(true);
		calls[1].resolve(slice(calls[1].query));
		await expect.element(screen.getByRole('cell', { name: 'Person 41', exact: true })).toBeInTheDocument();
		calls[0].resolve(slice(calls[0].query));
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(names(screen.container)[0]).toBe('Person 41');
	});

	test('a failed first load shows the error with Retry and calls onerror', async () => {
		let fail = true;
		const onerror = vi.fn();
		const loader = vi.fn(async (query: Request) => {
			if (fail) throw new Error('down');
			return slice(query);
		});
		const screen = await render(DataTable, { columns, loader, onerror });
		await expect.element(screen.getByText("Couldn't load the rows")).toBeInTheDocument();
		expect(onerror).toHaveBeenCalledWith(new Error('down'));
		expect(screen.container.querySelector('.aurora-data-table-footer')).toBeNull();
		fail = false;
		await screen.getByRole('button', { name: 'Retry' }).click();
		await expect.element(screen.getByRole('cell', { name: 'Person 01', exact: true })).toBeInTheDocument();
		expect(screen.container.querySelector('[data-error]')).toBeNull();
	});

	test('a failed page change keeps the rows and shows the error under them', async () => {
		const loader = vi.fn(async () => {
			throw new Error('down');
		});
		const screen = await render(DataTable, { columns, loader, ...slice({ page: 1, pageSize: 20 }) });
		await screen.getByRole('button', { name: 'Page 2' }).click();
		await expect.element(screen.getByRole('alert')).toHaveTextContent("Couldn't load the rows");
		expect(names(screen.container)[0]).toBe('Person 01');
	});

	test('errorSnippet replaces the error', async () => {
		const loader = vi.fn(async () => {
			throw new Error('down');
		});
		const screen = await render(DataTable, { columns, loader, errorSnippet: snippet('<b>Offline</b>') });
		await expect.element(screen.getByText('Offline')).toBeInTheDocument();
	});

	test('a page past the end after a load goes to the last page', async () => {
		const loader = vi.fn(async (query: Request) => slice(query, 25));
		const pageState = bound<number>(3);
		const screen = await render(DataTable, {
			columns,
			loader,
			get page() {
				return pageState.value;
			},
			set page(value) {
				pageState.value = value;
			}
		});
		await expect.element(screen.getByRole('cell', { name: 'Person 21', exact: true })).toBeInTheDocument();
		expect(pageState.value).toBe(2);
		expect(loader.mock.calls.map(([query]) => query.page)).toEqual([3, 2]);
	});

	test('reload() runs the loader again with the same query', async () => {
		const loader = instantLoader();
		const screen = await render(DataTable, { columns, loader, page: 2, ...slice({ page: 2, pageSize: 20 }) });
		await expect.element(screen.getByRole('cell', { name: 'Person 21', exact: true })).toBeInTheDocument();
		(screen.component as { reload: () => void }).reload();
		await expect.poll(() => loader.mock.calls.length).toBe(1);
		expect(lastCall(loader)).toMatchObject({ page: 2 });
	});

	test('onloaded receives the rows and the total of each load', async () => {
		const onloaded = vi.fn();
		render(DataTable, { columns, loader: instantLoader(), onloaded });
		await expect.poll(() => onloaded.mock.calls.length).toBe(1);
		expect(lastCall(onloaded)).toMatchObject({ total: 45, query: { page: 1 } });
		expect(lastCall(onloaded).rows).toHaveLength(20);
	});

	describe('controlled', () => {
		test('onquerychange is not called on mount, then at every change with the query', async () => {
			const onquerychange = vi.fn();
			const screen = await render(DataTable, { columns, onquerychange, ...slice({ page: 1, pageSize: 20 }) });
			await expect.element(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
			expect(onquerychange).not.toHaveBeenCalled();
			await screen.getByRole('button', { name: 'Page 2' }).click();
			await expect.poll(() => onquerychange.mock.calls.length).toBe(1);
			expect(lastCall(onquerychange)).toMatchObject({ page: 2, pageSize: 20, search: '' });
			expect(lastCall(onquerychange)).not.toHaveProperty('signal');
		});

		test('loading shows the progress of the table', async () => {
			const screen = await render(DataTable, { columns, loading: true, ...slice({ page: 1, pageSize: 20 }) });
			await expect.element(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
		});

		test('reload() calls onquerychange', async () => {
			const onquerychange = vi.fn();
			const screen = await render(DataTable, { columns, onquerychange, ...slice({ page: 1, pageSize: 20 }) });
			(screen.component as { reload: () => void }).reload();
			expect(onquerychange).toHaveBeenCalledTimes(1);
		});

		test('without total the paginator only goes forward', async () => {
			const screen = await render(DataTable, { columns, rows: people.slice(0, 20) });
			await expect.element(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
			expect(range(screen.container)).toBe('1–20');
			expect(screen.container.querySelector('[aria-label="Last page"]')).toBeNull();
		});
	});

	describe('infinite', () => {
		test('v4 bug: loads batch after batch while the last rows are in view, also when the first batch does not fill the table', async () => {
			const loader = vi.fn(async (query: Request) => slice(query, 12));
			const screen = await render(DataTable, {
				columns,
				loader,
				pagination: 'infinite',
				pageSize: 5,
				...slice({ page: 1, pageSize: 5 }, 12)
			});
			await expect.poll(() => names(screen.container).length).toBe(12);
			expect(loader.mock.calls.map(([query]) => query.page)).toEqual([2, 3]);
			expect(range(screen.container)).toBe('12 of 12');
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(loader).toHaveBeenCalledTimes(2);
		});

		test('waits until the last rows come into view when the table scrolls', async () => {
			const loader = vi.fn(async (query: Request) => slice(query));
			const screen = await render(DataTable, {
				columns,
				loader,
				pagination: 'infinite',
				pageSize: 20,
				style: '--table-max-height: 200px',
				...slice({ page: 1, pageSize: 20 })
			});
			await expect.element(screen.getByRole('cell', { name: 'Person 01', exact: true })).toBeInTheDocument();
			await new Promise((resolve) => setTimeout(resolve, 100));
			expect(loader).not.toHaveBeenCalled();
			const scroll = screen.container.querySelector('.aurora-table-scroll')!;
			scroll.scrollTop = scroll.scrollHeight;
			await expect.poll(() => loader.mock.calls.length).toBe(1);
			await expect.poll(() => names(screen.container).length).toBe(40);
			expect(range(screen.container)).toBe('40 of 45');
		});

		test('a new query brings the table that scrolls on its own back to the top', async () => {
			const loader = vi.fn(async (query: Request) => slice(query));
			const searchState = bound<string>();
			const screen = await render(DataTable, {
				columns,
				loader,
				pagination: 'infinite',
				pageSize: 20,
				searchable: true,
				style: '--table-max-height: 200px',
				...slice({ page: 1, pageSize: 20 }),
				get search() {
					return searchState.value;
				},
				set search(value) {
					searchState.value = value;
				}
			});
			const scroll = screen.container.querySelector('.aurora-table-scroll')!;
			scroll.scrollTop = 300;
			await expect.poll(() => scroll.scrollTop).toBeGreaterThan(0);
			searchState.value = 'Person';
			await expect.poll(() => scroll.scrollTop).toBe(0);
		});

		test('with thousands of rows only the rows in view are in the page, and the next batch loads at the end', async () => {
			const big = Array.from({ length: 1000 }, (_, index) => ({ id: index + 1, name: `Row ${index + 1}`, age: index }));
			const loader = vi.fn(async (query: Request) => ({
				rows: big.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
				total: big.length
			}));
			const screen = await render(DataTable, {
				columns,
				loader,
				pagination: 'infinite',
				pageSize: 250,
				style: '--table-max-height: 300px',
				rows: big.slice(0, 250),
				total: big.length
			});
			await expect.poll(() => names(screen.container).length).toBeLessThan(60);
			expect(loader).not.toHaveBeenCalled();
			const scroll = screen.container.querySelector('.aurora-table-scroll')!;
			await expect
				.poll(() => {
					if (!loader.mock.calls.length) scroll.scrollTop = scroll.scrollHeight;
					return loader.mock.calls.length;
				}, { timeout: 5000 })
				.toBe(1);
			expect(loader.mock.calls[0][0]).toMatchObject({ page: 2, pageSize: 250 });
			await expect.poll(() => range(screen.container)).toBe('500 of 1,000');
			expect(names(screen.container).length).toBeLessThan(60);
		});

		test('shows "Loading more rows" while the next batch loads', async () => {
			const { loader, calls } = deferredLoader();
			const screen = await render(DataTable, {
				columns,
				loader,
				pagination: 'infinite',
				pageSize: 5,
				...slice({ page: 1, pageSize: 5 })
			});
			await expect.element(screen.getByRole('status').filter({ hasText: 'Loading more rows' })).toBeInTheDocument();
			expect(screen.getByRole('table').element().hasAttribute('aria-busy')).toBe(false);
			calls[0].resolve(slice(calls[0].query));
			await expect.poll(() => names(screen.container).length).toBeGreaterThan(5);
		});

		test('a new query starts again from the first batch', async () => {
			const loader = vi.fn(async (query: Request) => slice(query, 12));
			const searchState = bound<string>();
			const screen = await render(DataTable, {
				columns,
				loader,
				pagination: 'infinite',
				pageSize: 5,
				searchable: true,
				...slice({ page: 1, pageSize: 5 }, 12),
				get search() {
					return searchState.value;
				},
				set search(value) {
					searchState.value = value;
				}
			});
			await expect.poll(() => names(screen.container).length).toBe(12);
			loader.mockClear();
			searchState.value = 'Person';
			await expect.poll(() => loader.mock.calls.length).toBeGreaterThan(0);
			expect(loader.mock.calls[0][0]).toMatchObject({ page: 1, search: 'Person' });
		});

		test('without loader, onloadmore asks the next batch once until rows change', async () => {
			const onloadmore = vi.fn();
			const rowsState = bound(people.slice(0, 5));
			const screen = await render(DataTable, {
				columns,
				pagination: 'infinite',
				pageSize: 5,
				total: 12,
				onloadmore,
				get rows() {
					return rowsState.value;
				}
			});
			await expect.poll(() => onloadmore.mock.calls.length).toBe(1);
			expect(lastCall(onloadmore)).toMatchObject({ page: 2, pageSize: 5 });
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(onloadmore).toHaveBeenCalledTimes(1);
			rowsState.value = people.slice(0, 10);
			await expect.poll(() => onloadmore.mock.calls.length).toBe(2);
			expect(lastCall(onloadmore)).toMatchObject({ page: 3 });
			expect(names(screen.container)).toHaveLength(10);
		});
	});

	describe('selection', () => {
		function selectionProps() {
			const selected = bound<Person[]>([]);
			const selectedAll = bound<boolean>();
			const excluded = bound<Person[]>();
			return {
				state: { selected, selectedAll, excluded },
				props: {
					get selected() {
						return selected.value;
					},
					set selected(value) {
						selected.value = value;
					},
					get selectedAll() {
						return selectedAll.value;
					},
					set selectedAll(value) {
						selectedAll.value = value;
					},
					get excluded() {
						return excluded.value;
					},
					set excluded(value) {
						excluded.value = value;
					}
				}
			};
		}

		test('the bar shows the count, offers every row of the result and clears', async () => {
			const { state, props } = selectionProps();
			const screen = await render(
				DataTable,
				merge({ columns, loader: instantLoader(), selectable: 'multiple', ...slice({ page: 1, pageSize: 20 }) }, props)
			);
			expect(screen.container.querySelector('.aurora-data-table-selection')).toBeNull();
			await screen.getByRole('checkbox', { name: /Select Person 01/ }).click();
			const bar = screen.getByRole('toolbar', { name: 'Actions on the selected rows' });
			await expect.element(bar).toHaveTextContent('1 selected');
			expect(bar.getByRole('button', { name: /Select all/ }).query()).toBeNull();
			await screen.getByRole('checkbox', { name: 'Select all rows' }).click();
			await expect.element(bar).toHaveTextContent('20 selected');
			await bar.getByRole('button', { name: 'Select all 45' }).click();
			expect(state.selectedAll.value).toBe(true);
			await expect.element(bar).toHaveTextContent('45 selected');
			await screen.getByRole('checkbox', { name: /Select Person 02/ }).click();
			await expect.element(bar).toHaveTextContent('44 selected');
			expect(state.excluded.value?.map((row) => row.id)).toEqual([2]);
			await bar.getByRole('button', { name: 'Clear selection' }).click();
			expect(state.selectedAll.value).toBe(false);
			expect(state.selected.value).toEqual([]);
			expect(screen.container.querySelector('.aurora-data-table-selection')).toBeNull();
		});

		test('v4 bug: the selection stays when the page changes', async () => {
			const { state, props } = selectionProps();
			const screen = await render(
				DataTable,
				merge({ columns, loader: instantLoader(), selectable: 'multiple', ...slice({ page: 1, pageSize: 20 }) }, props)
			);
			await screen.getByRole('checkbox', { name: /Select Person 01/ }).click();
			await screen.getByRole('button', { name: 'Page 2' }).click();
			await expect.element(screen.getByRole('cell', { name: 'Person 21', exact: true })).toBeInTheDocument();
			expect(state.selected.value?.map((row) => row.id)).toEqual([1]);
			await expect.element(screen.getByRole('toolbar')).toHaveTextContent('1 selected');
		});

		test('every row on later pages is checked while selectedAll', async () => {
			const { props } = selectionProps();
			const screen = await render(
				DataTable,
				merge(props, { columns, loader: instantLoader(), selectable: 'multiple', ...slice({ page: 1, pageSize: 20 }), selectedAll: true })
			);
			await screen.getByRole('button', { name: 'Page 3' }).click();
			await expect.element(screen.getByRole('checkbox', { name: /Select Person 45/ })).toBeChecked();
		});

		test('selectionActionsSnippet receives the selection, the count and clear', async () => {
			const { props } = selectionProps();
			const seen = vi.fn();
			const actions = (await import('svelte')).createRawSnippet(
				(params: () => { count: number; selectedAll: boolean; clear: () => void }) => ({
					render: () => `<button>Delete ${params().count}</button>`,
					setup: (node) => {
						seen(params());
						node.addEventListener('click', () => params().clear());
					}
				})
			);
			const screen = await render(
				DataTable,
				merge({ columns, selectable: 'multiple', selectionActionsSnippet: actions, ...slice({ page: 1, pageSize: 20 }) }, props)
			);
			await screen.getByRole('checkbox', { name: /Select Person 03/ }).click();
			await expect.element(screen.getByRole('button', { name: 'Delete 1' })).toBeInTheDocument();
			expect(seen).toHaveBeenLastCalledWith(expect.objectContaining({ count: 1, selectedAll: false }));
			await screen.getByRole('button', { name: 'Delete 1' }).click();
			expect(screen.container.querySelector('.aurora-data-table-selection')).toBeNull();
		});

		test('on a narrow table the bar is full width, with × on the first row and the actions below', async () => {
			const screen = await render(DataTable, {
				columns,
				selectable: 'multiple',
				selected: [people[0]],
				selectionActionsSnippet: snippet('<button type="button">Delete</button>'),
				...slice({ page: 1, pageSize: 20 })
			});
			screen.container.style.width = '380px';
			await expect.poll(() => screen.container.querySelector('.aurora-data-table')?.hasAttribute('data-narrow')).toBe(true);
			const top = (element: Element) => Math.round(element.getBoundingClientRect().top);
			const count = screen.container.querySelector('.aurora-data-table-selection-count')!;
			const clear = screen.getByRole('button', { name: 'Clear selection' }).element();
			const action = screen.getByRole('button', { name: 'Delete' }).element();
			expect(Math.abs(top(clear) - top(count))).toBeLessThan(8);
			expect(top(action)).toBeGreaterThan(top(count) + 10);
			const bar = screen.container.querySelector('.aurora-data-table-selection')!.getBoundingClientRect();
			const dock = screen.container.querySelector('.aurora-data-table-selection-dock')!.getBoundingClientRect();
			expect(bar.width).toBeGreaterThan(dock.width - 30);
		});

		test('selectionActions are drawn by the table and receive the selection', async () => {
			const onclick = vi.fn();
			const screen = await render(DataTable, {
				columns,
				selectable: 'multiple',
				selected: [people[0], people[1]],
				selectionActions: [
					{ label: 'Send', onclick },
					{ label: 'Delete', variant: 'danger', onclick: () => undefined }
				],
				...slice({ page: 1, pageSize: 20 })
			});
			const bar = screen.getByRole('toolbar', { name: 'Actions on the selected rows' });
			await expect.element(bar.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-variant', 'danger');
			await bar.getByRole('button', { name: 'Send' }).click();
			const context = onclick.mock.calls[0][0];
			expect(context.selected.map((row: Person) => row.id)).toEqual([1, 2]);
			expect(context).toMatchObject({ selectedAll: false, excluded: [], count: 2 });
			expect(context.event).toBeInstanceOf(MouseEvent);
			context.clear();
			await expect.poll(() => screen.container.querySelector('.aurora-data-table-selection')).toBeNull();
		});

		test('a disabled action does not run and its tooltip says why; selectionDisabled disables all', async () => {
			const onclick = vi.fn();
			const screen = await render(DataTable, {
				columns,
				selectable: 'multiple',
				selected: [people[0]],
				selectionActions: [
					{ label: 'Archive', disabled: true, disabledInfo: 'Only past bookings', onclick },
					{ label: 'Send', info: 'Emails every client', onclick }
				],
				...slice({ page: 1, pageSize: 20 })
			});
			const archive = screen.getByRole('button', { name: 'Archive' });
			await expect.element(archive).toHaveAttribute('aria-disabled', 'true');
			(archive.element() as HTMLButtonElement).click();
			expect(onclick).not.toHaveBeenCalled();
			expect(tooltipText(archive.element())).toBe('Only past bookings');
			expect(tooltipText(screen.getByRole('button', { name: 'Send' }).element())).toBe('Emails every client');
			await screen.rerender({ selectionDisabled: true });
			await expect.element(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('aria-disabled', 'true');
		});

		test('an action that returns a promise spins until it settles', async () => {
			let finish: () => void = () => undefined;
			const screen = await render(DataTable, {
				columns,
				selectable: 'multiple',
				selected: [people[0]],
				selectionActions: [{ label: 'Send', onclick: () => new Promise<void>((resolve) => (finish = resolve)) }],
				...slice({ page: 1, pageSize: 20 })
			});
			const send = screen.getByRole('button', { name: 'Send' });
			await send.click();
			await expect.element(send).toHaveAttribute('data-loading');
			finish();
			await expect.element(send).not.toHaveAttribute('data-loading');
		});

		test('the actions that do not fit go in a menu, also from the keyboard, and fewer fit on a narrow table', async () => {
			const ran = vi.fn();
			const actions = Array.from({ length: 6 }, (_, index) => ({ label: `Action ${index + 1}`, onclick: () => ran(index + 1) }));
			const screen = await render(DataTable, {
				columns,
				selectable: 'multiple',
				selected: [people[0]],
				selectionActions: actions,
				...slice({ page: 1, pageSize: 20 })
			});
			const bar = screen.getByRole('toolbar');
			await expect.element(bar.getByRole('button', { name: 'Action 4' })).toBeInTheDocument();
			expect(bar.getByRole('button', { name: 'Action 5' }).query()).toBeNull();
			await bar.getByRole('button', { name: 'More actions' }).click();
			const menu = page.getByRole('menu', { name: 'More actions' });
			await expect.element(menu.getByRole('menuitem', { name: 'Action 5' })).toHaveFocus();
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(menu.getByRole('menuitem', { name: 'Action 6' })).toHaveFocus();
			await userEvent.keyboard('{Enter}');
			expect(ran).toHaveBeenCalledWith(6);
			await expect.element(menu).not.toBeInTheDocument();
			screen.container.style.width = '380px';
			await expect.poll(() => bar.getByRole('button', { name: 'Action 3' }).query()).toBeNull();
			await expect.element(bar.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
		});

		test('with one action more than the limit every action stays in the bar', async () => {
			const screen = await render(DataTable, {
				columns,
				selectable: 'multiple',
				selected: [people[0]],
				selectionActions: Array.from({ length: 5 }, (_, index) => ({ label: `Action ${index + 1}`, onclick: () => undefined })),
				...slice({ page: 1, pageSize: 20 })
			});
			await expect.element(screen.getByRole('button', { name: 'Action 5' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'More actions' }).query()).toBeNull();
		});

		test('disabled locks the table, the pagination and the actions of the bar', async () => {
			const onclick = vi.fn();
			const loader = instantLoader();
			const screen = await render(DataTable, {
				columns,
				loader,
				selectable: 'multiple',
				selected: [people[0]],
				selectionActions: [{ label: 'Send', onclick }],
				disabled: true,
				...slice({ page: 1, pageSize: 20 })
			});
			expect(screen.container.querySelector('.aurora-data-table')!.hasAttribute('data-disabled')).toBe(true);
			await expect.element(screen.getByRole('checkbox', { name: /Select Person 02/ })).toBeDisabled();
			expect(screen.container.querySelector('.aurora-data-table-footer')!.hasAttribute('inert')).toBe(true);
			const send = screen.getByRole('button', { name: 'Send' });
			await expect.element(send).toHaveAttribute('aria-disabled', 'true');
			(send.element() as HTMLButtonElement).click();
			expect(onclick).not.toHaveBeenCalled();
		});

		test('selectAll={false} hides "Select all N" too', async () => {
			const screen = await render(DataTable, {
				columns,
				selectable: 'multiple',
				selectAll: false,
				selected: people.slice(0, 20),
				...slice({ page: 1, pageSize: 20 })
			});
			await expect.element(screen.getByRole('toolbar')).toHaveTextContent('20 selected');
			expect(screen.getByRole('button', { name: /Select all/ }).query()).toBeNull();
		});

		test('the bar stays on one row while it fits, also on a narrow table', async () => {
			const screen = await render(DataTable, {
				columns,
				selectable: 'multiple',
				selected: [people[0]],
				selectionActions: [
					{ label: 'Send', onclick: () => undefined },
					{ label: 'Export', onclick: () => undefined }
				],
				...slice({ page: 1, pageSize: 20 })
			});
			screen.container.style.width = '600px';
			await expect.poll(() => screen.container.querySelector('.aurora-data-table')?.hasAttribute('data-narrow')).toBe(true);
			const middle = (element: Element) => {
				const box = element.getBoundingClientRect();
				return box.top + box.height / 2;
			};
			const count = middle(screen.container.querySelector('.aurora-data-table-selection-count')!);
			for (const name of ['Send', 'Export', 'Clear selection'])
				expect(Math.abs(middle(screen.getByRole('button', { name }).element()) - count)).toBeLessThan(4);
		});

		test('selectedAll with an unknown total says "All selected"', async () => {
			const screen = await render(DataTable, { columns, selectable: 'multiple', rows: people.slice(0, 5), selectedAll: true });
			await expect.element(screen.getByRole('toolbar')).toHaveTextContent('All selected');
		});

		test('selectionBar={false} hides the bar', async () => {
			const screen = await render(DataTable, {
				columns,
				selectable: 'multiple',
				selectionBar: false,
				selected: [people[0]],
				...slice({ page: 1, pageSize: 20 })
			});
			await expect.element(screen.getByRole('table')).toBeInTheDocument();
			expect(screen.container.querySelector('.aurora-data-table-selection')).toBeNull();
		});
	});

	test('below 640px the toolbar is one row: Columns only as an icon, toolbarSnippet gets narrow', async () => {
		const tool = (await import('svelte')).createRawSnippet((params: () => { narrow: boolean }) => ({
			render: () => '<button type="button"></button>',
			setup: (node) => {
				$effect(() => {
					node.textContent = params().narrow ? '+' : 'New';
				});
			}
		}));
		const screen = await render(DataTable, {
			columns,
			columnManager: true,
			searchable: true,
			toolbarSnippet: tool,
			...slice({ page: 1, pageSize: 20 })
		});
		await expect.element(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
		screen.container.style.width = '380px';
		await expect.element(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
		const columnsButton = screen.getByRole('button', { name: 'Columns' }).element();
		expect(columnsButton.textContent?.trim()).toBe('');
		const toolbar = screen.container.querySelector('.aurora-data-table-toolbar')!;
		const middles = [...toolbar.querySelectorAll('input, button')].map((node) => {
			const box = node.getBoundingClientRect();
			return box.top + box.height / 2;
		});
		expect(Math.max(...middles) - Math.min(...middles)).toBeLessThan(4);
	});

	test('toolbarSnippet goes at the end of the toolbar, after "Columns"', async () => {
		const screen = await render(DataTable, {
			columns,
			columnManager: true,
			toolbarSnippet: snippet('<button>New</button>'),
			...slice({ page: 1, pageSize: 20 })
		});
		const buttons = [...screen.container.querySelectorAll('.aurora-data-table-toolbar button')].map((b) => b.textContent?.trim());
		expect(buttons).toEqual(['Columns', 'New']);
	});

	test('"Columns" opens the ColumnManager and saving calls oncolumnstatechange', async () => {
		const oncolumnstatechange = vi.fn();
		const screen = await render(DataTable, {
			columns,
			columnManager: true,
			oncolumnstatechange,
			...slice({ page: 1, pageSize: 20 })
		});
		await screen.getByRole('button', { name: 'Columns' }).click();
		const dialog = page.getByRole('dialog');
		await expect.element(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Hide Age' }).click();
		await expect.poll(() => screen.container.querySelectorAll('thead th').length).toBe(1);
		await dialog.getByRole('button', { name: 'Save view' }).click();
		expect(oncolumnstatechange).toHaveBeenCalledWith({
			columnState: [
				{ key: 'name', visible: true },
				{ key: 'age', visible: false }
			]
		});
	});

	test('the texts follow locale, and labels win', async () => {
		const screen = await render(DataTable, {
			columns,
			locale: 'it',
			searchable: true,
			labels: { search: 'Cerca persone' },
			...slice({ page: 1, pageSize: 20 })
		});
		await expect.element(screen.getByRole('combobox', { name: 'Righe per pagina' })).toBeInTheDocument();
		await expect.element(screen.getByRole('searchbox', { name: 'Cerca persone' })).toBeInTheDocument();
		expect(range(screen.container)).toBe('1–20 di 45');
		await expect.element(screen.getByRole('navigation', { name: 'Paginazione' })).toBeInTheDocument();
	});

	test('the texts follow setDefaultLocale, and locale wins', async () => {
		const screen = await renderWithDefaultLocale('it', DataTable, { columns, ...slice({ page: 1, pageSize: 20 }) });
		await expect.element(screen.getByRole('combobox', { name: 'Righe per pagina' })).toBeInTheDocument();
		screen.unmount();
		const english = await renderWithDefaultLocale('it', DataTable, { columns, locale: 'en', ...slice({ page: 1, pageSize: 20 }) });
		await expect.element(english.getByRole('combobox', { name: 'Rows per page' })).toBeInTheDocument();
	});

	test('rangeSnippet replaces the range', async () => {
		const custom = (await import('svelte')).createRawSnippet(
			(params: () => { from: number; to: number; total: number; pageCount: number }) => ({
				render: () => `<em>${params().from}-${params().to}/${params().total} (${params().pageCount})</em>`
			})
		);
		const screen = await render(DataTable, { columns, rangeSnippet: custom, ...slice({ page: 1, pageSize: 20 }) });
		await expect.element(screen.getByText('1-20/45 (3)')).toBeInTheDocument();
	});

	test('pagination="none" shows the total only', async () => {
		const screen = await render(DataTable, { columns, pagination: 'none', rows: people.slice(0, 3), total: 3 });
		await expect.element(screen.getByRole('table')).toBeInTheDocument();
		expect(range(screen.container)).toBe('3 results');
		expect(screen.container.querySelector('nav')).toBeNull();
	});

	test('the frame takes the --data-table-* variables and Table props pass through', async () => {
		const screen = await render(DataTable, {
			columns,
			caption: 'People',
			'data-testid': 'people',
			...slice({ page: 1, pageSize: 20 })
		});
		await expect.element(screen.getByRole('table', { name: 'People' })).toBeInTheDocument();
		screen.container.style.setProperty('--data-table-border-radius', '3px');
		const root = screen.container.querySelector<HTMLElement>('.aurora-data-table')!;
		expect(getComputedStyle(root).borderTopLeftRadius).toBe('3px');
		expect(screen.container.querySelector('.aurora-table')?.getAttribute('data-testid')).toBe('people');
	});

	test('v4 bug: the builder of a page change keeps the search', async () => {
		const onquerychange = vi.fn();
		const screen = await render(DataTable, {
			columns,
			search: 'Ann',
			searchColumns: ['name'],
			onquerychange,
			...slice({ page: 1, pageSize: 20 })
		});
		await screen.getByRole('button', { name: 'Page 2' }).click();
		await expect.poll(() => onquerychange.mock.calls.length).toBe(1);
		expect(JSON.stringify(lastCall(onquerychange).builder.toJson())).toContain('%Ann%');
	});

	test('v4 bug: sorting again does not pile up orderBy in the builder', async () => {
		const onquerychange = vi.fn();
		const screen = await render(DataTable, { columns, searchable: true, onquerychange, ...slice({ page: 1, pageSize: 20 }) });
		await screen.getByRole('button', { name: /^Age/ }).click();
		await userEvent.type(screen.getByRole('searchbox'), 'x{Enter}');
		await screen.getByRole('button', { name: /^Age/ }).click();
		await expect.poll(() => onquerychange.mock.calls.length).toBe(3);
		const orders = lastCall(onquerychange)
			.builder.toJson()
			.modifiers.filter((modifier: { method: string }) => modifier.method === 'orderBy');
		expect(orders).toEqual([{ method: 'orderBy', sortBy: 'age', sortDirection: 'desc' }]);
	});
});
