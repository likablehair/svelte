import { parse } from 'svelte/compiler';
import { Lines } from './files.ts';

export type Node = { type: string; start: number; end: number; [key: string]: any };

export interface Attr {
	kind: 'prop' | 'bind' | 'event' | 'on' | 'spread' | 'style' | 'let' | 'other';
	name: string;
	boolean?: true;
	text?: string;
	expression?: Node;
	source: string;
	line: number;
	start: number;
	end: number;
}

export interface ComponentNode {
	tag: string;
	line: number;
	start: number;
	end: number;
	attrs: Attr[];
	snippets: string[];
	slots: string[];
	children: boolean;
}

export interface ImportRecord {
	source: string;
	imported: string;
	local: string;
	type: boolean;
	line: number;
}

export interface SvelteFile {
	imports: ImportRecord[];
	components: ComponentNode[];
	topLevel: Node[];
	declaredProps: string[];
	restProp?: string;
	logic: string[];
	legacy: { exportLet: number; reactive: number; dispatch: number; slot: number };
	scripts: [number, number][];
	error?: string;
}

const SKIP_KEYS = new Set(['parent', 'metadata', 'loc', 'leadingComments', 'trailingComments']);
const LIFECYCLE = new Set(['onMount', 'onDestroy', 'beforeUpdate', 'afterUpdate', 'tick', 'setContext', 'getContext']);
const BLOCKS = new Set(['IfBlock', 'EachBlock', 'AwaitBlock', 'KeyBlock']);

export function walk(node: unknown, visit: (node: Node) => void) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const child of node) walk(child, visit);
		return;
	}
	const current = node as Node;
	if (typeof current.type === 'string') visit(current);
	for (const key in current) {
		if (SKIP_KEYS.has(key)) continue;
		const value = current[key];
		if (value && typeof value === 'object') walk(value, visit);
	}
}

export const attrLiteral = (attr: Pick<Attr, 'boolean' | 'text' | 'expression'>): string | undefined =>
	attr.boolean ? 'true' : attr.text !== undefined ? attr.text : attr.expression?.type === 'Literal' ? String(attr.expression.value) : undefined;

function attrValue(value: unknown): Pick<Attr, 'boolean' | 'text' | 'expression'> {
	if (value === true) return { boolean: true };
	const parts = (Array.isArray(value) ? value : [value]) as Node[];
	if (parts.every((p) => p.type === 'Text')) return { text: parts.map((p) => p.data).join('') };
	if (parts.length === 1 && parts[0].type === 'ExpressionTag') return { expression: parts[0].expression };
	return {};
}

function readAttrs(node: Node, source: string, lines: Lines): Attr[] {
	return (node.attributes as Node[]).map((attr): Attr => {
		const base = {
			source: source.slice(attr.start, attr.end),
			line: lines.at(attr.start),
			start: attr.start,
			end: attr.end
		};
		switch (attr.type) {
			case 'Attribute': {
				const kind = attr.name.startsWith('--')
					? 'style'
					: /^on[a-z]/.test(attr.name)
						? 'event'
						: 'prop';
				return { kind, name: attr.name, ...attrValue(attr.value), ...base };
			}
			case 'BindDirective':
				return { kind: 'bind', name: attr.name, expression: attr.expression, ...base };
			case 'OnDirective':
				return { kind: 'on', name: `on${attr.name}`, expression: attr.expression ?? undefined, ...base };
			case 'SpreadAttribute':
				return { kind: 'spread', name: '...', expression: attr.expression, ...base };
			case 'LetDirective':
				return { kind: 'let', name: attr.name, ...base };
			default:
				return { kind: 'other', name: attr.name ?? attr.type, ...base };
		}
	});
}

function readChildren(node: Node) {
	const snippets: string[] = [];
	const slots: string[] = [];
	let children = false;
	for (const child of (node.fragment?.nodes ?? []) as Node[]) {
		if (child.type === 'SnippetBlock') snippets.push(child.expression.name);
		else if (child.type === 'Comment') continue;
		else if (child.type === 'Text') children ||= child.data.trim() !== '';
		else {
			const slot = (child.attributes as Node[] | undefined)?.find(
				(a) => a.type === 'Attribute' && a.name === 'slot'
			);
			const name = slot && attrValue(slot.value).text;
			if (name) slots.push(name);
			else children = true;
		}
	}
	return { snippets, slots, children };
}

function scriptFacts(program: Node | undefined) {
	const imports: Omit<ImportRecord, 'line'>[] = [];
	const importStarts: number[] = [];
	const declared: string[] = [];
	const logic: string[] = [];
	let rest: string | undefined;
	let exportLet = 0;
	let reactive = 0;
	let dispatch = 0;
	for (const statement of (program?.body ?? []) as Node[]) {
		if (statement.type === 'ImportDeclaration') {
			for (const spec of statement.specifiers as Node[]) {
				importStarts.push(statement.start);
				imports.push({
					source: statement.source.value,
					imported:
						spec.type === 'ImportDefaultSpecifier'
							? 'default'
							: spec.type === 'ImportNamespaceSpecifier'
								? '*'
								: (spec.imported.name ?? spec.imported.value),
					local: spec.local.name,
					type: statement.importKind === 'type' || spec.importKind === 'type'
				});
			}
			continue;
		}
		if (statement.type === 'ExportNamedDeclaration' && statement.declaration?.type === 'VariableDeclaration') {
			for (const d of statement.declaration.declarations as Node[])
				if (d.id.type === 'Identifier') {
					declared.push(d.id.name);
					exportLet++;
				}
			continue;
		}
		if (statement.type === 'LabeledStatement' && statement.label.name === '$') {
			reactive++;
			logic.push('reactive');
			continue;
		}
		if (statement.type === 'FunctionDeclaration') {
			logic.push('function');
			continue;
		}
		if (statement.type === 'VariableDeclaration') {
			for (const d of statement.declarations as Node[]) {
				const init = d.init as Node | null;
				const callee = init?.type === 'CallExpression' ? init.callee : undefined;
				if (callee?.name === '$props' && d.id.type === 'ObjectPattern') {
					for (const p of d.id.properties as Node[]) {
						if (p.type === 'RestElement') rest = p.argument.name;
						else declared.push(p.key.name ?? p.key.value);
					}
				} else if (callee?.name === 'createEventDispatcher') {
					dispatch++;
					logic.push('dispatch');
				} else if (callee?.name === '$state') logic.push('state');
				else if (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression')
					logic.push('function');
			}
			continue;
		}
		if (
			statement.type === 'TSInterfaceDeclaration' ||
			statement.type === 'TSTypeAliasDeclaration' ||
			statement.type === 'ExportNamedDeclaration' ||
			statement.type === 'EmptyStatement'
		)
			continue;
		if (statement.type === 'ExpressionStatement' && statement.expression.type === 'CallExpression') {
			const callee = statement.expression.callee as Node;
			const name = callee.type === 'MemberExpression' ? callee.object.name : callee.name;
			logic.push(name === '$effect' ? 'effect' : LIFECYCLE.has(name) ? 'lifecycle' : 'statement');
			continue;
		}
		logic.push('statement');
	}
	return { imports, importStarts, declared, logic, rest, exportLet, reactive, dispatch };
}

export function scanSvelte(source: string): SvelteFile {
	const lines = new Lines(source);
	let ast: Node;
	try {
		ast = parse(source, { modern: true }) as unknown as Node;
	} catch (error) {
		return {
			imports: [],
			components: [],
			topLevel: [],
			declaredProps: [],
			logic: [],
			legacy: { exportLet: 0, reactive: 0, dispatch: 0, slot: 0 },
			scripts: [],
			error: (error as Error).message.split('\n')[0]
		};
	}
	const instance = scriptFacts(ast.instance?.content);
	const module = scriptFacts(ast.module?.content);
	const imports = [instance, module].flatMap((facts) =>
		facts.imports.map((record, i) => ({ ...record, line: lines.at(facts.importStarts[i]) }))
	);

	const components: ComponentNode[] = [];
	let blocks = 0;
	let slot = 0;
	walk(ast.fragment, (node) => {
		if (node.type === 'Component')
			components.push({
				tag: node.name,
				line: lines.at(node.start),
				start: node.start,
				end: node.end,
				attrs: readAttrs(node, source, lines),
				...readChildren(node)
			});
		else if (BLOCKS.has(node.type)) blocks++;
		else if (node.type === 'SlotElement') slot++;
	});

	const topLevel = (ast.fragment.nodes as Node[]).filter(
		(n) =>
			!(n.type === 'Text' && n.data.trim() === '') &&
			n.type !== 'Comment' &&
			n.type !== 'SnippetBlock' &&
			n.type !== 'SvelteOptions'
	);
	const logic = [...instance.logic];
	if (topLevel.length > 1) logic.push('markup');
	if (blocks) logic.push('blocks');

	return {
		imports,
		components,
		topLevel,
		declaredProps: instance.declared,
		restProp: instance.rest,
		logic,
		legacy: {
			exportLet: instance.exportLet,
			reactive: instance.reactive,
			dispatch: instance.dispatch,
			slot
		},
		scripts: [ast.instance, ast.module]
			.filter(Boolean)
			.map((s: Node) => [s.content.start, s.content.end] as [number, number])
	};
}
