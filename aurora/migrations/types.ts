/**
 * Machine-readable migration rules between two major versions of `@likable-hair/svelte`.
 *
 * One file per component (`v4-to-v5/<V5Name>.ts`, default export `ComponentMigration`) plus
 * `v4-to-v5/global.ts` (`GlobalMigration`). The codemod applies the mechanical rules, the MCP
 * server and the migration prompt read everything, `manual` included. `MIGRATION.md` is the
 * human version of the same information.
 */

/** A name that changed: prop, callback, snippet or CSS variable. */
export interface Rename {
	from: string;
	to: string;
	/** Set when `to` is a native HTML attribute rather than a declared prop of the v5 component. */
	native?: true;
	/** Anything the codemod or the agent must know (the rename only holds in some cases, the value changes too, ...). */
	note?: string;
}

/** A name that no longer exists in v5. */
export interface Removal {
	name: string;
	/** Why, and what to do instead. Written for an agent that has to fix the usage. */
	note: string;
	/** Mechanical replacement, when there is one (another prop, a CSS variable, a snippet). */
	replacement?: string;
}

/** A prop whose default changed: usages that omit it look or behave differently. */
export interface DefaultChange {
	name: string;
	/** v4 default, as source code (`'bottom-center'`, `0`, `false`). */
	v4: string;
	/** v5 default, as source code. */
	v5: string;
	/** Attribute to add to keep the v4 behaviour (`placement="bottom"`), when there is one. */
	keepV4?: string;
	note?: string;
}

/** A prop whose accepted values changed: v4 value → v5 value. */
export interface ValueChange {
	name: string;
	values: Record<string, string>;
	note?: string;
}

/** A prop whose type changed (a string that is now an SVG path, a boolean that is now a union, ...). */
export interface TypeChange {
	name: string;
	v4: string;
	v5: string;
	note?: string;
}

/** A name that stays in v5 with a different meaning, default or reach: usages need a check, not a rename. */
export interface Changed {
	name: string;
	/** Set when the name is now a native HTML attribute rather than a declared prop of the v5 component. */
	native?: true;
	note: string;
}

/** A prop that became a CSS variable: `width="200px"` → `--autocomplete-width="200px"`. */
export interface PropToCssVar {
	name: string;
	cssVar: string;
	note?: string;
}

export interface PropRules {
	renamed?: Rename[];
	/** Renamed and negated: `inactive={x}` → `selected={!x}`. */
	inverted?: Rename[];
	removed?: Removal[];
	changed?: Changed[];
	toCssVar?: PropToCssVar[];
	defaults?: DefaultChange[];
	values?: ValueChange[];
	types?: TypeChange[];
	/** Props that took an MDI class name in v4 (`"mdi-plus"`) and take an SVG path in v5 (`{mdiPlus}` from `@mdi/js`). */
	icons?: string[];
}

/** A callback whose name or argument changed. */
export interface EventChange {
	/** v4 callback prop name. */
	name: string;
	/** v5 name, when it changed. */
	to?: string;
	/**
	 * How to read the v5 argument where the v4 code read the v4 one: v4 access path → v5 access
	 * path, both relative to the callback argument; `''` is the argument itself. The longest
	 * matching path wins. `{ 'detail.nativeEvent': '' }` turns `e.detail.nativeEvent` into `e`;
	 * `{ detail: '' }` turns `e.detail.selection` into `e.selection`. `null` means the v4 path has
	 * no v5 counterpart (the usage needs judgement). When present it replaces the global
	 * `callbacks.argument` for this callback: `{}` means the argument did not change.
	 */
	argument?: Record<string, string | null>;
	/** v5 argument type, for the agent. */
	type?: string;
	note?: string;
}

export interface EventRules {
	changed?: EventChange[];
	removed?: Removal[];
}

/** A snippet whose parameters changed. */
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

/** Instance variables (`--button-x`) and component defaults (`--button-default-x`). */
export interface CssVarRules {
	renamed?: Rename[];
	removed?: Removal[];
	changed?: Changed[];
}

/** What makes a manual step relevant to a usage: any listed name present on the component. Without it, every usage is relevant. */
export interface ManualTrigger {
	props?: string[];
	events?: string[];
	snippets?: string[];
	cssVars?: string[];
}

/** A change that needs judgement: the codemod reports it with file and line, the agent follows `action`. */
export interface ManualStep {
	/** Stable id for reports, `<component>-<topic>` in kebab case (`button-loading`). */
	id: string;
	/** What changed, in one sentence. */
	summary: string;
	/** What to look for in the app and how to fix it. */
	action: string;
	when?: ManualTrigger;
	/** `app`: check once per app (config, global CSS) instead of at every usage. Default `usage`. */
	scope?: 'usage' | 'app';
}

export interface ComponentMigration {
	/** v4 export name. */
	from: string;
	/** v5 export name: the file is named after it. */
	to: string;
	props?: PropRules;
	events?: EventRules;
	snippets?: SnippetRules;
	cssVars?: CssVarRules;
	manual?: ManualStep[];
	/** New optional features, one line each: they break nothing. */
	added?: string[];
}

/** A v4 color token and the v5 token that usually replaces it. The mapping is by role, so the agent checks each use. */
export interface TokenMapping {
	/** v4 names without the `--global-color-` prefix (`background-50`). */
	v4: string[];
	/** Typical role of the v4 token in the apps. */
	role: string;
	/** v5 replacement, a full custom property or a short alternative list in words. */
	v5: string;
}

/** A v4 export with no v5 counterpart, or one that moved elsewhere. */
export interface ExportChange {
	name: string;
	kind: 'component' | 'function' | 'store' | 'type' | 'utility';
	/** v5 name or replacement, if any. */
	replacement?: string;
	/** `true` while v5 simply has not ported it yet. */
	pending?: true;
	note?: string;
}

export interface GlobalMigration {
	package: {
		/** Peer range and minimum Svelte version the components need. */
		svelte: string;
		/** v4 runtime dependencies that apps must now declare themselves when they import them. */
		droppedDependencies: string[];
		/** Packages the app usually needs to add. */
		add: string[];
		/** Exports that changed (CSS entry points, `package.json`). */
		exports: { removed: string[]; added: string[] };
	};
	/** The cascade-layer line apps put at the top of their main CSS. */
	layers: { app: string; themeFile: string };
	tokens: {
		/** Pattern of the v4 color tokens (RGB triplets), to find them in app CSS. */
		find: string;
		mappings: TokenMapping[];
		/** How to rewrite `rgb(var(--x))` and `rgb(var(--x), .4)`. */
		usage: { v4: string; v5: string }[];
	};
	icons: {
		/** Pattern of an MDI class name in a prop value. */
		find: string;
		/** How to turn it into an `@mdi/js` import. */
		transform: string;
	};
	callbacks: {
		/** Default argument rewrite for every `on*` callback of a library component. Component rules can override it. */
		argument: Record<string, string>;
	};
	exports: ExportChange[];
	manual: ManualStep[];
}
