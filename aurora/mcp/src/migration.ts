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
	remaining(dir: string, index: RuleIndex): unknown;
	nextReport(result: unknown, file?: string): string;
	remainingReport(result: unknown): string;
}

let loaded: Promise<MigrateModule | undefined> | undefined;

export function loadMigrate(): Promise<MigrateModule | undefined> {
	loaded ??= (async () => {
		try {
			return (await import(MIGRATE_PACKAGE)) as MigrateModule;
		} catch {
			const sibling = new URL('../../migrate/src/index.ts', import.meta.url);
			return existsSync(sibling) ? ((await import(sibling.href)) as MigrateModule) : undefined;
		}
	})();
	return loaded;
}

export const missingMigrate = `The migration tool is not installed. Run \`npm i -D ${MIGRATE_PACKAGE}\` (or \`npx ${MIGRATE_PACKAGE} <command> .\`) and try again.`;

export function componentRules(index: RuleIndex, name: string) {
	const wanted = name.trim().toLowerCase();
	const rules = index.rules.components.filter(
		(rule) => rule.from.toLowerCase() === wanted || rule.to.toLowerCase() === wanted
	);
	if (!rules.length) {
		const names = [...new Set(index.rules.components.map((r) => r.from))].sort();
		return `No migration rule for "${name}". v4 components with rules: ${names.join(', ')}`;
	}
	return rules.map((rule) => `## ${rule.from} → ${rule.to}\n\n\`\`\`json\n${JSON.stringify(rule, null, 2)}\n\`\`\``).join('\n\n');
}

export function migrateSkillDir(appDir: string) {
	const candidates = [
		join(appDir, 'node_modules', MIGRATE_PACKAGE, 'skills', 'aurora-migrate'),
		fileURLToPath(new URL('../../migrate/skills/aurora-migrate', import.meta.url))
	];
	return candidates.find((dir) => existsSync(join(dir, 'SKILL.md')));
}
