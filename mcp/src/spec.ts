import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Spec } from './types.ts';

export const PACKAGE = '@likable-hair/svelte';
export const MIGRATE_PACKAGE = '@likable-hair/svelte-migrate';

export interface AppInfo {
	dir: string;
	libraryDir?: string;
	libraryVersion?: string;
	declaredVersion?: string;
	major?: number;
	migrating: boolean;
}

export interface LoadedSpec {
	spec: Spec;
	source: 'app' | 'bundled';
	path: string;
}

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'));

function findUp(start: string, relative: string) {
	let dir = resolve(start);
	while (true) {
		const candidate = join(dir, relative);
		if (existsSync(candidate)) return candidate;
		const parent = dirname(dir);
		if (parent === dir) return undefined;
		dir = parent;
	}
}

export function appInfo(cwd: string): AppInfo {
	const packageFile = findUp(cwd, 'package.json');
	const dir = packageFile ? dirname(packageFile) : resolve(cwd);
	const info: AppInfo = { dir, migrating: false };
	let declaresMigrate = false;
	if (packageFile) {
		const pkg = readJson(packageFile);
		info.declaredVersion = pkg.dependencies?.[PACKAGE] ?? pkg.devDependencies?.[PACKAGE];
		declaresMigrate = !!(pkg.dependencies?.[MIGRATE_PACKAGE] ?? pkg.devDependencies?.[MIGRATE_PACKAGE]);
	}
	const installed = findUp(dir, join('node_modules', PACKAGE, 'package.json'));
	if (installed) {
		info.libraryDir = dirname(installed);
		info.libraryVersion = readJson(installed).version;
	}
	const version = info.libraryVersion ?? info.declaredVersion?.match(/\d+(\.\d+)*/)?.[0];
	if (version) info.major = Number(version.split('.')[0]);
	info.migrating = declaresMigrate || (info.major !== undefined && info.major < 5);
	return info;
}

export const bundledDir = () => fileURLToPath(new URL('../bundled/', import.meta.url));

export function loadSpec(app: AppInfo): LoadedSpec {
	const own = app.libraryDir && join(app.libraryDir, 'dist', 'spec.json');
	if (own && existsSync(own)) return { spec: readJson(own), source: 'app', path: own };
	const bundled = join(bundledDir(), 'spec.json');
	if (!existsSync(bundled)) {
		throw new Error(
			`No component specs: ${PACKAGE} in ${app.dir} has no dist/spec.json and this package has no bundled copy (run "pnpm mcp:build" in the library repository).`
		);
	}
	return { spec: readJson(bundled), source: 'bundled', path: bundled };
}

export function skillSource(app: AppInfo, name: string) {
	const own = app.libraryDir && join(app.libraryDir, 'skills', name);
	if (own && existsSync(join(own, 'SKILL.md'))) return own;
	const bundled = join(bundledDir(), 'skills', name);
	return existsSync(join(bundled, 'SKILL.md')) ? bundled : undefined;
}
