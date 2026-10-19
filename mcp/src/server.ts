import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
	componentMarkdown,
	createThemeGuide,
	examples,
	findComponent,
	listComponents,
	listThemes,
	notFound,
	patterns,
	searchDocs,
	SECTIONS,
	theme
} from './docs.ts';
import { DESIGN_SKILL, init, installedSkillVersion, MCP_PACKAGE, MIGRATE_SKILL } from './init.ts';
import { loadMigrate, migrateSkillDir, missingMigrate } from './migration.ts';
import { type AppInfo, appInfo, type LoadedSpec, PACKAGE } from './spec.ts';
import { formatIssues, validateUsage } from './validate.ts';

export const SERVER_VERSION = '0.1.0';

export interface ServerContext {
	app: AppInfo;
	loaded: LoadedSpec;
}

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] });
const failure = (value: string) => ({ ...text(value), isError: true });

export function instructions({ app, loaded }: ServerContext) {
	const { spec } = loaded;
	const lines = [
		`Specs of ${PACKAGE} ${spec.version} (Svelte 5 component library, "Likable Aurora")${loaded.source === 'bundled' ? ', from the copy bundled with this server because the app does not ship them' : ', from the version installed in the app'}.`,
		`For UI work follow the ${DESIGN_SKILL} skill. Never guess a prop, snippet or CSS variable: read get_component (and get_example) first, then check the code with validate_usage.`,
		'Components are imported from the package root; callbacks receive the native event (no { detail }); icons are SVG paths from @mdi/js; style only through each component\'s CSS variables and the --global-* tokens; themes change only the look.'
	];
	if (app.migrating) {
		lines.push(
			`The app is being migrated to ${PACKAGE} v5 (now ${app.libraryVersion ?? app.declaredVersion}): the specs above are the v5 target. Follow the ${MIGRATE_SKILL} skill with the migration_* tools.`
		);
	}
	const skill = installedSkillVersion(app.dir);
	if (skill && skill !== spec.version) {
		lines.push(`The ${DESIGN_SKILL} skill in this app is from ${skill}, the library is ${spec.version}: run \`npx ${MCP_PACKAGE} init\` to update it.`);
	}
	return lines.join('\n');
}

function readAppFile(app: AppInfo, file: string) {
	const path = isAbsolute(file) ? file : join(app.dir, file);
	if (!existsSync(path)) throw new Error(`File not found: ${path}`);
	return { path, code: readFileSync(path, 'utf8') };
}

export function createServer(context: ServerContext) {
	const { app } = context;
	const { spec } = context.loaded;
	const server = new McpServer(
		{ name: 'aurora', title: `${PACKAGE} (Likable Aurora)`, version: SERVER_VERSION },
		{ instructions: instructions(context) }
	);
	const readOnly = { readOnlyHint: true, openWorldHint: false };

	server.registerTool(
		'list_components',
		{
			title: 'List components',
			description: `Every component of ${PACKAGE} ${spec.version}, by category, with one line each.`,
			inputSchema: { category: z.enum(['simple', 'composed', 'layouts']).optional() },
			annotations: readOnly
		},
		async ({ category }) => text(listComponents(spec, category))
	);

	server.registerTool(
		'get_component',
		{
			title: 'Component specs',
			description:
				'Full specs of one component: description, examples, props (type, default, bindable), snippets, events, methods, exported types and CSS variables. Pass sections to get only some of them.',
			inputSchema: {
				name: z.string().describe('Component name, e.g. "DataTable"'),
				sections: z.array(z.enum(SECTIONS)).optional()
			},
			annotations: readOnly
		},
		async ({ name, sections }) => {
			const component = findComponent(spec, name);
			return component ? text(componentMarkdown(component, sections)) : failure(notFound(spec, name));
		}
	);

	server.registerTool(
		'get_example',
		{
			title: 'Component examples',
			description: 'Without id: the list of examples of a component. With id: the Svelte source of that example, ready to adapt.',
			inputSchema: { name: z.string(), id: z.string().optional() },
			annotations: readOnly
		},
		async ({ name, id }) => {
			const component = findComponent(spec, name);
			return component ? text(examples(component, id)) : failure(notFound(spec, name));
		}
	);

	server.registerTool(
		'get_pattern',
		{
			title: 'Page patterns',
			description:
				'Whole pages built only with the library and the tokens (list, detail, form, dashboard). Without name: the list. With name: the Svelte source to start from.',
			inputSchema: { name: z.string().optional() },
			annotations: readOnly
		},
		async ({ name }) => text(patterns(spec, name))
	);

	server.registerTool(
		'search_docs',
		{
			title: 'Search the docs',
			description: 'Search components, props, events, snippets, types, CSS variables, tokens and examples by words.',
			inputSchema: { query: z.string(), limit: z.number().int().min(1).max(50).optional() },
			annotations: readOnly
		},
		async ({ query, limit }) => text(searchDocs(spec, query, limit))
	);

	server.registerTool(
		'get_tokens',
		{
			title: 'Design tokens',
			description: 'The --global-* tokens (colors, radius, shadows, fonts, motion) with light/dark values, and how themes and modes work.',
			annotations: readOnly
		},
		async () => text(spec.tokens.markdown)
	);

	server.registerTool(
		'list_themes',
		{
			title: 'List themes',
			description: 'The default theme, the themes shipped in the package and the gallery themes of the docs.',
			annotations: readOnly
		},
		async () => text(listThemes(spec))
	);

	server.registerTool(
		'get_theme',
		{
			title: 'Get a theme',
			description: 'CSS source of a theme and how to install and activate it in the app (gallery themes are copied into the app).',
			inputSchema: { name: z.string() },
			annotations: readOnly
		},
		async ({ name }) => text(theme(spec, name))
	);

	server.registerTool(
		'get_styling_guide',
		{
			title: 'CSS and Tailwind guide',
			description: 'Cascade layer order, how app CSS overrides the library, resets, Tailwind 3/4 setup and token classes.',
			annotations: readOnly
		},
		async () => text(spec.styling)
	);

	server.registerTool(
		'validate_usage',
		{
			title: 'Check library usage',
			description: `Checks a .svelte file (path relative to the app) or code against the ${PACKAGE} specs: unknown props, snippets and CSS variables, non-bindable binds, on: directives, { detail } in callbacks, components that do not exist in v5, hardcoded colors. Does not replace svelte-check.`,
			inputSchema: {
				file: z.string().optional().describe('Path of a .svelte file, relative to the app'),
				code: z.string().optional().describe('Svelte source, when there is no file')
			},
			annotations: readOnly
		},
		async ({ file, code }) => {
			try {
				if (file) {
					const read = readAppFile(app, file);
					return text(formatIssues(validateUsage(spec, read.code, read.path), relative(app.dir, read.path)));
				}
				if (code) return text(formatIssues(validateUsage(spec, code), 'Code'));
				return failure('Pass file or code.');
			} catch (error) {
				return failure((error as Error).message);
			}
		}
	);

	server.registerPrompt(
		'design-page',
		{
			title: 'Design a page with Aurora',
			description: `Build or redesign a page with ${PACKAGE}, following the ${DESIGN_SKILL} skill.`,
			argsSchema: { page: z.string().describe('What the page is for and what it shows') }
		},
		({ page }) => ({
			messages: [
				{
					role: 'user',
					content: {
						type: 'text',
						text: `Design and build this page with ${PACKAGE}: ${page}\n\nFollow the ${DESIGN_SKILL} skill. Pick the closest page pattern with get_pattern first, read every component you use with get_component and its examples with get_example, use only library components and tokens, then run validate_usage on the files you wrote and svelte-check.`
					}
				}
			]
		})
	);

	server.registerPrompt(
		'create-theme',
		{
			title: 'Create a theme',
			description: 'Create a theme file from a brand color or a mood, using only tokens.',
			argsSchema: { brief: z.string().describe('Brand color, fonts or mood of the theme') }
		},
		({ brief }) => ({
			messages: [
				{
					role: 'user',
					content: {
						type: 'text',
						text: `Create a ${PACKAGE} theme: ${brief}\n\n${createThemeGuide(spec)}`
					}
				}
			]
		})
	);

	if (app.migrating) registerMigration(server, context);
	return server;
}

function registerMigration(server: McpServer, context: ServerContext) {
	const { app } = context;
	const appDir = z.string().optional().describe('App directory (default: the app this server runs in)');
	const target = (dir?: string) => (dir ? (isAbsolute(dir) ? dir : join(app.dir, dir)) : app.dir);
	const run = async <T>(action: (m: NonNullable<Awaited<ReturnType<typeof loadMigrate>>>) => T) => {
		const migrate = await loadMigrate();
		if (!migrate) return failure(missingMigrate);
		try {
			return text(String(action(migrate)));
		} catch (error) {
			return failure((error as Error).message);
		}
	};

	server.registerTool(
		'migration_analyze',
		{
			title: 'Analyze the v4 → v5 migration',
			description: 'Read-only report of what the app needs to move from v4 (or v3) to v5: automatic changes, things to check, manual points by file, app-level steps, wrappers.',
			inputSchema: { dir: appDir },
			annotations: { readOnlyHint: true, openWorldHint: false }
		},
		async ({ dir }) => run((m) => m.markdownReport(m.analyze(target(dir), m.loadRules())))
	);

	server.registerTool(
		'migration_setup',
		{
			title: 'Prepare the app for v5',
			description:
				'Creates the migration branch (the repository must be clean), puts v5 in package.json, prepares the main CSS (layers, fonts, v4-compat.css) and the locale. Does not install packages (tell the user to run the install, from the root of the workspace if the app is in one: migration_codemod, migration_next and migration_status stop until v5 is installed) and never commits.',
			inputSchema: {
				dir: appDir,
				branch: z.string().optional(),
				packageSpec: z.string().optional().describe('Version or path of a .tgz of the library'),
				locale: z.string().optional()
			},
			annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false }
		},
		async ({ dir, branch, packageSpec, locale }) =>
			run((m) => {
				const path = target(dir);
				const index = m.loadRules();
				const result = m.setup(path, m.analyze(path, index), {
					branch: branch ?? 'aurora-v5',
					install: false,
					layers: index.rules.global.layers.app,
					packageSpec,
					locale
				});
				const migrated = appInfo(path);
				const agents = init(migrated, context.loaded.spec.version, { migrateSkill: migrateSkillDir(migrated.dir) });
				const changes = [...result.changes, ...agents.changes.map((c) => `Agents: ${c}`)];
				return [
					`Branch: ${result.branch}`,
					...(changes.length ? changes.map((c) => `- ${c}`) : ['Nothing to change.']),
					'Packages were not installed: ask the user to run the install command of the app, then to restart its dev server with `vite dev --force` if it is running (Vite keeps serving the v4 package it had pre-bundled).',
					'Nothing was committed.'
				].join('\n');
			})
	);

	server.registerTool(
		'migration_codemod',
		{
			title: 'Apply the mechanical changes',
			description:
				'Renames components, props, events, snippets and CSS variables, removes { detail }, turns MDI names into @mdi/js imports, dissolves the Standard* and LabelAnd* app components into the library components (meaning and layout kept, look dropped and listed in the report). Runs on the branch made by migration_setup; dryRun writes nothing. Can be run again. Never commits.',
			inputSchema: { dir: appDir, dryRun: z.boolean().optional(), branch: z.string().optional() },
			annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false }
		},
		async ({ dir, dryRun, branch }) =>
			run((m) => {
				const path = target(dir);
				const wanted = branch ?? 'aurora-v5';
				if (!dryRun && m.currentBranch(path) !== wanted) {
					throw new Error(`The app is not on "${wanted}": run migration_setup first.`);
				}
				if (!dryRun) m.requireInstalled?.(path);
				const result = m.codemod(path, m.loadRules(), { write: !dryRun });
				return `${m.codemodReport(result)}\n${dryRun ? 'Dry run: nothing was written.' : `${result.files.length} files written. Nothing was committed.`}`;
			})
	);

	server.registerTool(
		'migration_next',
		{
			title: 'Next remaining point of the migration',
			description:
				'After migration_codemod: runs svelte-check in the app and returns the next file to fix, each error explained by the migration rule behind it, plus the points to write in the same file. With no errors left, returns the points to write file by file, then the points to look at grouped by component with their pages, and the pages to try. Call it again after each file. Read-only (svelte-kit sync aside).',
			inputSchema: { dir: appDir, file: z.string().optional().describe('Show this file instead of the next one') },
			annotations: { readOnlyHint: true, openWorldHint: false }
		},
		async ({ dir, file }) =>
			run((m) => {
				const path = target(dir);
				m.requireInstalled?.(path);
				return m.nextReport(m.remaining(path, m.loadRules()), file);
			})
	);

	server.registerTool(
		'migration_status',
		{
			title: 'Remaining points of the whole app',
			description:
				'Overview after migration_codemod: files with svelte-check errors, points to write and to look at, components to look at, pages to try (pages that use the changed files), changes per component, app steps, look dropped with the wrappers. Read-only.',
			inputSchema: { dir: appDir },
			annotations: { readOnlyHint: true, openWorldHint: false }
		},
		async ({ dir }) =>
			run((m) => {
				const path = target(dir);
				m.requireInstalled?.(path);
				return m.remainingReport(m.remaining(path, m.loadRules()));
			})
	);

	server.registerTool(
		'migration_rules',
		{
			title: 'Migration rules of a component',
			description: 'The v4 → v5 rules of one component (by v4 or v5 name): renames, removed props, changed defaults, manual steps.',
			inputSchema: { name: z.string() },
			annotations: { readOnlyHint: true, openWorldHint: false }
		},
		async ({ name }) => run((m) => m.componentRules(m.loadRules(), name))
	);

	server.registerPrompt(
		'migrate-app',
		{
			title: 'Migrate the app to v5',
			description: `Move this app from ${PACKAGE} v4 to v5 with the ${MIGRATE_SKILL} skill.`
		},
		() => ({
			messages: [
				{
					role: 'user',
					content: {
						type: 'text',
						text: `Migrate this app from ${PACKAGE} v4 to v5. Follow the ${MIGRATE_SKILL} skill: migration_analyze, then migration_setup (I will run the install), migration_codemod, then migration_next file by file (with migration_rules, get_component and validate_usage), until no errors are left; then show me the pages to try. Do not commit.`
					}
				}
			]
		})
	);
}
