import type { CompiledRules, ComponentApi, ComponentMigration, GlobalMigration } from './types.ts';

export interface RuleSources {
	global: GlobalMigration;
	components: (ComponentMigration | ComponentMigration[])[];
	v4Index: string;
	v5Index: string;
	v5Components: Record<string, ComponentApi>;
}

const sorted = (names: Iterable<string>) => [...new Set(names)].sort((a, b) => a.localeCompare(b));

export function exportNames(index: string): string[] {
	return [...index.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g)].flatMap((m) =>
		m[1]
			.split(',')
			.map((part) => part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()!)
			.filter(Boolean)
	);
}

export function compileRules(sources: RuleSources): CompiledRules {
	const v4Components = [
		...sources.v4Index.matchAll(/default\s+as\s+(\w+)\s*\}\s*from\s*'[^']+\.svelte'/g)
	].map((m) => m[1]);
	const components = sources.components
		.flat()
		.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
	return JSON.parse(
		JSON.stringify({
			schema: 1,
			package: '@likable-hair/svelte',
			from: '4',
			to: '5',
			v4: { components: sorted(v4Components), exports: sorted(exportNames(sources.v4Index)) },
			v5: {
				exports: sorted(exportNames(sources.v5Index)),
				components: Object.fromEntries(
					sorted(Object.keys(sources.v5Components)).map((name) => [name, sources.v5Components[name]])
				)
			},
			global: sources.global,
			components
		})
	);
}

export const serializeRules = (rules: CompiledRules) => JSON.stringify(rules, null, '\t') + '\n';
