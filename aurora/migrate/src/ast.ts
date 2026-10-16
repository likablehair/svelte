import MagicString from 'magic-string';
import type { Node } from './svelte.ts';

const SKIP_KEYS = new Set(['parent', 'metadata', 'loc', 'leadingComments', 'trailingComments']);

export function visit(
	node: unknown,
	enter: (node: Node, parent: Node | null, key: string) => boolean | void,
	parent: Node | null = null,
	key = ''
) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const child of node) visit(child, enter, parent, key);
		return;
	}
	const current = node as Node;
	const isNode = typeof current.type === 'string';
	if (isNode && enter(current, parent, key) === false) return;
	for (const k in current) {
		if (SKIP_KEYS.has(k)) continue;
		const value = current[k];
		if (value && typeof value === 'object') visit(value, enter, isNode ? current : parent, isNode ? k : key);
	}
}

export function isReference(node: Node, parent: Node | null, key: string) {
	if (!parent) return true;
	if ((parent.type === 'MemberExpression' || parent.type === 'TSQualifiedName') && key !== 'object' && key !== 'left')
		return !!parent.computed;
	if (
		(parent.type === 'Property' ||
			parent.type === 'PropertyDefinition' ||
			parent.type === 'MethodDefinition' ||
			parent.type === 'TSPropertySignature' ||
			parent.type === 'TSMethodSignature') &&
		key === 'key'
	)
		return !!parent.computed;
	if (parent.type.startsWith('Import') || parent.type.startsWith('Export')) return false;
	if (parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement')
		return false;
	return true;
}

export class Editor {
	private s: MagicString;
	private done: [number, number][] = [];

	constructor(text: string) {
		this.s = new MagicString(text);
	}

	private inside(pos: number) {
		return this.done.some(([a, b]) => pos > a && pos < b);
	}

	replace(start: number, end: number, text: string): boolean {
		if (this.done.some(([a, b]) => start < b && a < end)) return false;
		this.done.push([start, end]);
		this.s.overwrite(start, end, text);
		return true;
	}

	insert(pos: number, text: string): boolean {
		if (this.inside(pos)) return false;
		this.s.appendLeft(pos, text);
		return true;
	}

	get changed() {
		return this.s.hasChanged();
	}

	toString() {
		return this.s.toString();
	}
}

export function attrText(attr: Node): string | undefined {
	if (!Array.isArray(attr.value)) return undefined;
	const parts = attr.value as Node[];
	return parts.every((p) => p.type === 'Text') ? parts.map((p) => p.data).join('') : undefined;
}

export function attrExpression(attr: Node): Node | undefined {
	if (attr.type === 'BindDirective') return attr.expression;
	if (attr.value && !Array.isArray(attr.value) && attr.value.type === 'ExpressionTag') return attr.value.expression;
	if (Array.isArray(attr.value) && attr.value.length === 1 && attr.value[0].type === 'ExpressionTag')
		return attr.value[0].expression;
	return undefined;
}
