export interface Member {
	name: string;
	type?: string;
	optional?: boolean;
	default?: string;
	bindable?: boolean;
	description?: string;
	from?: string;
}

export interface CssVar {
	name: string;
	defaults: { name: string; value: string }[];
	fallback?: string;
	inherits?: string;
}

export interface Example {
	id: string;
	title: string;
	description?: string;
	code: string;
}

export interface ComponentSpec {
	name: string;
	slug: string;
	category: string;
	description?: string;
	htmlElement?: string;
	inherits?: { name: string; slug: string; omitted: string[] };
	props: Member[];
	snippets: Member[];
	events: Member[];
	methods: { name: string; signature: string; description?: string }[];
	cssVars: CssVar[];
	cssDefaultsOnly: { name: string; value: string }[];
	uses?: string[];
	types: { name: string; declaration: string; description?: string }[];
	examples: Example[];
	markdown: string;
}

export interface ThemeSpec {
	name: string;
	gallery: boolean;
	source: string;
	declarations: number;
}

export interface SearchEntry {
	kind: string;
	label: string;
	description?: string;
	href: string;
	context?: string;
	text?: string;
}

export interface PatternSpec {
	id: string;
	title: string;
	description?: string;
	code: string;
}

export interface Spec {
	schema: number;
	package: string;
	version: string;
	components: ComponentSpec[];
	tokens: { groups: { title: string; tokens: { name: string; value: string }[] }[]; markdown: string };
	themes: ThemeSpec[];
	styling: string;
	search: SearchEntry[];
	patterns?: PatternSpec[];
	exports?: string[];
}
