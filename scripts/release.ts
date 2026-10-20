import { execFileSync, type ExecFileSyncOptions } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

type Package = { key: string; dir: string; paths: string[]; tagPrefix: string; majorNote?: string };
type Release = Package & { name: string; from: string; version: string; tag: string; notes: string; tarball?: string };

const root = fileURLToPath(new URL('../', import.meta.url));

const packages: Package[] = [
	{ key: 'svelte', dir: '.', paths: ['src/lib', 'skills', 'MIGRATION.md'], tagPrefix: 'v', majorNote: 'What changed and how to migrate: MIGRATION.md.' },
	{ key: 'svelte-migrate', dir: 'migrate', paths: ['migrate', 'migrations'], tagPrefix: 'svelte-migrate@' },
	{ key: 'svelte-mcp', dir: 'mcp', paths: ['mcp', 'src/lib', 'skills'], tagPrefix: 'svelte-mcp@' },
	{ key: 'adonis-filters', dir: 'adonis-filters', paths: ['adonis-filters'], tagPrefix: 'adonis-filters@' }
];

const usage = `Usage: pnpm release [patch | minor | major | <version>] [options]

Checks, builds and publishes the packages to npm in dependency order, then adds the
notes to CHANGELOG.md, commits, tags, pushes and creates the GitHub releases.
Without a version it publishes the versions already written in the package.json files,
skipping the ones already on npm. With patch, minor or major it raises the version of
the packages changed since their last release (of all the ones named with --only).

Options:
  --only <names>  comma-separated packages, among: ${packages.map((p) => p.key).join(', ')}
                  (default: all)
  --tag <tag>     npm dist-tag (default: latest)
  --otp <code>    npm one-time password, if the account asks for one
  --dry-run       runs the checks and builds the packages; changes and publishes nothing
  --yes           does not ask for confirmation
  --help          shows this text`;

const run = (command: string, args: string[], options: ExecFileSyncOptions = {}) =>
	execFileSync(command, args, { cwd: root, stdio: 'inherit', ...options });
const read = (command: string, args: string[], cwd = root) =>
	execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const succeeds = (command: string, args: string[]) => {
	try {
		read(command, args);
		return true;
	} catch {
		return false;
	}
};
const fail = (message: string): never => {
	console.error(`\n${message}`);
	process.exit(1);
};
const step = (title: string) => console.log(`\n▸ ${title}`);

const { values: options, positionals } = (() => {
	try {
		return parseArgs({
			allowPositionals: true,
			options: {
				only: { type: 'string' },
				tag: { type: 'string', default: 'latest' },
				otp: { type: 'string' },
				'dry-run': { type: 'boolean', default: false },
				yes: { type: 'boolean', default: false },
				help: { type: 'boolean', default: false }
			}
		});
	} catch (error) {
		return fail(`${(error as Error).message}\n\n${usage}`);
	}
})();
if (options.help) {
	console.log(usage);
	process.exit(0);
}
const dryRun = options['dry-run'];
const bump = positionals[0];
if (positionals.length > 1) fail(usage);

const selected = options.only
	? options.only.split(',').map((key) => packages.find((p) => p.key === key.trim()) ?? fail(`Unknown package "${key}".\n\n${usage}`))
	: packages;
const ordered = packages.filter((p) => selected.includes(p));

const exactVersion = bump && /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(bump);
if (bump && !exactVersion && !['patch', 'minor', 'major'].includes(bump)) fail(`"${bump}" is not patch, minor, major or a version.\n\n${usage}`);
if (exactVersion && ordered.length > 1) fail('An exact version needs --only with one package.');

const manifestPath = (p: Package) => join(root, p.dir, 'package.json');
const manifest = (p: Package) => JSON.parse(readFileSync(manifestPath(p), 'utf8')) as { name: string; version: string };

function nextVersion(current: string) {
	if (!bump) return current;
	if (exactVersion) return bump;
	const [major, minor, patch] = current.split('-')[0].split('.').map(Number);
	if (bump === 'major') return `${major + 1}.0.0`;
	if (bump === 'minor') return `${major}.${minor + 1}.0`;
	return `${major}.${minor}.${patch + 1}`;
}

function published(name: string, version: string) {
	try {
		return read('pnpm', ['view', `${name}@${version}`, 'version']) === version;
	} catch (error) {
		const output = `${(error as { stdout?: string }).stdout ?? ''}${(error as { stderr?: string }).stderr ?? ''}`;
		if (/NOT_FOUND|not in the npm registry|E404/i.test(output)) return false;
		return fail(`Could not ask npm about ${name}@${version}:\n${output}`);
	}
}

const lastTag = (p: Package, version: string) =>
	read('git', ['tag', '--list', `${p.tagPrefix}*`, '--sort=-v:refname'])
		.split('\n')
		.filter((tag) => /^\d/.test(tag.slice(p.tagPrefix.length)) && tag !== `${p.tagPrefix}${version}`)[0];
const commits = (p: Package, since: string) => read('git', ['log', '--no-merges', '--format=- %s', `${since}..HEAD`, '--', ...p.paths]);

function notes(p: Package, version: string, previous: string | undefined) {
	if (!previous) return '- First release.';
	const major = version.split('.')[0];
	if (previous.slice(p.tagPrefix.length).split('.')[0] !== major) return `- First release of version ${major}.${p.majorNote ? ` ${p.majorNote}` : ''}`;
	return commits(p, previous) || '- Maintenance release.';
}

step('Checking git and npm');
const releases: Release[] = [];
for (const p of ordered) {
	const { name, version: from } = manifest(p);
	const version = nextVersion(from);
	const previous = lastTag(p, version);
	if (bump && !options.only && previous && !commits(p, previous)) {
		console.log(`  ${name}: no changes since ${previous}, skipped.`);
		continue;
	}
	releases.push({ ...p, name, from, version, tag: `${p.tagPrefix}${version}`, notes: notes(p, version, previous) });
}

const pending = releases.filter((r) => {
	if (!published(r.name, r.version)) return true;
	if (bump) fail(`${r.name}@${r.version} is already on npm: choose another version.`);
	console.log(`  ${r.name}@${r.version} is already on npm: skipped.`);
	return false;
});
if (!pending.length) fail('Nothing to publish.');

const branch = read('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
if (!dryRun) {
	if (read('git', ['status', '--porcelain'])) fail('The working tree has uncommitted changes: commit or stash them first.');
	if (!succeeds('pnpm', ['whoami'])) fail('You are not logged in to npm: run `pnpm login` first.');
}

console.log(`\n${dryRun ? 'Dry run, nothing will be published' : 'Will publish'} (branch ${branch}, dist-tag ${options.tag}):`);
for (const r of pending) console.log(`  ${r.name} ${r.from === r.version ? r.version : `${r.from} → ${r.version}`}`);
if (branch !== 'master') console.log(`  Note: you are on "${branch}", not on master.`);
if (!dryRun && !options.yes) {
	const prompt = createInterface({ input: process.stdin, output: process.stdout });
	const answer = await prompt.question('\nContinue? [y/N] ');
	prompt.close();
	if (!/^y(es)?$/i.test(answer.trim())) fail('Stopped.');
}

step('Type check (pnpm check)');
run('pnpm', ['check']);
step('Tests of the tools (vitest, node project)');
run('pnpm', ['exec', 'vitest', 'run', '--project', 'node']);

if (!dryRun) {
	step('Writing versions and CHANGELOG.md');
	for (const r of pending.filter((r) => r.from !== r.version)) {
		const text = readFileSync(manifestPath(r), 'utf8');
		writeFileSync(manifestPath(r), text.replace(/"version":\s*"[^"]*"/, `"version": "${r.version}"`));
	}
	const changelogPath = join(root, 'CHANGELOG.md');
	const changelog = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8') : '# Changelog\n';
	const date = new Date().toISOString().slice(0, 10);
	const sections = pending
		.filter((r) => !changelog.includes(`## ${r.name} ${r.version} `))
		.map((r) => `## ${r.name} ${r.version} (${date})\n\n${r.notes}\n`);
	const [title, ...rest] = changelog.split('\n');
	writeFileSync(changelogPath, [title, '', ...sections, rest.join('\n').trim()].join('\n').trimEnd() + '\n');
}

step('Building the packages');
const destination = mkdtempSync(join(tmpdir(), 'likable-release-'));
for (const r of pending) {
	const path = manifestPath(r);
	const original = readFileSync(path, 'utf8');
	const folder = join(destination, r.key);
	mkdirSync(folder);
	writeFileSync(path, original.replace(/^\s*"private":\s*true,?\r?\n/m, ''));
	try {
		run('pnpm', ['pack', '--pack-destination', folder], { cwd: join(root, r.dir) });
	} finally {
		writeFileSync(path, original);
	}
	r.tarball = join(folder, readdirSync(folder).find((file) => file.endsWith('.tgz')) ?? fail(`pnpm pack wrote no tarball for ${r.name}.`));
	console.log(`  ${r.name}@${r.version}: ${r.tarball}`);
}

if (dryRun) {
	console.log('\nNotes that would go into CHANGELOG.md and the GitHub releases:');
	for (const r of pending) console.log(`\n## ${r.name} ${r.version}\n\n${r.notes}`);
	console.log(`\nDry run done: the tarballs are in ${destination} (open one with tar -tzf). Nothing was published.`);
	process.exit(0);
}

step('Commit and tags');
run('git', ['add', 'CHANGELOG.md', ...pending.map((r) => join(r.dir, 'package.json'))]);
if (!succeeds('git', ['diff', '--cached', '--quiet'])) {
	run('git', ['commit', '-m', `Release ${pending.map((r) => `${r.name} ${r.version}`).join(', ')}`]);
}
for (const r of pending) {
	if (!succeeds('git', ['rev-parse', '--quiet', '--verify', `refs/tags/${r.tag}`])) run('git', ['tag', '-a', r.tag, '-m', `${r.name} ${r.version}`]);
}

step('Publishing to npm');
for (const r of pending) {
	const args = ['publish', r.tarball!, '--access', 'public', '--no-git-checks', '--tag', options.tag];
	if (options.otp) args.push('--otp', options.otp);
	run('pnpm', args);
	console.log(`  ${r.name}@${r.version} published.`);
}

step('Pushing commit and tags');
run('git', ['push', '--follow-tags', 'origin', 'HEAD']);

step('GitHub releases');
const repo = read('git', ['remote', 'get-url', 'origin']).match(/github\.com[:/](.+?)(\.git)?$/)?.[1];
if (!repo || !succeeds('gh', ['auth', 'status'])) {
	console.log('  Skipped: the GitHub CLI (gh) is missing or not logged in. The notes are in CHANGELOG.md.');
} else {
	for (const r of pending) {
		const args = ['release', 'create', r.tag, '--repo', repo, '--title', `${r.name} ${r.version}`, '--notes', r.notes];
		if (r.version.includes('-')) args.push('--prerelease');
		if (r.key !== 'svelte') args.push('--latest=false');
		run('gh', args);
	}
}

console.log(`\nDone: ${pending.map((r) => `${r.name}@${r.version}`).join(', ')}.`);
