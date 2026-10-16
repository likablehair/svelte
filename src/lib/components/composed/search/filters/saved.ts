import {
	addFilterNode,
	filterConditions,
	filterGroup,
	filtersFromParam,
	pruneFilters,
	removeFilterNode,
	type FilterField,
	type FilterGroup,
	type SavedFilter
} from '../../../../utils/filters/model.js';

export function readSaved(key: string): SavedFilter[] | undefined {
	try {
		const stored = localStorage.getItem(key);
		if (stored === null) return undefined;
		const list = JSON.parse(stored);
		if (Array.isArray(list))
			return list.filter(
				(item) => item && typeof item.id === 'string' && typeof item.name === 'string' && item.value
			);
	} catch {
		return undefined;
	}
	return undefined;
}

export function writeSaved(key: string, list: SavedFilter[]): void {
	try {
		localStorage.setItem(key, JSON.stringify(list));
	} catch {
		void 0;
	}
}

export function restoreSaved(item: SavedFilter, tree: FilterGroup, fields: FilterField[]): FilterGroup {
	let next = filtersFromParam(JSON.stringify(item.value), fields);
	for (const condition of filterConditions(next))
		if (condition.locked) next = removeFilterNode(next, condition.id);
	next = pruneFilters(next);
	const locked = filterConditions(tree).filter((condition) => condition.locked);
	if (locked.length && next.logic === 'or')
		next = { ...next, logic: 'and', items: next.items.length > 1 ? [filterGroup('or', next.items)] : next.items };
	for (const condition of locked) next = addFilterNode(next, condition);
	return pruneFilters(next);
}
