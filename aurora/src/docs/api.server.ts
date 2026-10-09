import { parse } from 'svelte/compiler';
import type {
	ComponentDoc,
	ComponentEntry,
	CssDefault,
	CssVarDoc,
	ExampleDoc,
	InheritsDoc,
	MethodDoc,
	PropDoc,
	SnippetDoc,
	TokenGroup
} from './types.js';

const lib = import.meta.glob<string>(
	['/src/lib/index.ts', '/src/lib/**/*.svelte', '/src/lib/**/*.css'],
	{ query: '?raw', import: 'default', eager: true }
);
const examples = import.meta.glob<string>('/src/docs/examples/*/*.svelte', {
	query: '?raw',
	import: 'default',
	eager: true
});

type Node = { type: string; start: number; end: number; [key: string]: any };

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export function listComponents(): ComponentEntry[] {
	const index = lib['/src/lib/index.ts'];
	const entries: ComponentEntry[] = [];
	for (const m of index.matchAll(
		/export\s*\{\s*default\s+as\s+(\w+)\s*\}\s*from\s*'\.\/(components\/(\w+)\/[^']+\.svelte)'/g
	)) {
		entries.push({ name: m[1], file: m[2], category: m[3], slug: kebab(m[1]) });
	}
	return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export function getComponentDoc(slug: string): ComponentDoc | undefined {
	const entry = listComponents().find((c) => c.slug === slug);
	if (!entry) return undefined;
	const source = lib[`/src/lib/${entry.file}`];
	const ast = parse(source, { modern: true });
	const body: Node[] = (ast.instance?.content.body ?? []) as unknown as Node[];
	const text = (node: Node) => source.slice(node.start, node.end);

	const description = (ast.fragment.nodes as Node[])
		.find((n) => n.type === 'Comment' && n.data.trim().startsWith('@component'))
		?.data.trim()
		.replace(/^@component\s*/, '')
		.trim();

	const defaults = new Map<string, { value?: string; bindable: boolean }>();
	const propsDecl = body
		.filter((n) => n.type === 'VariableDeclaration')
		.flatMap((n) => n.declarations as Node[])
		.find((d) => d.init?.type === 'CallExpression' && d.init.callee.name === '$props');
	for (const p of (propsDecl?.id.properties ?? []) as Node[]) {
		if (p.type !== 'Property') continue;
		const name = p.key.name ?? p.key.value;
		if (p.value.type !== 'AssignmentPattern') {
			defaults.set(name, { bindable: false });
			continue;
		}
		const right: Node = p.value.right;
		if (right.type === 'CallExpression' && right.callee.name === '$bindable') {
			defaults.set(name, {
				bindable: true,
				value: right.arguments[0] ? text(right.arguments[0]) : undefined
			});
		} else {
			defaults.set(name, { bindable: false, value: text(right) });
		}
	}

	const props: PropDoc[] = [];
	const snippets: SnippetDoc[] = [];
	const events: PropDoc[] = [];
	let htmlElement: string | undefined;
	let inherits: InheritsDoc | undefined;
	const aliases = new Map<string, string>(
		body
			.filter((n) => n.type === 'TSTypeAliasDeclaration')
			.map((n) => [n.id.name, text(n.typeAnnotation)])
	);
	const iface = body
		.map((n) => (n.type === 'ExportNamedDeclaration' ? n.declaration : n))
		.find((n: Node | null) => n?.type === 'TSInterfaceDeclaration' && n.id.name === 'Props');
	if (iface) {
		for (const ext of (iface.extends ?? []) as Node[]) {
			let extText = text(ext);
			for (const [alias, value] of aliases) {
				extText = extText.replace(new RegExp(`\\b${alias}\\b`, 'g'), value);
			}
			const m = extText.match(/HTML(\w+?)(?:Attributes|Element)\b/);
			if (m) htmlElement = htmlTag(m[1]);
			const base = extText.match(/ComponentProps<\s*typeof\s+(\w+)/)?.[1];
			if (base) {
				inherits = {
					name: base,
					slug: kebab(base),
					omitted: [...extText.matchAll(/'(\w+)'/g)].map((o) => o[1])
				};
			}
		}
		for (const member of iface.body.body as Node[]) {
			if (member.type !== 'TSPropertySignature') continue;
			const name: string = member.key.name ?? member.key.value;
			const type = member.typeAnnotation
				? text(member.typeAnnotation.typeAnnotation).replace(/\s+/g, ' ').replace(/^\| /, '')
				: 'unknown';
			const doc = jsdoc(member.leadingComments);
			const optional = !!member.optional;
			if (/\bSnippet\b/.test(type)) {
				const params = type.match(/Snippet<\s*\[\s*(.*?)\s*\]\s*>/)?.[1];
				snippets.push({ name, params, optional, description: doc });
				continue;
			}
			const prop: PropDoc = {
				name,
				type,
				optional,
				default: defaults.get(name)?.value,
				bindable: defaults.get(name)?.bindable ?? false,
				description: doc
			};
			if (/^on[a-z]/.test(name) && type.includes('=>')) events.push(prop);
			else props.push(prop);
		}
	}

	if (inherits) {
		const base = getComponentDoc(inherits.slug);
		if (base) {
			const own = new Set([...props, ...snippets, ...events].map((p) => p.name));
			const keep = (p: { name: string }) =>
				!own.has(p.name) && !inherits!.omitted.includes(p.name);
			const from = { from: base.name };
			props.push(...base.props.filter(keep).map((p) => ({ ...p, ...from })));
			snippets.push(...base.snippets.filter(keep).map((p) => ({ ...p, ...from })));
			events.push(...base.events.filter(keep).map((p) => ({ ...p, ...from })));
			htmlElement ??= base.htmlElement;
		}
	}

	const methods: MethodDoc[] = (body as Node[])
		.filter((n) => n.type === 'ExportNamedDeclaration' && n.declaration?.type === 'FunctionDeclaration')
		.map((n) => {
			const fn: Node = n.declaration;
			const params = (fn.params as Node[]).map(text).join(', ');
			return {
				name: fn.id.name,
				signature: `${fn.id.name}(${params})${fn.returnType ? text(fn.returnType) : ''}`,
				description: jsdoc(n.leadingComments ?? fn.leadingComments)
			};
		});

	const prefix = `--${entry.slug}-`;
	const cssFile = lib[`/src/lib/${entry.file.replace(/\.svelte$/, '.css')}`];
	const allDefaults = cssFile ? parseCssDefaults(cssFile) : [];
	const componentDefaults = allDefaults.filter((d) => d.name.startsWith(`${prefix}default-`));
	const instance = instanceVars(ast.css?.content.styles ?? '', prefix);
	const cssVars: CssVarDoc[] = instance.map(({ name, fallback }) => {
		const inherits = fallback.match(new RegExp(`^var\\((${prefix}[\\w-]+)`))?.[1];
		return {
			name,
			defaults: [],
			inherits: inherits && !inherits.startsWith(`${prefix}default-`) ? inherits : undefined,
			fallback: fallback.includes('var(') ? undefined : fallback
		};
	});
	const cssDefaultsOnly: CssDefault[] = [];
	for (const d of componentDefaults) {
		const rest = d.name.slice(`${prefix}default-`.length);
		let best: CssVarDoc | undefined;
		let bestLength = 0;
		for (const v of cssVars) {
			const suffix = v.name.slice(prefix.length);
			if ((rest === suffix || rest.endsWith(`-${suffix}`)) && suffix.length > bestLength) {
				best = v;
				bestLength = suffix.length;
			}
		}
		if (best) best.defaults.push(d);
		else cssDefaultsOnly.push(d);
	}

	return {
		...entry,
		description,
		htmlElement,
		inherits,
		props,
		snippets,
		events,
		methods,
		cssVars,
		cssDefaultsOnly
	};
}

export function getExamples(slug: string): ExampleDoc[] {
	return Object.entries(examples)
		.filter(([path]) => path.startsWith(`/src/docs/examples/${slug}/`))
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([path, source]) => {
			const id = path.split('/').pop()!.replace(/\.svelte$/, '');
			const comment = source.match(/<!--\s*@component([\s\S]*?)-->/);
			const [title, ...rest] = (comment?.[1].trim() ?? id).split('\n');
			return {
				id,
				title: title.trim(),
				description: rest.join('\n').trim() || undefined,
				code: source
					.replace(/<!--\s*@component[\s\S]*?-->\s*/, '')
					.replaceAll("from '#lib'", "from '@likable-hair/svelte'")
					.trim()
			};
		});
}

const TOKEN_GROUPS: [string, RegExp][] = [
	['Surfaces', /^--global-color-(bg|surface|border)/],
	['Text', /^--global-color-text/],
	['Brand', /^--global-color-(primary|on-primary|accent)/],
	['States', /^--global-color-(success|warning|error|on-success|on-warning|on-error)/],
	['Data', /^--global-color-data/],
	['Fills', /^--global-(gradient|fill)/],
	['Shape', /^--global-(radius|border)/],
	['Elevation', /^--global-(shadow|focus|color-overlay|overlay)/],
	['Inputs', /^--global-input/],
	['Typography', /^--global-font/],
	['Motion', /^--global-(ease|duration)/]
];

export function getTokens(): TokenGroup[] {
	const groups: TokenGroup[] = [...TOKEN_GROUPS.map(([title]) => ({ title, tokens: [] as CssDefault[] })), { title: 'Other', tokens: [] }];
	for (const token of parseCssDefaults(lib['/src/lib/css/tokens.css'])) {
		const index = TOKEN_GROUPS.findIndex(([, pattern]) => pattern.test(token.name));
		groups[index === -1 ? groups.length - 1 : index].tokens.push(token);
	}
	return groups.filter((g) => g.tokens.length);
}

const gallery = import.meta.glob<string>('/src/docs/themes/*.css', {
	query: '?raw',
	import: 'default',
	eager: true
});

const fileName = (path: string) => path.split('/').pop()!.replace(/\.css$/, '');

export function getGalleryThemes(): string[] {
	return Object.keys(gallery).map(fileName).sort();
}

export function getThemeSources() {
	const entries = [
		...Object.entries(lib)
			.filter(([path]) => path.startsWith('/src/lib/themes/'))
			.map(([path, source]) => ({ path, source, gallery: false })),
		...Object.entries(gallery).map(([path, source]) => ({ path, source, gallery: true }))
	];
	return entries
		.map(({ path, source, gallery }) => ({
			name: fileName(path),
			gallery,
			source: source.trim(),
			declarations: parseCssDefaults(source).length
		}))
		.sort((a, b) => Number(a.gallery) - Number(b.gallery) || a.declarations - b.declarations);
}

export function getThemes(): string[] {
	return Object.keys(lib)
		.filter((path) => path.startsWith('/src/lib/themes/'))
		.map((path) => path.split('/').pop()!.replace(/\.css$/, ''));
}

function parseCssDefaults(css: string): CssDefault[] {
	const defaults = new Map<string, string>();
	for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]*);/g)) {
		if (defaults.has(m[1])) continue;
		const value = m[2]
			.replace(/\s+/g, ' ')
			.replace(/\(\s+/g, '(')
			.replace(/\s+\)/g, ')')
			.trim();
		defaults.set(m[1], value);
	}
	return [...defaults].map(([name, value]) => ({ name, value }));
}

function instanceVars(styles: string, prefix: string) {
	const found = new Map<string, string>();
	const re = new RegExp(`var\\(\\s*(${prefix}(?!default-)[\\w-]+)\\s*,`, 'g');
	for (const m of styles.matchAll(re)) {
		if (found.has(m[1])) continue;
		let depth = 1;
		let i = m.index + m[0].length;
		const start = i;
		for (; i < styles.length && depth; i++) {
			if (styles[i] === '(') depth++;
			else if (styles[i] === ')') depth--;
		}
		found.set(m[1], styles.slice(start, i - 1).replace(/\s+/g, ' ').trim());
	}
	return [...found].map(([name, fallback]) => ({ name, fallback }));
}

function jsdoc(comments: Node[] | undefined) {
	const block = comments?.filter((c) => c.type === 'Block' && c.value.startsWith('*')).at(-1);
	return block?.value
		.split('\n')
		.map((l: string) => l.replace(/^\s*\*+\s?/, ''))
		.join('\n')
		.trim();
}

function htmlTag(name: string) {
	const tags: Record<string, string> = { Anchor: 'a', Paragraph: 'p', Heading: 'h1', Div: 'div' };
	return tags[name] ?? name.toLowerCase();
}
