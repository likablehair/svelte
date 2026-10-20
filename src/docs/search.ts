import type { GlobalSearchItem } from '#lib';
import { foldText } from '#lib/utils/table/manager.js';
import {
	mdiCodeBraces,
	mdiFileDocumentOutline,
	mdiFunctionVariant,
	mdiLightningBoltOutline,
	mdiPaletteOutline,
	mdiPaletteSwatchOutline,
	mdiPlayBoxOutline,
	mdiPuzzleOutline,
	mdiShapeOutline,
	mdiTuneVariant
} from '@mdi/js';
import { anchors } from './anchors.js';

type Pair = [string, string];

export interface SearchIndex {
	pages: { label: string; href: string; page?: string }[];
	tokens: Pair[];
	components: {
		name: string;
		slug: string;
		description: string;
		text: string;
		examples: Pair[];
		props: Pair[];
		events: Pair[];
		snippets: Pair[];
		methods: Pair[];
		types: Pair[];
		css: Pair[];
	}[];
}

export type SearchKind =
	| 'component'
	| 'page'
	| 'example'
	| 'prop'
	| 'event'
	| 'snippet'
	| 'method'
	| 'type'
	| 'css'
	| 'token';

export interface SearchEntry {
	kind: SearchKind;
	label: string;
	description?: string;
	href: string;
	context?: string;
	text?: string;
}

const KINDS: Record<SearchKind, { group: string; icon: string }> = {
	component: { group: 'Components', icon: mdiPuzzleOutline },
	page: { group: 'Pages', icon: mdiFileDocumentOutline },
	prop: { group: 'Props', icon: mdiTuneVariant },
	event: { group: 'Events', icon: mdiLightningBoltOutline },
	snippet: { group: 'Snippets', icon: mdiCodeBraces },
	method: { group: 'Methods', icon: mdiFunctionVariant },
	example: { group: 'Examples', icon: mdiPlayBoxOutline },
	type: { group: 'Types', icon: mdiShapeOutline },
	css: { group: 'CSS variables', icon: mdiPaletteOutline },
	token: { group: 'Tokens', icon: mdiPaletteSwatchOutline }
};
const ORDER = Object.keys(KINDS) as SearchKind[];

const PER_GROUP = 5;
const TOTAL = 30;

export function expandIndex(index: SearchIndex): SearchEntry[] {
	const entries: SearchEntry[] = [];
	for (const page of index.pages) {
		entries.push({ kind: 'page', label: page.label, description: page.page, href: page.href, context: page.page });
	}
	for (const [name, description] of index.tokens) {
		entries.push({ kind: 'token', label: name, description, href: `/#${anchors.token(name)}` });
	}
	for (const component of index.components) {
		const page = `/components/${component.slug}`;
		const context = component.name;
		const about = (text: string) => (text ? `${context} · ${text}` : context);
		entries.push({
			kind: 'component',
			label: component.name,
			description: component.description,
			href: page,
			text: component.text
		});
		for (const [id, title] of component.examples) {
			entries.push({ kind: 'example', label: title, description: `${context} example`, href: `${page}#${id}`, context });
		}
		const members: [Exclude<SearchKind, 'component' | 'page' | 'example' | 'token'>, Pair[]][] = [
			['prop', component.props],
			['event', component.events],
			['snippet', component.snippets],
			['method', component.methods],
			['type', component.types],
			['css', component.css]
		];
		for (const [kind, rows] of members) {
			for (const [name, text] of rows) {
				entries.push({ kind, label: name, description: about(text), href: `${page}#${anchors[kind](name)}`, context });
			}
		}
	}
	return entries;
}

interface Prepared {
	entry: SearchEntry;
	label: string;
	near: string;
	far: string;
}

export function prepareEntries(entries: SearchEntry[]): Prepared[] {
	return entries.map((entry) => {
		const label = foldText(entry.label);
		const near = entry.context ? `${label} ${foldText(entry.context)}` : label;
		return { entry, label, near, far: entry.text ? `${near} ${foldText(entry.text)}` : near };
	});
}

function score({ label, near, far }: Prepared, query: string, words: string[]) {
	if (label === query) return 0;
	if (label.startsWith(query)) return 1;
	if (label.includes(query)) return 2;
	if (words.every((word) => near.includes(word))) return 3;
	if (far !== near && words.every((word) => far.includes(word))) return 4;
	return -1;
}

export function rankEntries(entries: Prepared[], searchText: string, currentPath = ''): GlobalSearchItem[] {
	const query = foldText(searchText.trim()).replace(/\s+/g, ' ');
	if (!query) return [];
	const words = query.split(' ');
	const elsewhere = (entry: SearchEntry) => Number(!currentPath || entry.href.split('#')[0] !== currentPath);
	const found = entries
		.map((prepared) => ({ prepared, score: score(prepared, query, words) }))
		.filter(({ score }) => score >= 0)
		.sort(
			(a, b) =>
				a.score - b.score ||
				ORDER.indexOf(a.prepared.entry.kind) - ORDER.indexOf(b.prepared.entry.kind) ||
				elsewhere(a.prepared.entry) - elsewhere(b.prepared.entry) ||
				a.prepared.label.length - b.prepared.label.length ||
				a.prepared.label.localeCompare(b.prepared.label)
		);
	const perGroup = new Map<SearchKind, number>();
	const results: GlobalSearchItem[] = [];
	for (const { prepared } of found) {
		const { entry } = prepared;
		const count = perGroup.get(entry.kind) ?? 0;
		if (count >= PER_GROUP) continue;
		perGroup.set(entry.kind, count + 1);
		results.push({
			value: entry.href,
			label: entry.label,
			description: entry.description,
			href: entry.href,
			icon: KINDS[entry.kind].icon,
			group: KINDS[entry.kind].group
		});
		if (results.length === TOTAL) break;
	}
	return results;
}

let loaded: Promise<Prepared[]> | undefined;

function loadIndex() {
	loaded ??= fetch('/search.json')
		.then((response) => {
			if (!response.ok) throw new Error(`Search index: ${response.status}`);
			return response.json() as Promise<SearchIndex>;
		})
		.then((index) => prepareEntries(expandIndex(index)))
		.catch((error) => {
			loaded = undefined;
			throw error;
		});
	return loaded;
}

export async function searchDocs({
	searchText,
	signal,
	currentPath
}: {
	searchText: string;
	signal: AbortSignal;
	currentPath?: string;
}) {
	const entries = await loadIndex();
	signal.throwIfAborted();
	return rankEntries(entries, searchText, currentPath);
}
