import type { Attr, Node } from './svelte.ts';
import { walk } from './svelte.ts';
import type { ComponentApi, ComponentMigration, ManualStep, ManualTrigger, Rename } from './types.ts';

export type Effort = 'auto' | 'check' | 'manual';
export type Todo = ManualStep['kind'];

export interface Finding {
	effort: Effort;
	kind: string;
	id: string;
	name: string;
	component?: string;
	to?: string;
	note?: string;
	todo?: Todo;
	file: string;
	line: number;
	via?: string;
}

export interface Usage {
	component: string;
	file: string;
	line: number;
	via?: string;
	attrs: Attr[];
	snippets: string[];
	slots: string[];
	children: boolean;
	defaults: boolean;
}

export interface UsageMatch {
	findings: Finding[];
	general: ManualStep[];
	app: ManualStep[];
	unknown: string[];
}

export const todoOf = (f: Finding): Todo => f.todo ?? (f.kind === 'css-var-removed' ? 'review' : 'edit');

const IGNORED = new Set(['this', 'class', 'style', 'id', 'key', 'slot']);

export function literalStrings(expression: Node | undefined): { strings: string[]; pure: boolean } {
	const strings: string[] = [];
	const leaf = (node: Node | undefined): boolean => {
		if (!node) return false;
		if (node.type === 'Literal' && typeof node.value === 'string') {
			strings.push(node.value);
			return true;
		}
		if (node.type === 'TemplateLiteral' && !node.expressions.length) {
			strings.push(node.quasis.map((q: Node) => q.value.cooked).join(''));
			return true;
		}
		if (node.type === 'ConditionalExpression') return leaf(node.consequent) && leaf(node.alternate);
		if (node.type === 'LogicalExpression') return leaf(node.left) && leaf(node.right);
		walk(node, (n) => {
			if (n.type === 'Literal' && typeof n.value === 'string') strings.push(n.value);
		});
		return false;
	};
	const pure = leaf(expression);
	return { strings, pure };
}

export function unlessMet(
	trigger: ManualTrigger | undefined,
	usage: Pick<Usage, 'attrs' | 'snippets' | 'slots' | 'children'>,
	rule?: ComponentMigration
): string | undefined {
	if (!trigger) return undefined;
	const withV4 = (names: string[] | undefined, renamed: Rename[] | undefined) =>
		(names ?? []).flatMap((n) => [n, ...(renamed ?? []).filter((r) => r.to === n).map((r) => r.from)]);
	const has = (kinds: Attr['kind'][], name: string) => usage.attrs.some((a) => kinds.includes(a.kind) && a.name === name);
	return (
		withV4(trigger.props, rule?.props?.renamed).find((n) => has(['prop', 'bind'], n)) ??
		trigger.events?.find((n) => has(['event', 'on'], n)) ??
		withV4(trigger.snippets, rule?.snippets?.renamed).find(
			(n) =>
				usage.snippets.includes(n) ||
				usage.slots.includes(n.replace(/Snippet$/, '')) ||
				has(['prop'], n) ||
				(n === 'children' && usage.children)
		) ??
		withV4(trigger.cssVars, rule?.cssVars?.renamed).find((n) => has(['style'], n))
	);
}

export function matchUsage(
	usage: Usage,
	rule: ComponentMigration,
	api: ComponentApi | undefined
): UsageMatch {
	const findings: Finding[] = [];
	const props = new Map<string, Attr>();
	const events = new Map<string, Attr>();
	const cssVars = new Map<string, Attr>();
	for (const attr of usage.attrs) {
		if (attr.kind === 'prop' || attr.kind === 'bind') props.set(attr.name, attr);
		else if (attr.kind === 'event' || attr.kind === 'on') events.set(attr.name, attr);
		else if (attr.kind === 'style') cssVars.set(attr.name, attr);
	}
	const spread = usage.attrs.some((a) => a.kind === 'spread');
	const snippets = new Map<string, number>();
	for (const name of usage.snippets) snippets.set(name, usage.line);
	for (const name of usage.slots) {
		snippets.set(`${name}Snippet`, usage.line);
		snippets.set(name, usage.line);
	}
	if (usage.children) snippets.set('children', usage.line);
	for (const [name, attr] of props) if (name.endsWith('Snippet')) snippets.set(name, attr.line);

	const handled = new Set<string>();
	const add = (
		effort: Effort,
		kind: string,
		id: string,
		name: string,
		line: number,
		extra: Partial<Finding> = {}
	) => {
		handled.add(name);
		findings.push({
			effort,
			kind,
			id: `${rule.from}/${id}`,
			name,
			component: rule.from,
			file: usage.file,
			line,
			...(usage.via ? { via: usage.via } : {}),
			...extra
		});
	};

	const p = rule.props ?? {};
	for (const r of p.renamed ?? []) {
		const attr = props.get(r.from);
		if (!attr) continue;
		const literal = literalStrings(attr.expression);
		const icon =
			attr.text?.startsWith('mdi-') || (literal.pure && literal.strings.some((v) => v.startsWith('mdi-')));
		add(icon || !r.note ? 'auto' : 'check', icon ? 'icon-literal' : 'prop-renamed', `props.renamed/${r.from}`, r.from, attr.line, { to: r.to, note: r.note });
	}
	for (const r of p.inverted ?? []) {
		const attr = props.get(r.from);
		if (attr) add('auto', 'prop-inverted', `props.inverted/${r.from}`, r.from, attr.line, { to: r.to, note: r.note });
	}
	for (const r of p.removed ?? []) {
		const attr = props.get(r.name);
		if (attr)
			add(r.replacement || r.drop ? 'check' : 'manual', 'prop-removed', `props.removed/${r.name}`, r.name, attr.line, {
				to: r.replacement,
				note: r.note
			});
	}
	for (const r of p.changed ?? []) {
		const attr = props.get(r.name);
		if (attr) add('check', 'prop-changed', `props.changed/${r.name}`, r.name, attr.line, { note: r.note });
	}
	for (const r of p.toCssVar ?? []) {
		const attr = props.get(r.name);
		if (attr)
			add(attr.text !== undefined ? 'auto' : 'check', 'prop-to-css-var', `props.toCssVar/${r.name}`, r.name, attr.line, {
				to: r.cssVar,
				note: r.note
			});
	}
	for (const r of p.values ?? []) {
		const attr = props.get(r.name);
		if (!attr) continue;
		if (attr.text !== undefined) {
			if (attr.text in r.values)
				add('auto', 'prop-value', `props.values/${r.name}`, r.name, attr.line, { to: r.values[attr.text], note: r.note });
		} else add('check', 'prop-value', `props.values/${r.name}`, r.name, attr.line, { note: r.note });
	}
	for (const r of p.types ?? []) {
		const attr = props.get(r.name);
		if (attr && !handled.has(r.name))
			add('check', 'prop-type', `props.types/${r.name}`, r.name, attr.line, { to: r.v5, note: r.note ?? `v4: ${r.v4}` });
	}
	for (const name of p.icons ?? []) {
		const attr = props.get(name);
		if (!attr) continue;
		if (attr.text !== undefined) add('auto', 'icon-literal', `props.icons/${name}`, name, attr.line, { to: attr.text });
		else {
			const { strings, pure } = literalStrings(attr.expression);
			add(pure && strings.length ? 'auto' : 'check', pure ? 'icon-literal' : 'icon-dynamic', `props.icons/${name}`, name, attr.line);
		}
	}
	if (usage.defaults)
		for (const r of p.defaults ?? []) {
			if (props.has(r.name)) continue;
			add(r.keepV4 && r.behaviour && !spread ? 'auto' : 'check', 'prop-default', `props.defaults/${r.name}`, r.name, usage.line, {
				to: r.keepV4,
				note: `v4 ${r.v4} → v5 ${r.v5}${r.note ? `. ${r.note}` : ''}`
			});
		}

	const e = rule.events ?? {};
	for (const r of e.changed ?? []) {
		const attr = events.get(r.name);
		if (!attr) continue;
		const lost = Object.values(r.argument ?? {}).some((v) => v === null);
		add(lost ? 'manual' : r.note ? 'check' : 'auto', 'event-changed', `events.changed/${r.name}`, r.name, attr.line, {
			to: r.to,
			note: r.note
		});
	}
	for (const r of e.removed ?? []) {
		const attr = events.get(r.name);
		if (attr)
			add(r.replacement || r.closes ? 'check' : 'manual', 'event-removed', `events.removed/${r.name}`, r.name, attr.line, {
				to: r.replacement,
				note: r.note
			});
	}
	for (const [name, attr] of events) {
		if (handled.has(name)) continue;
		if (attr.kind === 'on' || attr.source.includes('.detail'))
			add('auto', 'event-argument', `events.argument/${name}`, name, attr.line);
	}

	const s = rule.snippets ?? {};
	for (const r of s.renamed ?? []) {
		const line = snippets.get(r.from);
		if (line) add(r.note ? 'check' : 'auto', 'snippet-renamed', `snippets.renamed/${r.from}`, r.from, line, { to: r.to, note: r.note });
	}
	for (const r of s.removed ?? []) {
		const line = snippets.get(r.name);
		if (line)
			add(r.replacement ? 'check' : 'manual', 'snippet-removed', `snippets.removed/${r.name}`, r.name, line, {
				to: r.replacement,
				note: r.note
			});
	}
	for (const r of s.parameters ?? []) {
		const line = snippets.get(r.name);
		if (line && !handled.has(r.name))
			add('check', 'snippet-parameters', `snippets.parameters/${r.name}`, r.name, line, { to: r.v5, note: r.note ?? `v4: ${r.v4}` });
	}

	const c = rule.cssVars ?? {};
	for (const r of c.renamed ?? []) {
		const attr = cssVars.get(r.from);
		if (attr) add(r.note ? 'check' : 'auto', 'css-var-renamed', `cssVars.renamed/${r.from}`, r.from, attr.line, { to: r.to, note: r.note });
	}
	for (const r of c.removed ?? []) {
		const attr = cssVars.get(r.name);
		if (attr)
			add(r.drop ? 'auto' : r.replacement ? 'check' : 'manual', 'css-var-removed', `cssVars.removed/${r.name}`, r.name, attr.line, {
				to: r.replacement,
				note: r.note
			});
	}
	for (const r of c.changed ?? []) {
		const attr = cssVars.get(r.name);
		if (attr) add('check', 'css-var-changed', `cssVars.changed/${r.name}`, r.name, attr.line, { note: r.note });
	}

	const general: ManualStep[] = [];
	const app: ManualStep[] = [];
	for (const step of rule.manual ?? []) {
		if (step.scope === 'app') {
			app.push(step);
			continue;
		}
		const when = step.when;
		if (!when && !usage.defaults) continue;
		if (unlessMet(step.unless, usage, rule)) continue;
		if (!when && step.kind === 'review' && !step.unless) {
			general.push(step);
			continue;
		}
		const hit = when
			? (when.props?.find((n) => props.has(n)) ??
				when.events?.find((n) => events.has(n)) ??
				when.snippets?.find((n) => snippets.has(n)) ??
				when.cssVars?.find((n) => cssVars.has(n)))
			: rule.from;
		if (!hit) continue;
		const line = props.get(hit)?.line ?? events.get(hit)?.line ?? cssVars.get(hit)?.line ?? snippets.get(hit) ?? usage.line;
		findings.push({
			effort: step.automatic ? 'auto' : 'manual',
			kind: step.automatic ? 'step' : 'manual',
			id: step.id,
			name: hit,
			component: rule.from,
			note: step.summary,
			...(step.automatic ? {} : { todo: step.kind }),
			file: usage.file,
			line,
			...(usage.via ? { via: usage.via } : {})
		});
	}

	const unknown: string[] = [];
	if (api) {
		const known = new Set([...api.props, ...api.events, ...api.snippets]);
		const check = (name: string) => {
			if (handled.has(name) || known.has(name) || IGNORED.has(name) || /^(aria|data)-/.test(name)) return;
			if (api.native && !/[A-Z]/.test(name) && !name.startsWith('on')) return;
			unknown.push(name);
		};
		for (const name of props.keys()) check(name);
		for (const name of events.keys()) check(name);
		for (const name of usage.snippets) check(name);
		if (usage.children && !known.has('children')) unknown.push('children');
	}
	return { findings, general, app, unknown };
}
