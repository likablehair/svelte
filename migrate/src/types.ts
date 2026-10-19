import type { ComponentMigration, GlobalMigration } from '../../migrations/types.ts';

export type * from '../../migrations/types.ts';

export interface ComponentApi {
	slug: string;
	generics?: number;
	props: string[];
	bindable: string[];
	defaults: Record<string, string>;
	events: string[];
	snippets: string[];
	native: boolean;
	cssVars: string[];
}

export interface CompiledRules {
	schema: 1;
	package: string;
	from: string;
	to: string;
	v4: { components: string[]; exports: string[] };
	v5: { exports: string[]; components: Record<string, ComponentApi> };
	global: GlobalMigration;
	components: ComponentMigration[];
}
