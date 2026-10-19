#!/usr/bin/env node
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setupAgents } from './agents.ts';
import { analyze } from './analyze.ts';
import { codemod } from './codemod.ts';
import { remaining } from './remaining.ts';
import { appLabel, codemodReport, markdownReport, nextReport, remainingReport, summaryTable } from './report.ts';
import { componentRules, loadRules } from './rules.ts';
import { currentBranch, requireInstalled, setup } from './setup.ts';

const USAGE = `Usage:
  svelte-migrate analyze <app-dir...> [--md <file|dir>] [--json <file|dir>] [--summary]
  svelte-migrate setup <app-dir> [--package <version|file.tgz>] [--branch <name>] [--locale <code>] [--no-install]
  svelte-migrate codemod <app-dir> [--dry-run] [--md <file>] [--branch <name>]
  svelte-migrate next <app-dir> [--file <path>]
  svelte-migrate status <app-dir> [--md <file>]
  svelte-migrate rules <Component>

  analyze     Read-only report of what the v4 → v5 migration needs in each app.
  --md        Write the Markdown report to a file (one app) or a directory (one file per app).
  --json      Same for the JSON data.
  --summary   Print one table row per app instead of the full reports.

  setup       Prepare the app: checks that its repository is clean, creates the branch
              (default aurora-v5), records the svelte-check errors the v4 code already has
              (in the git folder: next lists them apart), puts v5 in package.json (a .tgz is copied into vendor/),
              adds @mdi/js and the packages that came with v4, raises svelte to 5.29, installs;
              in the main CSS adds the cascade layer order, the library Tailwind CSS, the library
              fonts, v4-compat.css and the v4 space above ConfirmOrCancelButtons, moves element
              rules into @layer reset; gives a Tailwind 3 config the library preset and dark variant; calls setDefaultLocale in
              the root layout when the app is not in English (from <html lang>, the interface
              text or --locale) and setTitleTemplate with the name of its <title> (PageHeader
              writes the tab title); configures the coding agents of the app (MCP server,
              aurora-design and aurora-migrate skills, AGENTS.md) with @likable-hair/svelte-mcp.
              Can be run again. Never commits.

  codemod     The mechanical changes, on the branch made by setup: renamed components, props,
              events, snippets and CSS variables, callback arguments without \`detail\` (inline
              handlers and functions of the same file, with their types), MDI icon names turned
              into @mdi/js imports, data passed to props (table columns, options, items) and
              snippet parameters in the v5 shape; the Standard* wrappers dissolved into the library components
              (meaning and layout kept, look dropped and listed), wrappers nobody imports any more
              deleted. Running it again changes nothing. Prints what it did, what to check and
              what is left by hand. --dry-run writes nothing. Never commits. Like next and status,
              it stops while v5 is not installed (run the install from the workspace root).

  next        The remaining points, one file at a time: runs svelte-check in the app and
              explains each error with the migration rule behind it (what changed, what to
              write), then the points to write in the same file (code the tool could not
              change). The v4 code is read from git (the commit the migration branch started
              from), so nothing is written in the app. When no errors are left it lists the
              points to write, file by file, then the points to look at (behaviour, look or
              defaults changed) grouped by component with their pages, and the pages to try.
              --file shows that file, with its points to look at, instead of the next one.

  status      The same data for the whole app: files with errors, points to write and to
              look at, components to look at, pages to try (pages that use the changed
              files), changes per component, app steps, look dropped with the wrappers.
              Read-only.

  rules       The whole v4 → v5 rule of a component, by its v4 or v5 name: renames, removed
              props, changed defaults, steps. The v5 API is \`npx svelte-mcp component <Name>\`.`;

interface Options {
	command?: string;
	dirs: string[];
	md?: string;
	json?: string;
	summary: boolean;
	packageSpec?: string;
	locale?: string;
	branch: string;
	install: boolean;
	dryRun: boolean;
	file?: string;
}

function parseArgs(argv: string[]): Options | undefined {
	const options: Options = { dirs: [], summary: false, branch: 'aurora-v5', install: true, dryRun: false };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--md') options.md = argv[++i];
		else if (arg === '--json') options.json = argv[++i];
		else if (arg === '--summary') options.summary = true;
		else if (arg === '--package') options.packageSpec = argv[++i];
		else if (arg === '--branch') options.branch = argv[++i];
		else if (arg === '--locale') options.locale = argv[++i];
		else if (arg === '--no-install') options.install = false;
		else if (arg === '--dry-run') options.dryRun = true;
		else if (arg === '--file') options.file = argv[++i];
		else if (arg === '-h' || arg === '--help') return undefined;
		else if (!options.command) options.command = arg;
		else options.dirs.push(arg);
	}
	return options;
}

function target(path: string, many: boolean, name: string, extension: string) {
	const isDir = many || (existsSync(path) && statSync(path).isDirectory());
	if (!isDir) return path;
	mkdirSync(path, { recursive: true });
	return join(path, `${name}.${extension}`);
}

function runAnalyze(options: Options) {
	const index = loadRules();
	const dirs = options.dirs.map((d) => resolve(d)).filter((d) => existsSync(join(d, 'package.json')));
	const results = dirs.map((dir) => {
		const analysis = analyze(dir, index);
		const name = appLabel(dir);
		const many = dirs.length > 1;
		if (options.md) writeFileSync(target(options.md, many, name, 'md'), markdownReport(analysis));
		if (options.json)
			writeFileSync(target(options.json, many, name, 'json'), JSON.stringify(analysis, null, '\t') + '\n');
		if (!options.summary && !options.md && !options.json) process.stdout.write(markdownReport(analysis));
		return analysis;
	});
	if (options.summary) console.log(summaryTable(results));
}

async function runSetup(options: Options) {
	const dir = resolve(options.dirs[0]);
	const index = loadRules();
	const result = setup(dir, analyze(dir, index), { ...options, layers: index.rules.global.layers.app });
	const changes = [...result.changes, ...(await setupAgents(dir))];
	console.log(`Branch: ${result.branch}`);
	console.log(changes.length ? changes.map((c) => `- ${c}`).join('\n') : 'Nothing to change.');
	if (result.install) console.log(`Installed with \`${result.install}\`.`);
	console.log('Nothing was committed.');
}

function runCodemod(options: Options) {
	const dir = resolve(options.dirs[0]);
	if (!options.dryRun) {
		const branch = currentBranch(dir);
		if (branch !== options.branch)
			throw new Error(`${dir} is on "${branch}", not on "${options.branch}": run setup first (or pass --branch).`);
		requireInstalled(dir);
	}
	const result = codemod(dir, loadRules(), { write: !options.dryRun });
	const report = codemodReport(result);
	if (options.md) writeFileSync(options.md, report);
	else process.stdout.write(report);
	console.log(options.dryRun ? 'Dry run: nothing was written.' : `${result.files.length} files written. Nothing was committed.`);
}

function runNext(options: Options) {
	const dir = resolve(options.dirs[0]);
	requireInstalled(dir);
	process.stdout.write(`${nextReport(remaining(dir, loadRules()), options.file)}\n`);
}

function runStatus(options: Options) {
	const dir = resolve(options.dirs[0]);
	requireInstalled(dir);
	const report = remainingReport(remaining(dir, loadRules()));
	if (options.md) writeFileSync(options.md, report);
	else process.stdout.write(`${report}\n`);
}

function runRules(options: Options) {
	console.log(componentRules(loadRules(), options.dirs.join(' ')));
}

const options = parseArgs(process.argv.slice(2));
const commands: Record<string, (options: Options) => void | Promise<void>> = {
	analyze: runAnalyze,
	setup: runSetup,
	codemod: runCodemod,
	next: runNext,
	status: runStatus,
	rules: runRules
};
if (!options?.command || !commands[options.command] || !options.dirs.length) {
	console.log(USAGE);
	process.exit(options ? 1 : 0);
}
try {
	await commands[options.command](options);
} catch (error) {
	console.error((error as Error).message);
	process.exit(1);
}
