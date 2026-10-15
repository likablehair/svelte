#!/usr/bin/env node
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { analyze } from './analyze.ts';
import { appLabel, markdownReport, summaryTable } from './report.ts';
import { loadRules } from './rules.ts';

const USAGE = `Usage: svelte-migrate analyze <app-dir...> [--md <file|dir>] [--json <file|dir>] [--summary]

  analyze     Read-only report of what the v4 → v5 migration needs in each app.
  --md        Write the Markdown report to a file (one app) or a directory (one file per app).
  --json      Same for the JSON data.
  --summary   Print one table row per app instead of the full reports.`;

function parseArgs(argv: string[]) {
	const options: { command?: string; dirs: string[]; md?: string; json?: string; summary: boolean } = {
		dirs: [],
		summary: false
	};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--md') options.md = argv[++i];
		else if (arg === '--json') options.json = argv[++i];
		else if (arg === '--summary') options.summary = true;
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

const options = parseArgs(process.argv.slice(2));
if (!options || options.command !== 'analyze' || !options.dirs.length) {
	console.log(USAGE);
	process.exit(options ? 1 : 0);
}

const index = loadRules();
const dirs = options.dirs.map((d) => resolve(d)).filter((d) => existsSync(join(d, 'package.json')));
const results = dirs.map((dir) => {
	const analysis = analyze(dir, index);
	const name = appLabel(dir);
	const many = dirs.length > 1;
	if (options.md) writeFileSync(target(options.md, many, name, 'md'), markdownReport(analysis));
	if (options.json) writeFileSync(target(options.json, many, name, 'json'), JSON.stringify(analysis, null, '\t') + '\n');
	if (!options.summary && !options.md && !options.json) process.stdout.write(markdownReport(analysis));
	return analysis;
});
if (options.summary) console.log(summaryTable(results));
