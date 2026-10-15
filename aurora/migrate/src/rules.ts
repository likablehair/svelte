import { readFileSync } from 'node:fs';
import type { CompiledRules, ComponentMigration, ExportChange } from './types.ts';

export interface CssVarRule {
	component: string;
	kind: 'renamed' | 'removed' | 'changed';
	name: string;
	to?: string;
	note?: string;
	replacement?: string;
}

export interface RuleIndex {
	rules: CompiledRules;
	byV4: Map<string, ComponentMigration>;
	cssVars: Map<string, CssVarRule>;
	exportChanges: Map<string, ExportChange>;
	v4Exports: Set<string>;
	v4Components: Set<string>;
	v5Exports: Set<string>;
}

export function indexRules(rules: CompiledRules): RuleIndex {
	const cssVars = new Map<string, CssVarRule>();
	for (const rule of rules.components) {
		const add = (entry: CssVarRule) => {
			if (!cssVars.has(entry.name)) cssVars.set(entry.name, entry);
		};
		for (const r of rule.cssVars?.renamed ?? [])
			add({ component: rule.from, kind: 'renamed', name: r.from, to: r.to, note: r.note });
		for (const r of rule.cssVars?.removed ?? [])
			add({
				component: rule.from,
				kind: 'removed',
				name: r.name,
				note: r.note,
				replacement: r.replacement
			});
		for (const r of rule.cssVars?.changed ?? [])
			add({ component: rule.from, kind: 'changed', name: r.name, note: r.note });
	}
	return {
		rules,
		byV4: new Map(rules.components.map((rule) => [rule.from, rule])),
		cssVars,
		exportChanges: new Map(rules.global.exports.map((e) => [e.name, e])),
		v4Exports: new Set(rules.v4.exports),
		v4Components: new Set(rules.v4.components),
		v5Exports: new Set(rules.v5.exports)
	};
}

export function loadRules(file: URL | string = new URL('../rules/v4-to-v5.json', import.meta.url)) {
	return indexRules(JSON.parse(readFileSync(file, 'utf8')) as CompiledRules);
}
