export interface PropDoc {
	name: string;
	type: string;
	optional: boolean;
	default?: string;
	bindable: boolean;
	description?: string;
	from?: string;
}

export interface SnippetDoc {
	name: string;
	params?: string;
	optional: boolean;
	description?: string;
	from?: string;
}

export interface MethodDoc {
	name: string;
	signature: string;
	description?: string;
}

export interface InheritsDoc {
	name: string;
	slug: string;
	omitted: string[];
}

export interface CssDefault {
	name: string;
	value: string;
}

export interface CssVarDoc {
	name: string;
	defaults: CssDefault[];
	fallback?: string;
	inherits?: string;
}

export interface ComponentEntry {
	name: string;
	slug: string;
	category: string;
	file: string;
}

export interface ComponentDoc extends ComponentEntry {
	description?: string;
	htmlElement?: string;
	inherits?: InheritsDoc;
	props: PropDoc[];
	snippets: SnippetDoc[];
	events: PropDoc[];
	methods: MethodDoc[];
	cssVars: CssVarDoc[];
	cssDefaultsOnly: CssDefault[];
}

export interface ExampleDoc {
	id: string;
	title: string;
	description?: string;
	code: string;
}

export interface TokenGroup {
	title: string;
	tokens: CssDefault[];
}
