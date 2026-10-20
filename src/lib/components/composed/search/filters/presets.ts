import {
	addFilterNode,
	filterCondition,
	filterConditions,
	removeFilterNode,
	type FilterCondition,
	type FilterGroup,
	type FilterPreset
} from '../../../../utils/filters/model.js';

export function presetMatches(tree: FilterGroup, preset: FilterPreset): FilterCondition[] | undefined {
	const conditions = filterConditions(tree);
	const matched: FilterCondition[] = [];
	for (const wanted of preset.conditions) {
		const found = conditions.find(
			(condition) =>
				!matched.includes(condition) &&
				!condition.locked === !wanted.locked &&
				condition.field === wanted.field &&
				condition.operator === wanted.operator &&
				JSON.stringify(condition.value ?? null) === JSON.stringify(wanted.value ?? null)
		);
		if (!found) return undefined;
		matched.push(found);
	}
	return matched;
}

export function togglePreset(tree: FilterGroup, preset: FilterPreset): FilterGroup {
	const matched = presetMatches(tree, preset);
	let next = tree;
	if (matched) for (const condition of matched) next = removeFilterNode(next, condition.id);
	else
		for (const condition of preset.conditions)
			next = addFilterNode(next, {
				...filterCondition(condition.field, condition.operator, condition.value),
				preset: preset.id,
				...(condition.locked ? { locked: true } : {})
			});
	return next;
}
