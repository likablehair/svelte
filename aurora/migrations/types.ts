export interface Rename {
	from: string;
	to: string;
	native?: true;
	note?: string;
}

export interface Removal {
	name: string;
	note: string;
	replacement?: string;
}

export interface DefaultChange {
	name: string;
	v4: string;
	v5: string;
	keepV4?: string;
	note?: string;
}

export interface ValueChange {
	name: string;
	values: Record<string, string>;
	note?: string;
}

export interface TypeChange {
	name: string;
	v4: string;
	v5: string;
	note?: string;
}

export interface Changed {
	name: string;
	native?: true;
	note: string;
}

export interface PropToCssVar {
	name: string;
	cssVar: string;
	note?: string;
}

export interface PropRules {
	renamed?: Rename[];
	inverted?: Rename[];
	removed?: Removal[];
	changed?: Changed[];
	toCssVar?: PropToCssVar[];
	defaults?: DefaultChange[];
	values?: ValueChange[];
	types?: TypeChange[];
	icons?: string[];
}

export interface EventChange {
	name: string;
	to?: string;
	argument?: Record<string, string | null>;
	type?: string;
	note?: string;
}

export interface EventRules {
	changed?: EventChange[];
	removed?: Removal[];
}

export interface SnippetChange {
	name: string;
	v4: string;
	v5: string;
	note?: string;
}

export interface SnippetRules {
	renamed?: Rename[];
	removed?: Removal[];
	parameters?: SnippetChange[];
}

export interface CssVarRules {
	renamed?: Rename[];
	removed?: Removal[];
	changed?: Changed[];
}

export interface ManualTrigger {
	props?: string[];
	events?: string[];
	snippets?: string[];
	cssVars?: string[];
}

export interface ManualStep {
	id: string;
	summary: string;
	action: string;
	when?: ManualTrigger;
	scope?: 'usage' | 'app';
}

export interface ComponentMigration {
	from: string;
	to: string;
	props?: PropRules;
	events?: EventRules;
	snippets?: SnippetRules;
	cssVars?: CssVarRules;
	manual?: ManualStep[];
	added?: string[];
}

export interface TokenMapping {
	v4: string[];
	role: string;
	v5: string;
}

export interface ExportChange {
	name: string;
	kind: 'component' | 'function' | 'store' | 'type' | 'utility';
	replacement?: string;
	pending?: true;
	note?: string;
}

export interface GlobalMigration {
	package: {
		svelte: string;
		droppedDependencies: string[];
		add: string[];
		exports: { removed: string[]; added: string[] };
	};
	layers: { app: string; themeFile: string };
	tokens: {
		find: string;
		mappings: TokenMapping[];
		usage: { v4: string; v5: string }[];
	};
	icons: {
		find: string;
		transform: string;
	};
	callbacks: {
		argument: Record<string, string>;
	};
	exports: ExportChange[];
	manual: ManualStep[];
}
