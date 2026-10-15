import { parse } from 'svelte/compiler';
import { findComponent } from './docs.ts';
import { PACKAGE } from './spec.ts';
import type { ComponentSpec, Spec } from './types.ts';

export interface Issue {
	level: 'error' | 'warning';
	line: number;
	component?: string;
	message: string;
}

type Node = { type: string; start: number; end: number; [key: string]: any };

const NATIVE_PREFIX = /^(on[a-z]+|aria-[a-z-]+|data-[\w-]+)$/;
const HTML_ATTRIBUTES = new Set(
	(
		'accept accesskey action alt autocapitalize autocomplete autocorrect autofocus capture checked cols colspan ' +
		'contenteditable dir dirname disabled download draggable enctype enterkeyhint form formaction formenctype ' +
		'formmethod formnovalidate formtarget headers height hidden href hreflang inert inputmode is lang list max ' +
		'maxlength method min minlength multiple name novalidate open pattern ping placeholder popover popovertarget ' +
		'popovertargetaction readonly referrerpolicy rel required role rows rowspan scope size sizes slot span ' +
		'spellcheck src srcset step tabindex target title translate type value width wrap'
	).split(' ')
);
const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/;

function lineOf(code: string, offset: number) {
	let line = 1;
	for (let i = 0; i < offset && i < code.length; i++) if (code[i] === '\n') line++;
	return line;
}

function libraryImports(script: Node | null | undefined) {
	const imports = new Map<string, string>();
	for (const statement of script?.content?.body ?? []) {
		if (statement.type !== 'ImportDeclaration' || statement.source.value !== PACKAGE) continue;
		for (const specifier of statement.specifiers) {
			if (specifier.type === 'ImportSpecifier') imports.set(specifier.local.name, specifier.imported.name);
		}
	}
	return imports;
}

function walk(node: unknown, visit: (node: Node) => void) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const child of node) walk(child, visit);
		return;
	}
	const current = node as Node;
	if (typeof current.type === 'string') visit(current);
	for (const [key, value] of Object.entries(current)) {
		if (key === 'parent' || key === 'metadata') continue;
		if (value && typeof value === 'object') walk(value, visit);
	}
}

function knownNames(component: ComponentSpec) {
	return new Set([
		...component.props.map((p) => p.name),
		...component.events.map((e) => e.name),
		...component.snippets.map((s) => s.name),
		'children'
	]);
}

function cssNames(component: ComponentSpec) {
	return new Set(component.cssVars.flatMap((v) => [v.name, ...v.defaults.map((d) => d.name)]));
}

function checkComponent(code: string, node: Node, component: ComponentSpec, issues: Issue[]) {
	const names = knownNames(component);
	const bindable = new Set(component.props.filter((p) => p.bindable).map((p) => p.name));
	const css = cssNames(component);
	const native = component.htmlElement;
	const at = (n: Node) => lineOf(code, n.start);
	const add = (level: Issue['level'], n: Node, message: string) =>
		issues.push({ level, line: at(n), component: component.name, message });

	for (const attribute of node.attributes as Node[]) {
		const name: string = attribute.name;
		if (attribute.type === 'OnDirective') {
			add('error', attribute, `on:${name} does not work on Svelte 5 components: use the on${name} prop.`);
			continue;
		}
		if (attribute.type === 'BindDirective') {
			if (name !== 'this' && !bindable.has(name)) {
				add('error', attribute, names.has(name) ? `${name} is not bindable.` : `bind:${name}: no prop "${name}".`);
			}
			continue;
		}
		if (attribute.type !== 'Attribute') continue;
		if (name.startsWith('--')) {
			if (!css.has(name) && !name.startsWith('--global-')) {
				add('error', attribute, `CSS variable ${name} does not exist on ${component.name}.`);
			}
			continue;
		}
		if (!names.has(name) && !['class', 'style', 'id', 'key'].includes(name)) {
			if (!native) add('error', attribute, `Unknown prop "${name}".`);
			else if (!NATIVE_PREFIX.test(name) && !HTML_ATTRIBUTES.has(name)) {
				add('warning', attribute, `"${name}" is neither a prop nor a common HTML attribute: it would be passed as an attribute to <${native}> (a typo?).`);
			}
		}
		if (/^on[a-z]/.test(name) && attribute.value && attribute.value !== true) {
			const source = code.slice(attribute.start, attribute.end);
			if (/\bdetail\b/.test(source)) {
				add('error', attribute, `${name} receives the native event or a plain object: there is no { detail } in v5.`);
			}
		}
	}
	for (const child of node.fragment?.nodes ?? []) {
		if (child.type !== 'SnippetBlock') continue;
		const name = child.expression?.name;
		if (name && !names.has(name)) add('error', child, `Unknown snippet "${name}".`);
	}
}

export function validateUsage(spec: Spec, code: string, filename = 'Component.svelte'): Issue[] {
	let ast: Node;
	try {
		ast = parse(code, { modern: true, filename }) as unknown as Node;
	} catch (error) {
		const e = error as { message: string; start?: { line: number } };
		return [{ level: 'error', line: e.start?.line ?? 1, message: `Parse error: ${e.message}` }];
	}
	const issues: Issue[] = [];
	const imports = libraryImports(ast.instance);
	for (const imported of imports.values()) {
		if (/^[A-Z]/.test(imported) && !findComponent(spec, imported) && !isKnownExport(spec, imported)) {
			issues.push({ level: 'warning', line: 1, message: `${imported} is not a documented component of ${PACKAGE} ${spec.version} (a v4 name?).` });
		}
	}
	walk(ast.fragment, (node) => {
		if (node.type !== 'Component') return;
		const imported = imports.get(node.name);
		if (!imported) return;
		const component = findComponent(spec, imported);
		if (component) checkComponent(code, node, component, issues);
	});
	const css = ast.css ? code.slice(ast.css.content.start, ast.css.content.end) : '';
	css.split('\n').forEach((text, index) => {
		if (COLOR.test(text.replace(/var\([^)]*\)/g, ''))) {
			issues.push({
				level: 'warning',
				line: lineOf(code, ast.css.content.start) + index,
				message: `Hardcoded color: use a token (var(--global-color-*)) so themes and dark mode apply. ${text.trim()}`
			});
		}
	});
	return issues.sort((a, b) => a.line - b.line);
}

function isKnownExport(spec: Spec, name: string) {
	return spec.components.some((c) => c.types.some((t) => t.name === name));
}

export function formatIssues(issues: Issue[], label: string) {
	if (!issues.length) return `${label}: no problems found with ${PACKAGE} usage. Run svelte-check for type errors.`;
	const errors = issues.filter((i) => i.level === 'error').length;
	return [
		`${label}: ${errors} errors, ${issues.length - errors} warnings. Check the specs with get_component.`,
		...issues.map((i) => `- line ${i.line} ${i.level}${i.component ? ` [${i.component}]` : ''}: ${i.message}`)
	].join('\n');
}
