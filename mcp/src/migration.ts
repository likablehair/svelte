import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MIGRATE_PACKAGE } from './spec.ts';

export { MIGRATE_PACKAGE };

type Analysis = { app: { name?: string }; [key: string]: unknown };
type RuleIndex = {
	rules: {
		global: { layers: { app: string } };
		components: { from: string; to: string; [key: string]: unknown }[];
	};
};

export interface MigrateModule {
	loadRules(): RuleIndex;
	analyze(dir: string, index: RuleIndex): Analysis;
	markdownReport(analysis: Analysis): string;
	setup(
		dir: string,
		analysis: Analysis,
		options: { branch: string; install: boolean; layers: string; packageSpec?: string; locale?: string }
	): { branch: string; changes: string[] };
	codemod(dir: string, index: RuleIndex, options?: { write?: boolean }): { files: unknown[] };
	codemodReport(result: unknown): string;
	currentBranch(dir: string): string;
	requireInstalled?(dir: string): void;
	remaining(dir: string, index: RuleIndex): unknown;
	nextReport(result: unknown, file?: string): string;
	remainingReport(result: unknown): string;
	componentRules(index: RuleIndex, name: string): string;
}

let loaded: Promise<MigrateModule | undefined> | undefined;

export function loadMigrate(): Promise<MigrateModule | undefined> {
	loaded ??= (async () => {
		const sibling = new URL('../../migrate/src/index.ts', import.meta.url);
		if (existsSync(sibling)) return (await import(sibling.href)) as MigrateModule;
		try {
			return (await import(MIGRATE_PACKAGE)) as MigrateModule;
		} catch {
			return undefined;
		}
	})();
	return loaded;
}

export const missingMigrate = `The migration tool is not installed. Run \`npm i -D ${MIGRATE_PACKAGE}\` (or \`npx ${MIGRATE_PACKAGE} <command> .\`) and try again.`;

export function migrateSkillDir(appDir: string) {
	const candidates = [
		join(appDir, 'node_modules', MIGRATE_PACKAGE, 'skills', 'aurora-migrate'),
		fileURLToPath(new URL('../../migrate/skills/aurora-migrate', import.meta.url))
	];
	return candidates.find((dir) => existsSync(join(dir, 'SKILL.md')));
}
