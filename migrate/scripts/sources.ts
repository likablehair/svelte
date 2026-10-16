import { readFileSync } from 'node:fs';
import { getComponentDoc, listComponents } from '../../src/docs/api.server.ts';
import type { RuleSources } from '../src/compile.ts';
import type { ComponentApi, ComponentMigration, GlobalMigration, LocalMigration } from '../src/types.ts';

const files = import.meta.glob<ComponentMigration | ComponentMigration[] | GlobalMigration>(
	'/migrations/v4-to-v5/*.ts',
	{ import: 'default', eager: true }
);

const locals = import.meta.glob<LocalMigration>('/migrations/v4-to-v5/local/*.ts', {
	import: 'default',
	eager: true
});

function componentApi(slug: string): ComponentApi {
	const doc = getComponentDoc(slug)!;
	return {
		slug,
		props: doc.props.map((p) => p.name),
		bindable: doc.props.filter((p) => p.bindable).map((p) => p.name),
		defaults: Object.fromEntries(
			doc.props.filter((p) => p.default !== undefined).map((p) => [p.name, p.default!])
		),
		events: doc.events.map((e) => e.name),
		snippets: doc.snippets.map((s) => s.name),
		native: !!doc.htmlElement,
		cssVars: [
			...new Set([
				...doc.cssVars.flatMap((v) => [v.name, ...v.defaults.map((d) => d.name)]),
				...doc.cssDefaultsOnly.map((d) => d.name)
			])
		].sort()
	};
}

export function ruleSources(): RuleSources {
	const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
	return {
		global: files['/migrations/v4-to-v5/global.ts'] as GlobalMigration,
		components: Object.entries(files)
			.filter(([path]) => !path.endsWith('/global.ts'))
			.map(([, rule]) => rule as ComponentMigration | ComponentMigration[]),
		local: Object.values(locals),
		v4Index: read('../v4/index.ts'),
		v5Index: read('../../src/lib/index.ts'),
		v5Components: Object.fromEntries(listComponents().map((c) => [c.name, componentApi(c.slug)]))
	};
}
