import { basename, dirname, join, relative, resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import { attrExpression, attrText, Editor, isReference, visit } from './ast.ts';
import { readAliases } from './analyze.ts';
import { Lines } from './files.ts';
import type { RuleIndex } from './rules.ts';
import type { Node } from './svelte.ts';

const LIB = '@likable-hair/svelte';
const WRAPPERS = [/^Standard[A-Z]\w*\.svelte$/, /^LabelAnd[A-Z]\w*\.svelte$/];
const LAYOUT_VAR = /-(?:(?:min|max)-)?width$|-margin(?:-(?:top|right|bottom|left))?$|-display$|-flex(?:-(?:grow|shrink|basis))?$|-align-self$/;
const TRIVIAL = new Set(['undefined', 'null', 'false', "''", '""', '``']);
const BLOCKS: Record<string, string[]> = { Button: ['disabled', 'loading'] };
const NATIVE: Record<string, string> = { select: 'Select', textarea: 'Textarea' };
const KEEP_SHAPE = new Set(['filter', 'slice', 'sort', 'toSorted', 'reverse', 'toReversed']);

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
	| { kind: 'items'; to: string; keys: Record<string, string> }
	| { kind: 'look' }
	| { kind: 'children' }
	| { kind: 'unknown'; reason: string };

type Sink = {
	forward?: { to: string; bind: boolean };
	layout?: string;
	items?: Record<string, string>;
	look?: boolean;
	unknown?: string;
	soft?: boolean;
};

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
	inherited?: WrapperPlan;
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


const PARAGLIDE_RUNTIME = /(^|\/)paraglide\/runtime(\.js)?$/;
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

export function planWrapper(path: string, rel: string, text: string, index: RuleIndex, inherited?: WrapperPlan): WrapperPlan {
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
		blockers: [],
		inherited
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
	const topLevel = topLevelNames(program ? [program] : []);
	const locals = new Set([...topLevel.keys(), ...(restLocal ? [restLocal] : [])]);
	const isGetLocale = (node: Node | undefined) => {
		if (node?.type !== 'CallExpression' || node.arguments.length || node.callee.type !== 'Identifier') return false;
		const statement = topLevel.get(node.callee.name);
		return (
			statement?.type === 'ImportDeclaration' &&
			PARAGLIDE_RUNTIME.test(statement.source.value) &&
			(statement.specifiers as Node[]).some((s) => s.local.name === node.callee.name && s.imported?.name === 'getLocale')
		);
	};
	const followsParaglide = (expression: Node | undefined) => {
		if (isGetLocale(expression)) return true;
		if (expression?.type !== 'Identifier') return false;
		const statement = topLevel.get(expression.name);
		if (statement?.type !== 'VariableDeclaration') return false;
		const declaration = (statement.declarations as Node[]).find((d) => d.id.type === 'Identifier' && d.id.name === expression.name);
		let assigned = false;
		visit(program, (node) => {
			const target = node.type === 'AssignmentExpression' ? node.left : node.type === 'UpdateExpression' ? node.argument : undefined;
			if (target?.type === 'Identifier' && target.name === expression.name) assigned = true;
		});
		return !assigned && isGetLocale(declaration?.init);
	};
	const tracked = new Set([...byLocal.keys(), ...derived.keys(), ...functions.keys()]);

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
	const natives: Node[] = [];
	visit(ast.fragment, (node) => {
		if (node.type === 'Component' && libLocals.has(node.name)) libNodes.push(node);
		else if (node.type === 'RegularElement' && NATIVE[node.name] && components.has(NATIVE[node.name])) natives.push(node);
	});
	const spreadsRest = (node: Node) =>
		(node.attributes as Node[]).some((a) => a.type === 'SpreadAttribute' && a.expression.type === 'Identifier' && a.expression.name === restLocal);
	const bindsValue = (node: Node) =>
		(node.attributes as Node[]).some((a) => a.type === 'BindDirective' && a.name === 'value' && a.expression.type === 'Identifier' && byLocal.has(a.expression.name));
	const native = !libNodes.some(spreadsRest) && natives.length === 1 && bindsValue(natives[0]) ? natives[0] : undefined;
	const element = native ?? libNodes.find(spreadsRest) ?? (libNodes.length === 1 ? libNodes[0] : undefined);
	if (!element) {
		plan.blockers.push(libNodes.length ? 'more than one library component and none receives the rest props' : 'does not wrap a library component');
		return finish(plan, declared, sinks, text, index);
	}
	plan.target = native ? NATIVE[native.name] : libLocals.get(element.name)!;
	const recipes = RECIPES[plan.target] ?? {};
	const covered = (where: string) => (name: string): Sink => (recipes[name]?.to ? {} : { unknown: `used in ${where}`, soft: true });

	const parents = new Map<Node, Node>();
	visit(ast.fragment, (node, parent) => {
		if (parent) parents.set(node, parent);
	});
	const onPath = new Set<Node>();
	for (let node: Node | undefined = element; node; node = parents.get(node)) onPath.add(node);

	const api = index.rules.v5.components[plan.target];
	const accepts = (name: string) => !!api && (api.props.includes(name) || (api.native && (name === 'id' || name === 'name')));
	const sinkAttributes = (node: Node, entry: Sink | ((name: string) => Sink)) => {
		for (const attr of node.attributes as Node[])
			sink(attr, attr.type === 'OnDirective' || /^on[a-z]/.test(attr.name) ? { unknown: `handled by \`${attr.name}\` of <${node.name}>` } : entry);
	};
	const meaningful = (nodes: Node[]) => nodes.filter((n) => n.type !== 'Comment' && !(n.type === 'Text' && !n.data.trim()));
	const ownLabel = (node: Node, local?: string): boolean => {
		if (node.type === 'IfBlock' && !local) {
			let test = node.test as Node;
			while (test.type === 'UnaryExpression' && test.operator === '!' && test.argument.type === 'UnaryExpression' && test.argument.operator === '!') test = test.argument.argument;
			const inside = meaningful(node.consequent.nodes);
			return !node.alternate && test.type === 'Identifier' && byLocal.has(test.name) && inside.length === 1 && ownLabel(inside[0], test.name);
		}
		if (node.type !== 'RegularElement' || node.name !== 'label' || !accepts('label')) return false;
		const content = meaningful(node.fragment.nodes);
		if (content.length !== 1 || content[0].type !== 'ExpressionTag') return false;
		const refs = references(content[0].expression, tracked);
		if (refs.length !== 1 || !byLocal.has(refs[0].name) || (local && refs[0].name !== local)) return false;
		sinks.get(byLocal.get(refs[0].name)!)!.push({ forward: { to: 'label', bind: false } });
		for (const attr of node.attributes as Node[])
			if (attr.type === 'Attribute' && attr.name === 'for') sink(attr, (name) => (accepts(name) ? { forward: { to: name, bind: false } } : { look: true }));
			else sink(attr, { look: true });
		plan.dropped.push(`${describe(node, text)} (the component draws its own \`label\`)`);
		return true;
	};

	const walk = (nodes: Node[], zone: 'path' | 'covered', where: string) => {
		for (const node of nodes) {
			if (node.type === 'Text' || node.type === 'Comment') {
				if (zone === 'path' && node.type === 'Text' && node.data.trim()) plan.dropped.push(`text "${node.data.trim().slice(0, 40)}"`);
				continue;
			}
			if (zone === 'path' && !onPath.has(node) && ownLabel(node)) continue;
			if (zone === 'covered' || !onPath.has(node)) {
				if (zone === 'path') plan.dropped.push(describe(node, text));
				sink(node, covered(where));
				continue;
			}
			if (node === element) continue;
			if (node.type === 'RegularElement') {
				plan.dropped.push(`wrapping ${describe(node, text)}`);
				sinkAttributes(node, covered(`the wrapping <${node.name}>`));
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

	const terms = (node: Node, operator: string): Node[] =>
		node.type === 'LogicalExpression' && node.operator === operator ? [...terms(node.left, operator), ...terms(node.right, operator)] : [node];
	const guardedBy = (fn: Node, event: string): string[] | undefined => {
		const params = fn.params as Node[];
		if (params.length !== 1 || params[0].type !== 'Identifier') return undefined;
		const forwards = (node: Node | undefined): boolean => {
			if (node?.type === 'BlockStatement') return node.body.length === 1 && forwards(node.body[0]);
			if (node?.type !== 'ExpressionStatement') return false;
			const call = node.expression.type === 'ChainExpression' ? node.expression.expression : node.expression;
			if (call.type !== 'CallExpression' || call.arguments.length !== 1 || call.arguments[0].type !== 'Identifier' || call.arguments[0].name !== params[0].name) return false;
			const callee = call.callee as Node;
			if (callee.type === 'Identifier') return byLocal.get(callee.name) === event;
			return callee.type === 'MemberExpression' && !callee.computed && callee.object.type === 'Identifier' && callee.object.name === restLocal && callee.property.name === event;
		};
		const exits = (node: Node | undefined): boolean =>
			node?.type === 'ReturnStatement' ? !node.argument : node?.type === 'BlockStatement' && node.body.length === 1 && exits(node.body[0]);
		const props: string[] = [];
		const body = fn.body.body as Node[];
		const test = body[0]?.type === 'IfStatement' && !body[0].alternate ? (body[0].test as Node) : undefined;
		if (test && body.length === 1 && forwards(body[0].consequent)) {
			for (const term of terms(test, '&&')) {
				if (term.type === 'Identifier' && byLocal.get(term.name) === event) continue;
				if (term.type !== 'UnaryExpression' || term.operator !== '!' || term.argument.type !== 'Identifier' || !byLocal.has(term.argument.name)) return undefined;
				props.push(byLocal.get(term.argument.name)!);
			}
		} else if (test && body.length === 2 && exits(body[0].consequent) && forwards(body[1])) {
			for (const term of terms(test, '||')) {
				if (term.type !== 'Identifier' || !byLocal.has(term.name)) return undefined;
				props.push(byLocal.get(term.name)!);
			}
		} else return undefined;
		return props.length ? props : undefined;
	};
	const guards: { event: string; props: string[] }[] = [];

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
		if (native && (attr.type === 'StyleDirective' || attr.type === 'ClassDirective')) {
			plan.dropped.push(src(text, attr).replace(/\s+/g, ' '));
			sink(attr, { look: true });
			return;
		}
		if (attr.type !== 'Attribute') {
			plan.blockers.push(`uses \`${src(text, attr)}\``);
			return;
		}
		const name = attr.name as string;
		const expression = attrExpression(attr);
		const found = references(attr, tracked);
		const own = !found.length && references(attr, locals).length > 0;
		if (name.startsWith('--')) {
			plan.ownStyles.add(name);
			const layout = LAYOUT_VAR.test(name);
			if (!found.length) {
				if (layout && !own) plan.fixed.push({ name, text: src(text, attr), afterRest });
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
			const fn = expression?.type === 'Identifier' ? functions.get(expression.name) : undefined;
			const props = fn && /^on[a-z]/.test(name) ? guardedBy(fn, name) : undefined;
			if (!props) {
				plan.blockers.push(`the wrapper handles \`${name}\``);
				return;
			}
			guards.push({ event: name, props });
			sinks.get(name)?.push({ forward: { to: name, bind: false } });
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
		if (own) {
			if (removed.has(name) || name === 'class' || name === 'style') plan.dropped.push(src(text, attr).replace(/\s+/g, ' '));
			else if ((name === 'lang' || name === 'locale') && followsParaglide(expression)) return;
			else plan.blockers.push(`\`${name}\` is computed from the wrapper's own values`);
			return;
		}
		if (!found.length) {
			if (removed.has(name) || (native && (name === 'class' || name === 'style'))) plan.dropped.push(src(text, attr).replace(/\s+/g, ' '));
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
				sinkAttributes(node, { look: true });
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
	const optionKeys = (nodes: Node[]) => {
		const each = nodes.length === 1 && nodes[0].type === 'EachBlock' && !nodes[0].fallback ? nodes[0] : undefined;
		if (!each || each.expression.type !== 'Identifier' || !byLocal.has(each.expression.name) || each.context?.type !== 'Identifier') return undefined;
		const field = (node: Node | undefined) =>
			node?.type === 'MemberExpression' && !node.computed && node.object.type === 'Identifier' && node.object.name === each.context.name ? (node.property.name as string) : undefined;
		const body = meaningful(each.body.nodes);
		const option = body.length === 1 && body[0].type === 'RegularElement' && body[0].name === 'option' ? body[0] : undefined;
		if (!option) return undefined;
		let value: string | undefined;
		for (const attr of option.attributes as Node[]) {
			if (attr.type === 'Attribute' && attr.name === 'value') value = field(attrExpression(attr));
			else if (attr.type !== 'StyleDirective' && !(attr.type === 'Attribute' && (attr.name === 'class' || attr.name === 'style'))) return undefined;
		}
		const shown = meaningful(option.fragment.nodes);
		const label = shown.length === 1 && shown[0].type === 'ExpressionTag' ? field(shown[0].expression) : undefined;
		if (!value || !label || value === label) return undefined;
		return { prop: byLocal.get(each.expression.name)!, keys: { [value]: 'value', [label]: 'label' } };
	};
	if (native) {
		const inside = meaningful(content);
		const options = native.name === 'select' ? optionKeys(inside) : undefined;
		if (options) sinks.get(options.prop)!.push({ items: options.keys });
		else if (inside.length) plan.blockers.push(`draws its own content inside <${native.name}>`);
	} else walkContent(content);
	finish(plan, declared, sinks, text, index);
	const blocks = BLOCKS[plan.target] ?? [];
	for (const guard of guards) {
		const covered = guard.props.every((name) => {
			const h = plan.props.get(name)?.handling;
			return h?.kind === 'forward' && blocks.includes(h.to);
		});
		if (!covered) plan.blockers.push(`the wrapper handles \`${guard.event}\``);
	}
	return plan;
}

function finish(
	plan: WrapperPlan,
	declared: { name: string; local: string; fallback?: Node }[],
	sinks: Map<string, Sink[]>,
	text: string,
	index: RuleIndex
): WrapperPlan {
	const recipes = RECIPES[plan.target] ?? {};
	const removed = new Set((index.byV4.get(plan.target)?.props?.removed ?? []).map((r) => r.name));
	for (const { name, local, fallback } of declared) {
		const list = sinks.get(name) ?? [];
		const forwards = [...new Set(list.filter((s) => s.forward).map((s) => `${s.forward!.bind ? 'bind:' : ''}${s.forward!.to}`))];
		const items = list.find((s) => s.items)?.items;
		const unknown = list.find((s) => s.unknown && !(s.soft && (forwards.length || items || name === 'children')))?.unknown;
		const layout = list.find((s) => s.layout)?.layout;
		let handling: Handling;
		if (name === 'children' && plan.children) handling = { kind: 'children' };
		else if (recipes[name]?.manual) handling = { kind: 'unknown', reason: recipes[name].manual! };
		else if (recipes[name]) handling = { kind: 'recipe', recipe: recipes[name] };
		else if (unknown) handling = { kind: 'unknown', reason: unknown };
		else if (items) handling = forwards.length ? { kind: 'unknown', reason: `passed as ${forwards.join(' and ')} and drawn as options` } : { kind: 'items', to: 'items', keys: items };
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

export function resolveImport(dir: string, from: string, source: string, aliases: [string, string][] = [['$lib', 'src/lib']]): string | undefined {
	if (source.startsWith('.')) return resolve(dirname(from), source);
	for (const [alias, target] of aliases) if (source.startsWith(`${alias}/`)) return join(dir, target, source.slice(alias.length));
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

function mapWithExtras(text: string, expression: Node, values: Record<string, string>, extra: Record<string, string>, fallback: (prop: string) => string | undefined): string[] | undefined {
	const literals: Node[] = [];
	const pure = (node: Node): boolean => {
		if (node.type === 'Literal' && typeof node.value === 'string' && node.value in values) return !!literals.push(node);
		return node.type === 'ConditionalExpression' && pure(node.consequent) && pure(node.alternate);
	};
	if (expression.type !== 'ConditionalExpression' || !pure(expression)) return undefined;
	const extras = new Map<string, Record<string, string>>();
	for (const node of literals) {
		const attr = extra[node.value];
		if (!attr) continue;
		const parsed = /^([\w-]+)="([^"]*)"$/.exec(attr);
		if (!parsed) return undefined;
		extras.set(parsed[1], { ...extras.get(parsed[1]), [node.value]: parsed[2] });
	}
	if (!extras.size) return undefined;
	const substitute = (pick: (literal: string) => string | undefined) => {
		let out = '';
		let pos = expression.start;
		for (const node of [...literals].sort((a, b) => a.start - b.start)) {
			const value = pick(node.value);
			if (value === undefined) return undefined;
			out += text.slice(pos, node.start) + `'${value}'`;
			pos = node.end;
		}
		return out + text.slice(pos, expression.end);
	};
	const parts = [substitute((literal) => values[literal])];
	for (const [prop, byLiteral] of extras) parts.push(`${prop}={${substitute((literal) => byLiteral[literal] ?? fallback(prop))}}`);
	return parts.every((part) => part && !part.includes('={undefined}')) ? (parts as string[]) : undefined;
}

function v5Default(index: RuleIndex, target: string, prop: string) {
	const raw = index.rules.v5.components[target]?.defaults[prop];
	return raw?.replace(/^['"]|['"]$/g, '');
}

type Edit = { start: number; end: number; text: string };

interface FileScope {
	declared: Map<string, Node>;
	props: Set<string>;
}

function fileScope(programs: Node[]): FileScope {
	const scope: FileScope = { declared: new Map(), props: new Set() };
	for (const program of programs)
		for (const statement of program.body as Node[]) {
			if (statement.type !== 'VariableDeclaration') continue;
			for (const decl of statement.declarations as Node[]) {
				if (decl.id.type === 'Identifier') scope.declared.set(decl.id.name, decl);
				else if (decl.id.type === 'ObjectPattern' && decl.init?.type === 'CallExpression' && decl.init.callee.name === '$props')
					for (const p of decl.id.properties as Node[]) {
						const value = p.type === 'RestElement' ? p.argument : p.value.type === 'AssignmentPattern' ? p.value.left : p.value;
						if (value.type === 'Identifier') scope.props.add(value.name);
					}
			}
		}
	return scope;
}

function relabel(text: string, root: Node, keys: Record<string, string>, scope: FileScope): { edits: Edit[]; chased: string[] } | string {
	const edits: Edit[] = [];
	const chased: string[] = [];
	const renames = Object.entries(keys).filter(([from, to]) => from !== to);
	const types = (annotation: Node) =>
		visit(annotation, (node) => {
			const key = node.type === 'TSPropertySignature' && !node.computed ? (node.key.name ?? node.key.value) : undefined;
			if (key && keys[key] && keys[key] !== key) edits.push({ start: node.key.start, end: node.key.end, text: keys[key] });
		});
	const option = (node: Node): string | undefined => {
		if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression') return option(node.expression);
		if (node.type === 'ConditionalExpression') return option(node.consequent) ?? option(node.alternate);
		if (node.type !== 'ObjectExpression') return `an option is built as \`${src(text, node).replace(/\s+/g, ' ').slice(0, 40)}\``;
		for (const [from, to] of renames) {
			const p = (node.properties as Node[]).find((q) => q.type === 'Property' && !q.computed && (q.key.name ?? q.key.value) === from);
			if (!p) return `an option has no \`${from}\``;
			edits.push(p.shorthand ? { start: p.start, end: p.end, text: `${to}: ${from}` } : { start: p.key.start, end: p.key.end, text: to });
		}
		return undefined;
	};
	const list = (node: Node): string | undefined => {
		switch (node.type) {
			case 'TSAsExpression':
			case 'TSSatisfiesExpression':
			case 'TSNonNullExpression':
				return list(node.expression);
			case 'ArrayExpression':
				for (const element of node.elements as (Node | null)[]) {
					const fail = !element ? undefined : element.type === 'SpreadElement' ? list(element.argument) : option(element);
					if (fail) return fail;
				}
				return undefined;
			case 'ConditionalExpression':
				return list(node.consequent) ?? list(node.alternate);
			case 'LogicalExpression':
				return list(node.left) ?? list(node.right);
			case 'Identifier': {
				if (chased.includes(node.name)) return undefined;
				if (scope.props.has(node.name)) return `\`${node.name}\` comes from a prop`;
				const decl = scope.declared.get(node.name);
				if (!decl?.init) return `\`${node.name}\` is not built in this file`;
				chased.push(node.name);
				if (decl.id.typeAnnotation) types(decl.id.typeAnnotation);
				return list(decl.init);
			}
			case 'CallExpression': {
				const callee = node.callee as Node;
				const rune = callee.type === 'Identifier' ? callee.name : callee.type === 'MemberExpression' && callee.object.type === 'Identifier' ? `${callee.object.name}.${callee.property.name}` : '';
				if (rune === '$state' || rune === '$state.raw' || rune === '$derived') return node.arguments[0] ? list(node.arguments[0]) : `\`${rune}()\` is empty`;
				const method = callee.type === 'MemberExpression' && !callee.computed ? (callee.property.name as string) : '';
				if (KEEP_SHAPE.has(method)) return list(callee.object);
				if (method === 'concat') return list(callee.object) ?? (node.arguments as Node[]).map(list).find(Boolean);
				const fn = method === 'map' ? (node.arguments[0] as Node | undefined) : undefined;
				if (fn?.type !== 'ArrowFunctionExpression' && fn?.type !== 'FunctionExpression') break;
				if (fn.body.type !== 'BlockStatement') return option(fn.body);
				const returns: Node[] = [];
				visit(fn.body, (inner) => {
					if (inner.type.includes('Function')) return false;
					if (inner.type === 'ReturnStatement') returns.push(inner);
				});
				if (!returns.length) return 'the `.map()` returns nothing';
				for (const r of returns) {
					const fail = r.argument ? option(r.argument) : 'the `.map()` returns nothing';
					if (fail) return fail;
				}
				return undefined;
			}
		}
		return `\`${src(text, node).replace(/\s+/g, ' ').slice(0, 40)}\` cannot be followed`;
	};
	const fail = list(root);
	return fail ?? { edits, chased };
}

interface Rewrite {
	attrs: { node: Node; text: string | null }[];
	added: string[];
	notes: { kind: string; name: string; to?: string; note?: string; byHand?: boolean }[];
}

function carried(plan: WrapperPlan, name: string, index: RuleIndex): WrapperProp | undefined {
	if (!plan.rest) return undefined;
	const inner = plan.inherited?.props.get(name);
	if (inner) {
		const h = inner.handling;
		return h.kind === 'children' || (h.kind === 'forward' && h.to === name) ? undefined : inner;
	}
	const recipe = RECIPES[plan.target]?.[name];
	const api = index.rules.v5.components[plan.target];
	if (!recipe?.to || recipe.to === name || !api || api.props.includes(name)) return undefined;
	return { name, local: name, handling: { kind: 'recipe', recipe } };
}

function rewriteUsage(text: string, usage: Node, plan: WrapperPlan, index: RuleIndex, items: Map<Node, string> = new Map()): Rewrite | string {
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
		const prop = plan.props.get(name) ?? carried(plan, name, index);
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
		if (h.kind === 'items') {
			out.attrs.push({ node: attr, text: items.get(attr) ?? `${h.to}=${value ?? ''}` });
			const renamed = Object.entries(h.keys).filter(([from, to]) => from !== to);
			out.notes.push({ kind: 'wrapper-prop', name, to: h.to, note: renamed.length ? `option keys renamed where built: ${renamed.map(([from, to]) => `\`${from}\` → \`${to}\``).join(', ')}` : undefined });
			continue;
		}
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
			const split = mapWithExtras(text, expression, r.values, r.extra ?? {}, (prop) => v5Default(index, plan.target, prop));
			if (split) {
				const [main, ...extras] = split;
				out.attrs.push({ node: attr, text: [`${to}={${main}}`, ...extras].join(' ') });
				out.notes.push({ kind: 'wrapper-prop', name, to: [to, ...extras.map((e) => e.split('=')[0])].join(' + ') });
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
				byHand: other.length > 0,
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
	if (/^LabelAnd/.test(plan.name)) {
		const literal = (name: string) => {
			const attr = attrs.find((a) => a.type === 'Attribute' && a.name === name);
			const value = attr && literalOf(attr);
			return attr && typeof value === 'string' ? { attr, value: value.trim().toLowerCase() } : undefined;
		};
		const label = literal('label');
		const placeholder = literal('placeholder');
		if (label && placeholder && label.value === placeholder.value && !out.attrs.some((a) => a.node === placeholder.attr)) {
			out.attrs.push({ node: placeholder.attr, text: null });
			out.notes.push({ kind: 'wrapper-placeholder', name: 'placeholder', note: 'same text as `label`, which v5 shows above the field: removed' });
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

function relabelItems(text: string, ast: Node, programs: Node[], index: RuleIndex, imports: { plan: WrapperPlan; usages: Node[] }[]) {
	const scope = fileScope(programs);
	const texts = new Map<Node, string>();
	const failed = new Map<Node, string>();
	const script = new Map<Node, Edit[]>();
	const shared: Record<string, string> = {};
	type Candidate = { usage: Node; attrs: { attr: Node; root: Node; to: string }[]; edits: Edit[]; chased: string[] };
	const candidates: Candidate[] = [];
	for (const { plan, usages } of imports)
		for (const usage of usages) {
			const attrs = (usage.attributes as Node[]).filter((a) => a.type === 'Attribute' && (plan.props.get(a.name) ?? carried(plan, a.name, index))?.handling.kind === 'items');
			if (!attrs.length || typeof rewriteUsage(text, usage, plan, index) === 'string') continue;
			const candidate: Candidate = { usage, attrs: [], edits: [], chased: [] };
			for (const attr of attrs) {
				const h = (plan.props.get(attr.name) ?? carried(plan, attr.name, index))!.handling as Extract<Handling, { kind: 'items' }>;
				const renames = Object.entries(h.keys).filter(([from, to]) => from !== to).map(([from, to]) => `\`${from}\` to \`${to}\``).join(' and ');
				const why = (detail: string) => `\`${attr.name}\`: ${detail}; rename ${renames} where the options are built, then run again`;
				const root = attrExpression(attr);
				const found = root ? relabel(text, root, h.keys, scope) : 'not an expression';
				if (typeof found === 'string') {
					failed.set(usage, why(found));
					break;
				}
				candidate.attrs.push({ attr, root: root!, to: h.to });
				candidate.edits.push(...found.edits);
				candidate.chased.push(...found.chased);
				for (const name of found.chased) shared[name] ??= why(`\`${name}\` is also used outside the options`);
			}
			if (!failed.has(usage)) candidates.push(candidate);
		}
	for (let changed = true; changed; ) {
		changed = false;
		const live = candidates.filter((c) => !failed.has(c.usage));
		const names = new Set(live.flatMap((c) => c.chased));
		const ranges = [...live.flatMap((c) => c.attrs.map((a) => a.root)), ...[...names].map((name) => scope.declared.get(name)!.init as Node)];
		for (const name of names) {
			const decl = scope.declared.get(name)!;
			let outside = false;
			visit(ast, (node, parent, key) => {
				if (outside) return false;
				if (node.type === 'Identifier' && node.name === name && node !== decl.id && isReference(node, parent, key) && !ranges.some((r) => node.start >= r.start && node.end <= r.end))
					outside = true;
			});
			if (!outside) continue;
			for (const c of live)
				if (c.chased.includes(name) && !failed.has(c.usage)) {
					failed.set(c.usage, shared[name]);
					changed = true;
				}
		}
	}
	for (const c of candidates) {
		if (failed.has(c.usage)) continue;
		const inAttr = (e: Edit) => c.attrs.some(({ root }) => e.start >= root.start && e.end <= root.end);
		for (const { attr, root, to } of c.attrs) {
			let expression = text.slice(root.start, root.end);
			for (const e of c.edits.filter((x) => x.start >= root.start && x.end <= root.end).sort((a, b) => b.start - a.start))
				expression = expression.slice(0, e.start - root.start) + e.text + expression.slice(e.end - root.start);
			texts.set(attr, `${to}={${expression}}`);
		}
		script.set(c.usage, c.edits.filter((e) => !inAttr(e)));
	}
	return { texts, failed, script };
}

function rewriteFile(
	dir: string,
	path: string,
	rel: string,
	text: string,
	plans: Map<string, WrapperPlan>,
	index: RuleIndex,
	result: DissolveResult,
	counts: Map<string, { usages: number; dissolved: number }>,
	spreadFrom: Map<string, WrapperPlan>,
	aliases: [string, string][]
): string {
	if (![...plans.values()].some((plan) => text.includes(plan.name))) return text;
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

	const imports: { statement: Node; plan: WrapperPlan; local: string; usages: Node[]; others: Node[]; typeRefs: Node[] }[] = [];
	for (const program of programs)
		for (const statement of program.body as Node[]) {
			if (statement.type !== 'ImportDeclaration' || statement.specifiers.length !== 1 || statement.specifiers[0].type !== 'ImportDefaultSpecifier') continue;
			const target = resolveImport(dir, path, statement.source.value, aliases);
			const plan = target ? plans.get(target) : undefined;
			if (!plan) continue;
			const local = statement.specifiers[0].local.name as string;
			const entry = { statement, plan, local, usages: [] as Node[], others: [] as Node[], typeRefs: [] as Node[] };
			visit(ast, (node, parent, key) => {
				if (node.type === 'Component' && node.name === local) entry.usages.push(node);
				else if (node.type === 'Identifier' && node.name === local && node !== statement.specifiers[0].local && isReference(node, parent, key)) {
					if (parent?.type === 'TSTypeQuery') entry.typeRefs.push(node);
					else entry.others.push(node);
				}
			});
			imports.push(entry);
		}
	const conflict = (plan: WrapperPlan, statement: Node) => !libNames.has(plan.target) && !!names.get(plan.target) && names.get(plan.target) !== statement;
	const items = relabelItems(text, ast, programs, index, imports.filter((i) => !i.plan.blockers.length && !conflict(i.plan, i.statement)));
	const dissolvedUsages = new Set<Node>();

	for (const { statement, plan, local, usages, others, typeRefs } of imports) {
		const count = counts.get(plan.path)!;
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
			const failed = items.failed.get(usage);
			const rewrite = failed ?? rewriteUsage(text, usage, plan, index, items.texts);
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
			if ((usage.attributes as Node[]).some((a) => a.type === 'SpreadAttribute')) spreadFrom.set(path, plan);
			count.dissolved++;
			dissolvedUsages.add(usage);
			done++;
			result.changes.push({ file: rel, line: line(usage), wrapper: plan.name, kind: 'wrapper-dissolved', name: plan.name, to: plan.target });
			for (const { byHand, ...note } of rewrite.notes)
				if (byHand) result.skipped.push({ file: rel, line: line(usage), wrapper: plan.name, ...note, reason: `\`${note.name}={${'…'}}\` became \`${note.to}\`: ${note.note}` });
				else result.changes.push({ file: rel, line: line(usage), wrapper: plan.name, ...note });
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
			const to = h?.kind === 'forward' || h?.kind === 'items' ? h.to : h?.kind === 'recipe' ? h.recipe.to : undefined;
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
	for (const [usage, edits] of items.script) if (dissolvedUsages.has(usage)) for (const e of edits) edit.replace(e.start, e.end, e.text);
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
	const aliases = readAliases(dir);
	const plans = new Map<string, WrapperPlan>();
	const counts = new Map<string, { usages: number; dissolved: number }>();
	const spreadFrom = new Map<string, WrapperPlan>();
	for (const pattern of WRAPPERS) {
		const pass = new Map<string, WrapperPlan>();
		for (const [path, text] of result.texts)
			if (pattern.test(basename(path))) pass.set(path, planWrapper(path, relative(dir, path), text, index, spreadFrom.get(path)));
		if (!pass.size) continue;
		for (const [path, plan] of pass) {
			plans.set(path, plan);
			counts.set(path, { usages: 0, dissolved: 0 });
		}
		for (const [path, text] of result.texts) {
			if (!path.endsWith('.svelte')) continue;
			const next = rewriteFile(dir, path, relative(dir, path), text, pass, index, result, counts, spreadFrom, aliases);
			if (next !== text) result.texts.set(path, next);
		}
	}
	if (!plans.size) return result;
	const deleted = new Set<string>();
	for (let changed = true; changed; ) {
		changed = false;
		for (const path of plans.keys()) {
			if (deleted.has(path)) continue;
			const used = [...result.texts].some(([file, text]) => {
				if (file === path || deleted.has(file) || !/\.(svelte|ts|js)$/.test(file)) return false;
				for (const match of text.matchAll(IMPORT_SOURCE)) {
					const source = match[1].replace(/\?.*$/, '');
					if (resolveImport(dir, file, source, aliases) === path) return true;
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
								: p.handling.kind === 'items'
									? `→ ${p.handling.to} (${Object.entries(p.handling.keys).filter(([from, to]) => from !== to).map(([from, to]) => `${from} → ${to}`).join(', ')})`
								: p.handling.kind === 'unknown'
									? `kept: ${p.handling.reason}`
									: p.handling.kind
			}))
		});
	}
	result.wrappers.sort((a, b) => a.file.localeCompare(b.file));
	return result;
}
