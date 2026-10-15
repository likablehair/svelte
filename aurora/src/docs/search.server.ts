import { slugify } from './anchors.js';
import { exportedTypeFiles, getComponentDoc, getExamples, getTokens, listComponents } from './api.server.js';
import type { ComponentDoc, TypeDoc } from './types.js';
import { CLASSES_TITLE, STYLING_SECTIONS, STYLING_TITLE } from './styling.js';
import type { SearchIndex } from './search.js';

const plain = (text = '') => text.replace(/`([^`]*)`/g, '$1').replace(/\s+/g, ' ').trim();
const firstSentence = (text?: string) => plain(text).split(/(?<=\.)\s/)[0] ?? '';
const short = (text = '', length = 100) =>
	text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;

let cached: SearchIndex | undefined;

export function searchIndex(): SearchIndex {
	if (cached) return cached;
	const tokenGroups = getTokens();
	const pages: { title: string; href: string; sections: string[] }[] = [
		{ title: 'Tokens', href: '/', sections: [...tokenGroups.map((g) => g.title), 'Fonts', 'Themes'] },
		{
			title: 'Themes',
			href: '/themes',
			sections: ['How to create one', 'Light, dark and remembering the choice', 'In the library', 'Gallery']
		},
		{
			title: STYLING_TITLE,
			href: '/styling',
			sections: [...STYLING_SECTIONS.map((s) => s.title), CLASSES_TITLE]
		}
	];

	const docs = listComponents().flatMap((entry) => getComponentDoc(entry.slug) ?? []);
	const typeFiles = exportedTypeFiles();
	const owners = new Map<string, string>();
	for (const doc of docs) {
		for (const type of doc.types) {
			if (owners.has(type.name)) continue;
			const owner = typeOwner(type, typeFiles.get(type.name), docs);
			if (owner) owners.set(type.name, owner);
		}
	}
	const own = <T extends { from?: string }>(rows: T[]) => rows.filter((row) => !row.from);
	const pair = (row: { name: string; description?: string }): [string, string] => [
		row.name,
		short(firstSentence(row.description))
	];

	return (cached = {
		pages: pages.flatMap((page) => [
			{ label: page.title, href: page.href },
			...page.sections.map((section) => ({
				label: section,
				href: `${page.href}#${slugify(section)}`,
				page: page.title
			}))
		]),
		tokens: tokenGroups.flatMap((group) =>
			group.tokens.map((token): [string, string] => [token.name, short(`${group.title} · ${token.value}`, 60)])
		),
		components: docs.map((doc) => ({
			name: doc.name,
			slug: doc.slug,
			description: short(firstSentence(doc.description)),
			text: plain(doc.description),
			examples: getExamples(doc.slug).map((example): [string, string] => [example.id, example.title]),
			props: own(doc.props).map(pair),
			events: own(doc.events).map(pair),
			snippets: own(doc.snippets).map(pair),
			methods: doc.methods.map(pair),
			types: doc.types.filter((type) => owners.get(type.name) === doc.name).map(pair),
			css: doc.cssVars.map((variable): [string, string] => [
				variable.name,
				short(variable.defaults[0]?.value ?? variable.fallback ?? '', 50)
			])
		}))
	});
}

function typeOwner(type: TypeDoc, file: string | undefined, docs: ComponentDoc[]) {
	const users = docs.filter((doc) => doc.types.some((t) => t.name === type.name));
	const definer = users.find((doc) => file === `/src/lib/${doc.file}`);
	if (definer) return definer.name;
	const prefix = (name: string) => {
		let length = 0;
		while (length < name.length && name[length] === type.name[length]) length++;
		return length;
	};
	const named = users
		.map((doc) => ({ doc, length: prefix(doc.name) }))
		.filter(({ length }) => length >= 4)
		.sort((a, b) => b.length - a.length || a.doc.name.length - b.doc.name.length)[0];
	if (named) return named.doc.name;
	const mentioned = users
		.map((doc) => ({ doc, at: type.description?.search(new RegExp(`\\b${doc.name}\\b`)) ?? -1 }))
		.filter(({ at }) => at >= 0)
		.sort((a, b) => a.at - b.at)[0];
	return (mentioned?.doc ?? users[0])?.name;
}
