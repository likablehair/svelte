import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { LOCAL_PREFIX } from './compile.ts';
import type { CompiledRules, ComponentMigration, ExportChange, LocalMigration } from './types.ts';

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
	localFiles: Map<string, LocalMigration[]>;
}

export const isLocalRule = (rule: ComponentMigration): rule is LocalMigration =>
	rule.from.startsWith(LOCAL_PREFIX) && 'files' in rule;

export function localRuleFor(index: RuleIndex, path: string, text: string | undefined): LocalMigration | undefined {
	return [...(index.localFiles.get(basename(path)) ?? [])]
		.sort((a, b) => (b.contains?.length ?? 0) - (a.contains?.length ?? 0))
		.find((rule) => text !== undefined && (rule.contains ?? []).every((needle) => text.includes(needle)) && !(rule.excludes ?? []).some((needle) => text.includes(needle)));
}

export interface VariantRef {
	name: string;
	when: { prop: string; value: string };
}

export function variantRule(index: RuleIndex, rule: ComponentMigration | undefined, attrs: { name: string; value: string | undefined }[]): ComponentMigration | undefined {
	const variants = (rule as { variants?: VariantRef[] } | undefined)?.variants;
	const found = variants?.find((v) => attrs.some((a) => a.name === v.when.prop && a.value === v.when.value));
	return found && index.byV4.get(`${LOCAL_PREFIX}${found.name}`);
}

export function indexRules(rules: CompiledRules): RuleIndex {
	const cssVars = new Map<string, CssVarRule>();
	for (const rule of rules.components) {
		const add = (entry: CssVarRule) => {
			if (!cssVars.has(entry.name)) cssVars.set(entry.name, entry);
		};
		for (const r of rule.cssVars?.renamed ?? [])
			if (!r.scoped) add({ component: rule.from, kind: 'renamed', name: r.from, to: r.to, note: r.note });
		for (const r of rule.cssVars?.removed ?? [])
			if (!r.drop)
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
	const localFiles = new Map<string, LocalMigration[]>();
	for (const rule of rules.components)
		if (isLocalRule(rule))
			for (const file of rule.files) localFiles.set(file, [...(localFiles.get(file) ?? []), rule]);
	return {
		rules,
		localFiles,
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

export function componentRules(index: RuleIndex, name: string): string {
	const wanted = name.trim().toLowerCase();
	const rules = index.rules.components.filter(
		(rule) =>
			rule.from.toLowerCase() === wanted ||
			rule.from.toLowerCase() === `${LOCAL_PREFIX}${wanted}` ||
			rule.to.toLowerCase() === wanted
	);
	if (!rules.length) {
		const names = [...new Set(index.rules.components.map((r) => r.from))].sort();
		return `No migration rule for "${name}". v4 components with rules: ${names.join(', ')}`;
	}
	return rules.map((rule) => `## ${rule.from} → ${rule.to}\n\n\`\`\`json\n${JSON.stringify(rule, null, 2)}\n\`\`\``).join('\n\n');
}
