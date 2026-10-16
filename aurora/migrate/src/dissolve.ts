import { basename, dirname, join, relative, resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import { attrExpression, attrText, Editor, isReference, visit } from './ast.ts';
import { Lines } from './files.ts';
import type { RuleIndex } from './rules.ts';
import type { Node } from './svelte.ts';

const LIB = '@likable-hair/svelte';
const WRAPPER = /^Standard[A-Z]\w*\.svelte$/;
const LAYOUT_VAR = /-(?:(?:min|max)-)?width$|-margin(?:-(?:top|right|bottom|left))?$|-display$|-flex(?:-(?:grow|shrink|basis))?$|-align-self$/;
const TRIVIAL = new Set(['undefined', 'null', 'false', "''", '""', '``']);

export interface Recipe {
	to?: string;
	manual?: string;
	values?: Record<string, string>;
	extra?: Record<string, string>;
	flag?: string;
}

export const RECIPES: Record<string, Record<string, Recipe>> = {
	Button: {
		style: {
			to: 'variant',
			values: { primary: 'primary', secondary: 'secondary', danger: 'danger', static: 'secondary', icon: 'secondary' },
			extra: { icon: 'buttonType="text"' }
		},
		href: { to: 'href' }
	},
	SimpleTextField: {
		error: { to: 'state', flag: 'error' },
		hint: { to: 'hint' },
		valueRequired: { manual: 'turned the field red while empty: set `state` from the value' }
	},
	Autocomplete: { error: { to: 'state', flag: 'error' }, hint: { to: 'hint' } },
	Select: { error: { to: 'state', flag: 'error' }, hint: { to: 'hint' } },
	Textarea: { error: { to: 'state', flag: 'error' }, hint: { to: 'hint' } },
	Dialog: { title: { to: 'title' } }
};

type Handling =
	| { kind: 'forward'; to: string; bind: boolean }
	| { kind: 'recipe'; recipe: Recipe }
	| { kind: 'layout'; to: string }
	| { kind: 'look' }
	| { kind: 'children' }
	| { kind: 'unknown'; reason: string };

interface WrapperProp {
	name: string;
	local: string;
	fallback?: string;
	handling: Handling;
}

interface Fixed {
	name: string;
	text: string;
	afterRest: boolean;
}

export interface WrapperPlan {
	path: string;
	rel: string;
	name: string;
	target: string;
	props: Map<string, WrapperProp>;
	rest: boolean;
	fixed: Fixed[];
	ownStyles: Set<string>;
	dropped: string[];
	children: boolean;
	blockers: string[];
}

export interface WrapperSummary {
	file: string;
	target?: string;
	usages: number;
	dissolved: number;
	deleted: boolean;
	blockers: string[];
	dropped: string[];
	props: { name: string; handling: string }[];
}

export interface DissolveEntry {
	file: string;
	line: number;
	wrapper: string;
	kind: string;
	name: string;
	to?: string;
	note?: string;
}

export interface DissolveResult {
	texts: Map<string, string>;
	deleted: string[];
	wrappers: WrapperSummary[];
	changes: DissolveEntry[];
	skipped: (DissolveEntry & { reason: string })[];
}

const isLib = (source: string) => source === LIB || source.startsWith(`${LIB}/`);
const src = (text: string, node: Node) => text.slice(node.start, node.end);

function references(root: unknown, names: Set<string>): Node[] {
	const out: Node[] = [];
	visit(root, (node, parent, key) => {
		if (node.type === 'Identifier' && names.has(node.name) && isReference(node, parent, key)) out.push(node);
	});
	return out;
}

function parseSvelte(text: string): Node | undefined {
	try {
		return parse(text, { modern: true }) as unknown as Node;
	} catch {
		return undefined;
	}
}

function libComponents(index: RuleIndex) {
	return new Set([...index.v4Components, ...Object.keys(index.rules.v5.components)]);
}

function describe(node: Node, text: string) {
	const open = text.slice(node.start, Math.min(node.end, text.indexOf('>', node.start) + 1));
	return open.replace(/\s+/g, ' ').slice(0, 90);
}

export function planWrapper(path: string, rel: string, text: string, index: RuleIndex): WrapperPlan {
	const plan: WrapperPlan = {
		path,
		rel,
		name: basename(path, '.svelte'),
		target: '',
		props: new Map(),
		rest: false,
		fixed: [],
		ownStyles: new Set(),
		dropped: [],
		children: false,
		blockers: []
	};
	const ast = parseSvelte(text);
	if (!ast) {
		plan.blockers.push('does not parse');
		return plan;
	}
	const program = ast.instance?.content as Node | undefined;
	const components = libComponents(index);
	const libLocals = new Map<string, string>();
	const derived = new Map<string, Node>();
	const functions = new Map<string, Node>();
	const logic: Node[] = [];
	let propsPattern: Node | undefined;
	let restLocal: string | undefined;

	for (const statement of (program?.body ?? []) as Node[]) {
		if (statement.type === 'ImportDeclaration') {
			if (!isLib(statement.source.value)) continue;
			for (const spec of statement.specifiers as Node[]) {
				if (spec.type === 'ImportSpecifier') {
					const imported = spec.imported.name ?? spec.imported.value;
					if (components.has(imported)) libLocals.set(spec.local.name, imported);
				} else if (spec.type === 'ImportDefaultSpecifier') {
					const base = basename(statement.source.value).replace(/\.svelte$/, '');
					if (components.has(base)) libLocals.set(spec.local.name, base);
				}
			}
			continue;
		}
		if (statement.type === 'ExportNamedDeclaration' && statement.declaration?.type === 'VariableDeclaration') {
			plan.blockers.push('Svelte 4 syntax (`export let`): run `npx sv migrate svelte-5` first');
			continue;
		}
		if (statement.type === 'VariableDeclaration') {
			for (const decl of statement.declarations as Node[]) {
				const init = decl.init as Node | undefined;
				const callee = init?.type === 'CallExpression' ? init.callee : undefined;
				const calleeName = callee?.type === 'Identifier' ? callee.name : callee?.type === 'MemberExpression' ? `${callee.object.name}.${callee.property.name}` : undefined;
				if (calleeName === '$props') {
					if (decl.id.type !== 'ObjectPattern') plan.blockers.push('`$props()` is not destructured');
					else propsPattern = decl.id;
				} else if ((calleeName === '$derived' || calleeName === '$derived.by') && decl.id.type === 'Identifier')
					derived.set(decl.id.name, init!.arguments[0]);
				else if (init) logic.push(init);
			}
			continue;
		}
		if (statement.type === 'FunctionDeclaration' && statement.id) {
			functions.set(statement.id.name, statement);
			continue;
		}
		if (/^TS|^Export/.test(statement.type)) continue;
		logic.push(statement);
	}
	if (!propsPattern && !plan.blockers.length) plan.blockers.push('no `$props()` (Svelte 4 syntax: run `npx sv migrate svelte-5` first)');

	const declared: { name: string; local: string; fallback?: Node }[] = [];
	for (const property of (propsPattern?.properties ?? []) as Node[]) {
		if (property.type === 'RestElement') {
			restLocal = property.argument.name;
			continue;
		}
		const name = property.key.name ?? property.key.value;
		let value = property.value as Node;
		let fallback: Node | undefined;
		if (value.type === 'AssignmentPattern') {
			fallback = value.right;
			value = value.left;
		}
		if (fallback?.type === 'CallExpression' && fallback.callee.name === '$bindable') fallback = fallback.arguments[0];
		if (value.type !== 'Identifier') {
			plan.blockers.push(`prop \`${name}\` is destructured further`);
			continue;
		}
		declared.push({ name, local: value.name, fallback });
	}
	const byLocal = new Map(declared.map((d) => [d.local, d.name]));
	const tracked = new Set([...byLocal.keys(), ...derived.keys(), ...functions.keys()]);

	type Sink = { forward?: { to: string; bind: boolean }; layout?: string; look?: boolean; unknown?: string; soft?: boolean };
	const sinks = new Map<string, Sink[]>(declared.map((d) => [d.name, []]));
	const expanding = new Set<string>();
	const sink = (root: unknown, entry: Sink | ((name: string) => Sink)) => {
		for (const ref of references(root, tracked)) {
			const local = ref.name as string;
			if (byLocal.has(local)) {
				sinks.get(byLocal.get(local)!)!.push(typeof entry === 'function' ? entry(byLocal.get(local)!) : entry);
				continue;
			}
			if (expanding.has(local)) continue;
			expanding.add(local);
			if (derived.has(local)) sink(derived.get(local), entry);
			else if (functions.has(local)) sink(functions.get(local)!.body, entry);
			expanding.delete(local);
		}
	};
	for (const node of logic) {
		const found = references(node, tracked);
		if (found.length) sink(node, { unknown: 'used by the wrapper script' });
		else if (node.type === 'ExpressionStatement') plan.blockers.push(`the wrapper runs code: \`${src(text, node).slice(0, 60)}\``);
	}

	const libNodes: Node[] = [];
	visit(ast.fragment, (node) => {
		if (node.type === 'Component' && libLocals.has(node.name)) libNodes.push(node);
	});
	const spreadsRest = (node: Node) =>
		(node.attributes as Node[]).some((a) => a.type === 'SpreadAttribute' && a.expression.type === 'Identifier' && a.expression.name === restLocal);
	const element = libNodes.find(spreadsRest) ?? (libNodes.length === 1 ? libNodes[0] : undefined);
	if (!element) {
		plan.blockers.push(libNodes.length ? 'more than one library component and none receives the rest props' : 'does not wrap a library component');
		return finish(plan, declared, sinks, text, index);
	}
	plan.target = libLocals.get(element.name)!;
	const recipes = RECIPES[plan.target] ?? {};
	const covered = (where: string) => (name: string): Sink => (recipes[name]?.to ? {} : { unknown: `used in ${where}`, soft: true });

	const parents = new Map<Node, Node>();
	visit(ast.fragment, (node, parent) => {
		if (parent) parents.set(node, parent);
	});
	const onPath = new Set<Node>();
	for (let node: Node | undefined = element; node; node = parents.get(node)) onPath.add(node);

	const walk = (nodes: Node[], zone: 'path' | 'covered', where: string) => {
		for (const node of nodes) {
			if (node.type === 'Text' || node.type === 'Comment') {
				if (zone === 'path' && node.type === 'Text' && node.data.trim()) plan.dropped.push(`text "${node.data.trim().slice(0, 40)}"`);
				continue;
			}
			if (zone === 'covered' || !onPath.has(node)) {
				if (zone === 'path') plan.dropped.push(describe(node, text));
				sink(node, covered(where));
				continue;
			}
			if (node === element) continue;
			if (node.type === 'RegularElement') {
				plan.dropped.push(`wrapping ${describe(node, text)}`);
				sink(node.attributes, covered(`the wrapping <${node.name}>`));
				walk(node.fragment.nodes, 'path', where);
			} else if (node.type === 'IfBlock') {
				sink(node.test, covered('an {#if} around the component'));
				const inside = onPath.has(node.consequent) ? node.consequent : node.alternate;
				const other = inside === node.consequent ? node.alternate : node.consequent;
				if (other) sink(other, covered('the other branch of the {#if}'));
				if (other?.nodes?.some((n: Node) => n.type !== 'Text' || n.data.trim())) plan.dropped.push('the other branch of the {#if} around the component');
				walk(inside.nodes, 'path', where);
			} else if (node.type === 'Fragment') walk(node.nodes, 'path', where);
			else plan.blockers.push(`the component is inside ${node.type}`);
		}
	};
	walk(ast.fragment.nodes, 'path', 'markup around the component');

	const attrs = element.attributes as Node[];
	const restIndex = attrs.findIndex((a) => a.type === 'SpreadAttribute' && a.expression.type === 'Identifier' && a.expression.name === restLocal);
	plan.rest = restIndex >= 0;
	const removed = new Set((index.byV4.get(plan.target)?.props?.removed ?? []).map((r) => r.name));
	attrs.forEach((attr, i) => {
		const afterRest = plan.rest && i > restIndex;
		if (attr.type === 'SpreadAttribute') {
			if (i !== restIndex) plan.blockers.push(`spreads \`${src(text, attr)}\``);
			return;
		}
		if (attr.type === 'BindDirective') {
			const expression = attr.expression as Node;
			if (expression.type === 'Identifier' && byLocal.has(expression.name)) {
				sinks.get(byLocal.get(expression.name)!)!.push({ forward: { to: attr.name, bind: true } });
				return;
			}
			if (attr.name === 'this') plan.blockers.push('binds the component instance');
			else sink(expression, { unknown: `bound to \`${attr.name}\`` });
			return;
		}
		if (attr.type !== 'Attribute') {
			plan.blockers.push(`uses \`${src(text, attr)}\``);
			return;
		}
		const name = attr.name as string;
		const expression = attrExpression(attr);
		const found = references(attr, tracked);
		if (name.startsWith('--')) {
			plan.ownStyles.add(name);
			const layout = LAYOUT_VAR.test(name);
			if (!found.length) {
				if (layout) plan.fixed.push({ name, text: src(text, attr), afterRest });
				else plan.dropped.push(src(text, attr).replace(/\s+/g, ' '));
				return;
			}
			if (layout && expression?.type === 'Identifier' && byLocal.has(expression.name)) {
				sinks.get(byLocal.get(expression.name)!)!.push({ layout: name });
				return;
			}
			plan.dropped.push(src(text, attr).replace(/\s+/g, ' '));
			sink(attr, { look: true });
			return;
		}
		if (found.some((ref) => functions.has(ref.name))) {
			plan.blockers.push(`the wrapper handles \`${name}\``);
			return;
		}
		if (expression?.type === 'Identifier' && byLocal.has(expression.name)) {
			sinks.get(byLocal.get(expression.name)!)!.push({ forward: { to: name, bind: false } });
			return;
		}
		if (name === 'class' && Array.isArray(attr.value)) {
			const parts = attr.value as Node[];
			const tags = parts.filter((p) => p.type === 'ExpressionTag');
			const literal = parts.filter((p) => p.type === 'Text').map((p) => p.data.trim()).filter(Boolean).join(' ');
			const own = tags.length === 1 ? references(tags[0].expression, tracked) : [];
			if (own.length === 1 && byLocal.get(own[0].name) === 'class') {
				sinks.get('class')!.push({ forward: { to: 'class', bind: false } });
				if (literal) plan.dropped.push(`class "${literal}"`);
				return;
			}
		}
		if (!found.length) {
			if (removed.has(name)) plan.dropped.push(src(text, attr).replace(/\s+/g, ' '));
			else plan.fixed.push({ name, text: src(text, attr), afterRest });
			return;
		}
		if (name === 'class' || name === 'style') {
			plan.dropped.push(src(text, attr).replace(/\s+/g, ' '));
			sink(attr, { look: true });
			return;
		}
		sink(attr, { unknown: `computed into \`${name}\`` });
	});

	const content = (element.fragment?.nodes ?? []) as Node[];
	const childrenLocal = declared.find((d) => d.name === 'children')?.local;
	let renderTag: Node | undefined;
	visit(element.fragment, (node) => {
		if (renderTag) return false;
		if (node.type === 'SnippetBlock') return false;
		if (node.type === 'RenderTag') {
			const call = node.expression.type === 'ChainExpression' ? node.expression.expression : node.expression;
			if (call.callee?.type === 'Identifier' && call.callee.name === childrenLocal) renderTag = node;
		} else if (node.type === 'SlotElement' && !(node.attributes as Node[]).some((a) => a.name === 'name')) renderTag = node;
	});
	plan.children = !!renderTag;
	const childPath = new Set<Node>();
	for (let node: Node | undefined = renderTag; node && node !== element; node = parents.get(node)) childPath.add(node);
	const walkContent = (nodes: Node[]) => {
		for (const node of nodes) {
			if (node.type === 'Comment' || (node.type === 'Text' && !node.data.trim())) continue;
			if (node.type === 'SnippetBlock') {
				plan.dropped.push(`snippet \`${node.expression.name}\` drawn by the wrapper (the library draws its own)`);
				sink(node, covered(`the snippet \`${node.expression.name}\``));
				continue;
			}
			if (!childPath.has(node)) {
				plan.dropped.push(`content ${describe(node, text)}`);
				sink(node, covered('the content around the children'));
				continue;
			}
			if (node === renderTag) continue;
			if (node.type === 'RegularElement') {
				plan.dropped.push(`element ${describe(node, text)} around the children`);
				sink(node.attributes, { look: true });
				walkContent(node.fragment.nodes);
			} else if (node.type === 'IfBlock') {
				sink(node.test, covered('an {#if} around the children'));
				const inside = childPath.has(node.consequent) ? node.consequent : node.alternate;
				const other = inside === node.consequent ? node.alternate : node.consequent;
				if (other) sink(other, covered('the other branch of the {#if} around the children'));
				walkContent(inside.nodes);
			} else if (node.type === 'Fragment') walkContent(node.nodes);
			else plan.blockers.push(`the children are inside ${node.type}`);
		}
	};
	walkContent(content);
	return finish(plan, declared, sinks, text, index);
}

function finish(
	plan: WrapperPlan,
	declared: { name: string; local: string; fallback?: Node }[],
	sinks: Map<string, { forward?: { to: string; bind: boolean }; layout?: string; look?: boolean; unknown?: string; soft?: boolean }[]>,
	text: string,
	index: RuleIndex
): WrapperPlan {
	const recipes = RECIPES[plan.target] ?? {};
	const removed = new Set((index.byV4.get(plan.target)?.props?.removed ?? []).map((r) => r.name));
	for (const { name, local, fallback } of declared) {
		const list = sinks.get(name) ?? [];
		const forwards = [...new Set(list.filter((s) => s.forward).map((s) => `${s.forward!.bind ? 'bind:' : ''}${s.forward!.to}`))];
		const unknown = list.find((s) => s.unknown && !(s.soft && (forwards.length || name === 'children')))?.unknown;
		const layout = list.find((s) => s.layout)?.layout;
		let handling: Handling;
		if (name === 'children' && plan.children) handling = { kind: 'children' };
		else if (recipes[name]?.manual) handling = { kind: 'unknown', reason: recipes[name].manual! };
		else if (recipes[name]) handling = { kind: 'recipe', recipe: recipes[name] };
		else if (unknown) handling = { kind: 'unknown', reason: unknown };
		else if (forwards.length > 1) handling = { kind: 'unknown', reason: `passed as ${forwards.join(' and ')}` };
		else if (forwards.length && removed.has(forwards[0].replace(/^bind:/, ''))) {
			handling = { kind: 'look' };
			plan.dropped.push(`\`${name}\` (passed as \`${forwards[0]}\`, which v5 removed)`);
		} else if (forwards.length) {
			const bind = forwards[0].startsWith('bind:');
			handling = { kind: 'forward', to: forwards[0].replace(/^bind:/, ''), bind };
		} else if (layout) handling = { kind: 'layout', to: layout };
		else handling = { kind: 'look' };
		const value = fallback && (fallback.type === 'Literal' || fallback.type === 'TemplateLiteral') ? src(text, fallback) : undefined;
		plan.props.set(name, { name, local, fallback: value, handling });
	}
	return plan;
}

function resolveImport(dir: string, from: string, source: string): string | undefined {
	if (source.startsWith('$lib/')) return join(dir, 'src/lib', source.slice(5));
	if (source.startsWith('.')) return resolve(dirname(from), source);
	return undefined;
}

function literalOf(attr: Node): string | true | undefined {
	if (attr.value === true) return true;
	const text = attrText(attr);
	if (text !== undefined) return text;
	const expression = attrExpression(attr);
	if (expression?.type === 'Literal' && typeof expression.value === 'string') return expression.value;
	return undefined;
}

function mapExpression(text: string, expression: Node, values: Record<string, string>, extra: Record<string, string>): string | undefined {
	const literals: Node[] = [];
	let ok = true;
	visit(expression, (node) => {
		if (node.type === 'Literal' && typeof node.value === 'string') {
			if (!(node.value in values) || node.value in extra) ok = false;
			literals.push(node);
			return false;
		}
	});
	if (!ok || !literals.length) return undefined;
	const leaves = (node: Node): boolean =>
		node.type === 'Literal' ||
		(node.type === 'ConditionalExpression' && leaves(node.consequent) && leaves(node.alternate)) ||
		(node.type === 'LogicalExpression' && node.operator !== '&&' && leaves(node.right));
	if (!leaves(expression)) return undefined;
	let out = '';
	let pos = expression.start;
	for (const node of literals.sort((a, b) => a.start - b.start)) {
		out += text.slice(pos, node.start) + `'${values[node.value]}'`;
		pos = node.end;
	}
	return out + text.slice(pos, expression.end);
}

function v5Default(index: RuleIndex, target: string, prop: string) {
	const raw = index.rules.v5.components[target]?.defaults[prop];
	return raw?.replace(/^['"]|['"]$/g, '');
}

interface Rewrite {
	attrs: { node: Node; text: string | null }[];
	added: string[];
	notes: { kind: string; name: string; to?: string; note?: string }[];
}

function rewriteUsage(text: string, usage: Node, plan: WrapperPlan, index: RuleIndex): Rewrite | string {
	const out: Rewrite = { attrs: [], added: [], notes: [] };
	const attrs = usage.attributes as Node[];
	const passed = new Set<string>();
	const lateNames = new Set(plan.fixed.filter((f) => f.afterRest).map((f) => f.name));
	const spread = attrs.some((a) => a.type === 'SpreadAttribute');
	for (const attr of attrs) {
		if (attr.type === 'SpreadAttribute') continue;
		if (attr.type !== 'Attribute' && attr.type !== 'BindDirective') {
			if (attr.type === 'OnDirective' || attr.type === 'LetDirective') return `uses \`${src(text, attr).split('=')[0]}\` (Svelte 4 syntax)`;
			continue;
		}
		const name = attr.name as string;
		if (name.startsWith('--')) {
			if (plan.ownStyles.has(name)) {
				out.attrs.push({ node: attr, text: null });
				out.notes.push({ kind: 'wrapper-style-ignored', name, note: 'the wrapper set its own value, so this one never applied' });
			}
			continue;
		}
		const prop = plan.props.get(name);
		if (!prop) {
			if (lateNames.has(name)) {
				out.attrs.push({ node: attr, text: null });
				out.notes.push({ kind: 'wrapper-prop-ignored', name, note: 'the wrapper set its own value after the rest props' });
			}
			continue;
		}
		passed.add(name);
		const expression = attrExpression(attr);
		const value = attr.type === 'BindDirective' ? `{${src(text, attr.expression)}}` : attr.value === true ? undefined : src(text, attr).slice(src(text, attr).indexOf('=') + 1);
		const valueText = (to: string) => (value === undefined ? to : `${to}=${value.startsWith('{') || /^["']/.test(value) ? value : `{${value}}`}`);
		const h = prop.handling;
		if (h.kind === 'unknown') return `\`${name}\` ${h.reason}`;
		if (h.kind === 'children') continue;
		if (h.kind === 'look') {
			out.attrs.push({ node: attr, text: null });
			out.notes.push({ kind: 'wrapper-look', name, note: 'look of the wrapper, not carried over' });
			continue;
		}
		if (h.kind === 'layout') {
			out.attrs.push({ node: attr, text: valueText(h.to) });
			out.notes.push({ kind: 'wrapper-prop', name, to: h.to });
			continue;
		}
		if (h.kind === 'forward') {
			if (attr.type === 'BindDirective') {
				const bind = h.bind;
				if (bind && h.to === name) continue;
				const same = attr.expression.type === 'Identifier' && attr.expression.name === h.to;
				out.attrs.push({ node: attr, text: bind ? (same ? `bind:${h.to}` : `bind:${h.to}=${value}`) : same ? `{${h.to}}` : `${h.to}=${value}` });
				if (!bind) out.notes.push({ kind: 'wrapper-bind-one-way', name, to: h.to, note: 'the wrapper never wrote it back' });
				else if (h.to !== name) out.notes.push({ kind: 'wrapper-prop', name, to: h.to });
			} else if (h.to !== name) {
				out.attrs.push({ node: attr, text: valueText(h.to) });
				out.notes.push({ kind: 'wrapper-prop', name, to: h.to });
			}
			continue;
		}
		const r = h.recipe;
		const to = r.to!;
		if (r.flag) {
			const literal = literalOf(attr);
			const v = attr.type === 'BindDirective' ? src(text, attr.expression) : expression ? src(text, expression) : undefined;
			let next: string | null;
			if (literal === true || literal === 'true') next = `${to}="${r.flag}"`;
			else if (literal === 'false' || (expression?.type === 'Literal' && expression.value === false)) next = null;
			else if (v) next = `${to}={${v} ? '${r.flag}' : undefined}`;
			else return `\`${name}\` has a value the tool cannot read`;
			out.attrs.push({ node: attr, text: next });
			out.notes.push({ kind: 'wrapper-prop', name, to: to, note: attr.type === 'BindDirective' ? 'was bound, now one-way' : undefined });
			continue;
		}
		if (r.values) {
			const literal = literalOf(attr);
			if (typeof literal === 'string') {
				if (!(literal in r.values)) return `\`${name}="${literal}"\` has no counterpart`;
				const mapped = r.values[literal];
				const parts = [mapped === v5Default(index, plan.target, to) ? '' : `${to}="${mapped}"`, r.extra?.[literal] ?? ''].filter(Boolean);
				out.attrs.push({ node: attr, text: parts.length ? parts.join(' ') : null });
				out.notes.push({ kind: 'wrapper-prop', name, to: parts.join(' ') || `(default ${to})` });
				continue;
			}
			if (!expression) return `\`${name}\` has a value the tool cannot read`;
			const mapped = mapExpression(text, expression, r.values, r.extra ?? {});
			if (mapped) {
				out.attrs.push({ node: attr, text: `${to}={${mapped}}` });
				out.notes.push({ kind: 'wrapper-prop', name, to: to });
				continue;
			}
			const same = Object.keys(r.values).filter((k) => r.values![k] === k && !r.extra?.[k]);
			const other = Object.keys(r.values).filter((k) => !same.includes(k));
			if (!same.length) return `\`${name}={${src(text, expression)}}\`: only literal values can be mapped`;
			out.attrs.push({ node: attr, text: `${to}={${src(text, expression)}}` });
			out.notes.push({
				kind: 'wrapper-value',
				name,
				to: to,
				note: `${same.map((v) => `'${v}'`).join(', ')} stay the same${other.length ? `; ${other.map((v) => `'${v}' → ${[r.values![v] !== v ? `'${r.values![v]}'` : '', r.extra?.[v] ?? ''].filter(Boolean).join(' + ')}`).join(', ')} must be mapped by hand (svelte-check flags them)` : ''}`
			});
			continue;
		}
		out.attrs.push({ node: attr, text: attr.type === 'BindDirective' ? `${to}=${value}` : valueText(to) });
		out.notes.push({ kind: 'wrapper-prop', name, to: to });
	}
	for (const child of (usage.fragment?.nodes ?? []) as Node[]) {
		if (child.type !== 'SnippetBlock') continue;
		const prop = plan.props.get(child.expression.name);
		if (!prop) continue;
		if (prop.handling.kind === 'forward' && prop.handling.to === prop.name) continue;
		return `snippet \`${prop.name}\`: ${prop.handling.kind === 'unknown' ? prop.handling.reason : 'handled by the wrapper'}`;
	}
	const hasContent = ((usage.fragment?.nodes ?? []) as Node[]).some((n) => n.type !== 'SnippetBlock' && !(n.type === 'Text' && !n.data.trim()));
	if (hasContent && !plan.children) return 'has children, which the wrapper did not show';
	for (const fixed of plan.fixed) {
		const own = attrs.some((a) => a.name === fixed.name);
		if (own && !fixed.afterRest) continue;
		out.added.push(fixed.text);
	}
	for (const prop of plan.props.values()) {
		if (passed.has(prop.name) || spread) continue;
		const h = prop.handling;
		if (h.kind === 'recipe' && h.recipe.values && prop.fallback) {
			const value = prop.fallback.replace(/^['"`]|['"`]$/g, '');
			const mapped = h.recipe.values[value];
			if (mapped && mapped !== v5Default(index, plan.target, h.recipe.to!)) out.added.push(`${h.recipe.to}="${mapped}"`);
			if (h.recipe.extra?.[value]) out.added.push(h.recipe.extra[value]);
			continue;
		}
		if (!prop.fallback || TRIVIAL.has(prop.fallback)) continue;
		if (h.kind === 'forward' || h.kind === 'layout') {
			const literal = /^['"`]/.test(prop.fallback) ? `"${prop.fallback.slice(1, -1)}"` : `{${prop.fallback}}`;
			out.added.push(`${h.to}=${literal}`);
			out.notes.push({ kind: 'wrapper-default', name: prop.name, to: `${h.to}=${literal}`, note: 'default of the wrapper' });
		}
	}
	if (spread) {
		const special = [...plan.props.values()].filter((p) => p.handling.kind !== 'forward' && p.handling.kind !== 'children').map((p) => p.name);
		if (special.length)
			out.notes.push({ kind: 'wrapper-spread', name: '...', note: `the spread may carry ${special.map((s) => `\`${s}\``).join(', ')}, which the wrapper handled itself` });
	}
	return out;
}

function topLevelNames(programs: Node[]) {
	const names = new Map<string, Node>();
	for (const program of programs)
		for (const statement of program.body as Node[]) {
			if (statement.type === 'ImportDeclaration') for (const spec of statement.specifiers as Node[]) names.set(spec.local.name, statement);
			else if (statement.type === 'VariableDeclaration')
				for (const decl of statement.declarations as Node[]) if (decl.id.type === 'Identifier') names.set(decl.id.name, statement);
			if ((statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') && statement.id) names.set(statement.id.name, statement);
		}
	return names;
}

function insertAttrs(text: string, edit: Editor, usage: Node, added: string[]) {
	if (!added.length) return;
	const attrs = usage.attributes as Node[];
	const at = usage.start + 1 + usage.name.length;
	if (!attrs.length || !/\n/.test(text.slice(at, attrs[0].start))) {
		edit.insert(at, added.map((a) => ` ${a}`).join(''));
		return;
	}
	const lineStart = text.lastIndexOf('\n', attrs[0].start) + 1;
	const indent = /^[ \t]*/.exec(text.slice(lineStart))![0];
	edit.insert(at, added.map((a) => `\n${indent}${a}`).join(''));
}

function removeRange(text: string, node: Node): [number, number] {
	let start = node.start;
	while (start > 0 && (text[start - 1] === ' ' || text[start - 1] === '\t')) start--;
	let end = node.end;
	if (text[start - 1] === '\n') {
		let after = end;
		while (after < text.length && (text[after] === ' ' || text[after] === '\t')) after++;
		if (text[after] === '\n' || after === text.length) return [start - 1, end];
	}
	if (text[start - 1] !== '\n') return [start, end];
	return [node.start, end];
}

function rewriteFile(
	dir: string,
	path: string,
	rel: string,
	text: string,
	plans: Map<string, WrapperPlan>,
	index: RuleIndex,
	result: DissolveResult,
	counts: Map<string, { usages: number; dissolved: number }>
): string {
	if (!text.includes('Standard')) return text;
	const ast = parseSvelte(text);
	if (!ast) return text;
	const programs = [ast.instance?.content, ast.module?.content].filter(Boolean) as Node[];
	const lines = new Lines(text);
	const edit = new Editor(text);
	const names = topLevelNames(programs);
	const libImport = programs.flatMap((p) => p.body as Node[]).find((s) => s.type === 'ImportDeclaration' && s.source.value === LIB && s.importKind !== 'type' && s.specifiers.every((x: Node) => x.type === 'ImportSpecifier'));
	const libNames = new Map<string, string>();
	for (const program of programs)
		for (const s of program.body as Node[])
			if (s.type === 'ImportDeclaration' && s.source.value === LIB && s.importKind !== 'type')
				for (const spec of s.specifiers as Node[]) if (spec.type === 'ImportSpecifier') libNames.set(spec.imported.name ?? spec.imported.value, spec.local.name);
	const addImports: string[] = [];

	for (const program of programs)
		for (const statement of program.body as Node[]) {
			if (statement.type !== 'ImportDeclaration' || statement.specifiers.length !== 1 || statement.specifiers[0].type !== 'ImportDefaultSpecifier') continue;
			const target = resolveImport(dir, path, statement.source.value);
			const plan = target ? plans.get(target) : undefined;
			if (!plan) continue;
			const local = statement.specifiers[0].local.name as string;
			const count = counts.get(plan.path)!;
			const usages: Node[] = [];
			const others: Node[] = [];
			const typeRefs: Node[] = [];
			visit(ast, (node, parent, key) => {
				if (node.type === 'Component' && node.name === local) usages.push(node);
				else if (node.type === 'Identifier' && node.name === local && node !== statement.specifiers[0].local && isReference(node, parent, key)) {
					if (parent?.type === 'TSTypeQuery') typeRefs.push(node);
					else others.push(node);
				}
			});
			count.usages += usages.length;
			const line = (node: Node) => lines.at(node.start);
			const skip = (node: Node, reason: string) =>
				result.skipped.push({ file: rel, line: line(node), wrapper: plan.name, kind: 'wrapper-usage', name: plan.name, reason });
			if (plan.blockers.length) {
				for (const usage of usages) skip(usage, plan.blockers[0]);
				continue;
			}
			let lib = libNames.get(plan.target);
			if (!lib) {
				const taken = names.get(plan.target);
				if (taken && taken !== statement) {
					for (const usage of usages) skip(usage, `\`${plan.target}\` is already a name in this file`);
					continue;
				}
				lib = plan.target;
			}
			let kept = others.length > 0;
			let done = 0;
			for (const node of others) skip(node, `\`${local}\` is used as a value`);
			for (const usage of usages) {
				const rewrite = rewriteUsage(text, usage, plan, index);
				if (typeof rewrite === 'string') {
					skip(usage, rewrite);
					kept = true;
					continue;
				}
				edit.replace(usage.start + 1, usage.start + 1 + local.length, lib);
				const close = text.lastIndexOf(`</${local}`, usage.end);
				if (close > usage.start && text.slice(usage.end - 2, usage.end) !== '/>') edit.replace(close + 2, close + 2 + local.length, lib);
				for (const { node, text: next } of rewrite.attrs) {
					if (next === null) {
						const [a, b] = removeRange(text, node);
						edit.replace(a, b, '');
					} else edit.replace(node.start, node.end, next);
				}
				insertAttrs(text, edit, usage, rewrite.added);
				count.dissolved++;
				done++;
				result.changes.push({ file: rel, line: line(usage), wrapper: plan.name, kind: 'wrapper-dissolved', name: plan.name, to: plan.target });
				for (const note of rewrite.notes) result.changes.push({ file: rel, line: line(usage), wrapper: plan.name, ...note });
			}
			if (!usages.length && !others.length && !typeRefs.length) {
				const [a, b] = removeRange(text, statement);
				edit.replace(a, b, '');
				continue;
			}
			if (!done && !typeRefs.length) continue;
			for (const node of typeRefs) {
				edit.replace(node.start, node.end, lib);
				const member = /^(?:<[^<>]*>)?\s*>\s*\[\s*(['"])(\w+)\1\s*\]/.exec(text.slice(node.end));
				const prop = member && plan.props.get(member[2]);
				const h = prop?.handling;
				const to = h?.kind === 'forward' ? h.to : h?.kind === 'recipe' ? h.recipe.to : undefined;
				if (!member || !to || to === member[2]) continue;
				const at = node.end + member.index + member[0].lastIndexOf(member[2]);
				edit.replace(at, at + member[2].length, to);
			}
			if (!libNames.has(plan.target)) {
				libNames.set(plan.target, lib);
				addImports.push(lib);
			}
			if (!kept) {
				const [a, b] = removeRange(text, statement);
				edit.replace(a, b, '');
			}
		}
	if (addImports.length) {
		if (libImport) {
			const last = libImport.specifiers[libImport.specifiers.length - 1];
			edit.insert(last.end, addImports.map((n) => `, ${n}`).join(''));
		} else {
			const program = (ast.instance?.content ?? ast.module?.content) as Node;
			const first = (program.body as Node[])[0];
			const indent = first ? /^[ \t]*/.exec(text.slice(text.lastIndexOf('\n', first.start) + 1))![0] : '\t';
			edit.insert(program.start, `\n${indent}import { ${addImports.join(', ')} } from '${LIB}';`);
		}
	}
	return edit.changed ? edit.toString() : text;
}

const IMPORT_SOURCE = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;

export function dissolve(dir: string, index: RuleIndex, texts: Map<string, string>): DissolveResult {
	const result: DissolveResult = { texts: new Map(texts), deleted: [], wrappers: [], changes: [], skipped: [] };
	const plans = new Map<string, WrapperPlan>();
	for (const [path, text] of texts) if (WRAPPER.test(basename(path))) plans.set(path, planWrapper(path, relative(dir, path), text, index));
	if (!plans.size) return result;
	const counts = new Map([...plans.keys()].map((p) => [p, { usages: 0, dissolved: 0 }]));
	for (const [path, text] of texts) {
		if (!path.endsWith('.svelte')) continue;
		const next = rewriteFile(dir, path, relative(dir, path), text, plans, index, result, counts);
		if (next !== text) result.texts.set(path, next);
	}
	const deleted = new Set<string>();
	for (let changed = true; changed; ) {
		changed = false;
		for (const path of plans.keys()) {
			if (deleted.has(path)) continue;
			const used = [...result.texts].some(([file, text]) => {
				if (file === path || deleted.has(file) || !/\.(svelte|ts|js)$/.test(file)) return false;
				for (const match of text.matchAll(IMPORT_SOURCE)) {
					const source = match[1].replace(/\?.*$/, '');
					if (resolveImport(dir, file, source) === path) return true;
				}
				return false;
			});
			if (!used) {
				deleted.add(path);
				changed = true;
			}
		}
	}
	result.deleted = [...deleted].sort();
	for (const path of deleted) result.texts.delete(path);
	for (const plan of plans.values()) {
		const count = counts.get(plan.path)!;
		result.wrappers.push({
			file: plan.rel,
			target: plan.target || undefined,
			usages: count.usages,
			dissolved: count.dissolved,
			deleted: deleted.has(plan.path),
			blockers: plan.blockers,
			dropped: plan.dropped,
			props: [...plan.props.values()].map((p) => ({
				name: p.name,
				handling:
					p.handling.kind === 'forward'
						? `${p.handling.bind ? 'bind:' : ''}${p.handling.to}`
						: p.handling.kind === 'recipe'
							? `→ ${p.handling.recipe.to}`
							: p.handling.kind === 'layout'
								? p.handling.to
								: p.handling.kind === 'unknown'
									? `kept: ${p.handling.reason}`
									: p.handling.kind
			}))
		});
	}
	result.wrappers.sort((a, b) => a.file.localeCompare(b.file));
	return result;
}
