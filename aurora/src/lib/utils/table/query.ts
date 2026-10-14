import FilterBuilder from '../filters/builder.js';
import { filtersToBuilder } from '../filters/convert.js';
import { escapeLike } from '../filters/convert/columns.js';
import {
	filterConditions,
	isConditionComplete,
	pruneFilters,
	removeFilterNode,
	type FilterField,
	type FilterGroup
} from '../filters/model.js';
import type { TableColumn, TableSort } from './types.js';

export function completeFilters(tree: FilterGroup, fields: FilterField[]): FilterGroup {
	const byName = new Map(fields.map((field) => [field.name, field]));
	let next = tree;
	for (const condition of filterConditions(tree))
		if (!condition.locked && !isConditionComplete(condition, byName.get(condition.field)))
			next = removeFilterNode(next, condition.id);
	return pruneFilters(next);
}

export function searchBuilder(search: string, columns: string[] | undefined): FilterBuilder {
	const builder = new FilterBuilder();
	if (!search || !columns?.length) return builder;
	const pattern = `%${escapeLike(search)}%`;
	return builder.where((group) => {
		columns.forEach((column, index) =>
			index ? group.orWhere(column, 'ilike', pattern) : group.where(column, 'ilike', pattern)
		);
	});
}

export interface FilterQueryOptions {
	search: string;
	searchColumns?: string[];
	filterValue: FilterGroup;
	filterFields: FilterField[];
	weekStart?: number;
	negativesIncludeEmpty?: boolean;
}

export function filterQuery(options: FilterQueryOptions): FilterBuilder {
	return filtersToBuilder(options.filterValue, options.filterFields, {
		builder: searchBuilder(options.search, options.searchColumns),
		weekStart: options.weekStart,
		negativesIncludeEmpty: options.negativesIncludeEmpty
	});
}

export function sortedQuery<Row>(
	builder: FilterBuilder,
	sort: TableSort | undefined,
	columns: TableColumn<Row>[]
): FilterBuilder {
	const copy = builder.clone();
	if (!sort) return copy;
	const column = columns.find((entry) => entry.key === sort.key);
	return column?.sort
		? column.sort({ builder: copy, direction: sort.direction })
		: copy.orderBy(sort.key, sort.direction);
}

export function resolvePageCount(
	total: number | undefined,
	pageSize: number,
	pageCount: number | undefined
): number | undefined {
	if (total !== undefined) return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
	return pageCount;
}

export function pageRange(page: number, pageSize: number, count: number) {
	const from = (page - 1) * pageSize + 1;
	return { from, to: from + count - 1 };
}

export function hasMoreRows(
	loaded: number,
	page: number,
	pageSize: number,
	total: number | undefined,
	pageCount: number | undefined
): boolean {
	if (total !== undefined) return loaded < total;
	if (pageCount !== undefined) return page < pageCount;
	return loaded >= page * pageSize;
}

export function selectionCount(
	selection: { selected: unknown[]; selectedAll: boolean; excluded: unknown[] },
	total: number | undefined
): number | undefined {
	if (!selection.selectedAll) return selection.selected.length;
	if (total === undefined) return undefined;
	return Math.max(0, total - selection.excluded.length);
}
