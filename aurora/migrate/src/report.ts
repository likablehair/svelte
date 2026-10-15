import { basename, dirname } from 'node:path';
import type { Analysis } from './analyze.ts';
import type { CodemodChange, CodemodResult, CodemodSkip } from './codemod.ts';
import type { Finding } from './match.ts';

export const appLabel = (dir: string) =>
	basename(dir) === 'frontend' ? basename(dirname(dir)) : basename(dir);

const cell = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
const row = (values: unknown[]) => `| ${values.map(cell).join(' | ')} |`;
const table = (head: string[], rows: unknown[][]) =>
	[row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
const short = (text: string | undefined, max = 160) =>
	!text ? '' : text.length > max ? `${text.slice(0, max - 1)}…` : text;

function group(findings: Finding[]) {
	const groups = new Map<string, Finding[]>();
	for (const f of findings) {
		if (!groups.has(f.id)) groups.set(f.id, []);
		groups.get(f.id)!.push(f);
	}
	return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

const places = (findings: Finding[], max = 4) => {
	const list = findings.slice(0, max).map((f) => `${f.file}:${f.line}${f.via ? ` (via ${basename(f.via)})` : ''}`);
	return findings.length > max ? `${list.join(', ')} … +${findings.length - max}` : list.join(', ');
};

export function markdownReport(a: Analysis): string {
	const out: string[] = [];
	const app = a.app;
	out.push(`# Migration analysis: ${appLabel(app.dir)}`, '');
	out.push(
		[
			`\`${app.dir}\``,
			app.packageManager,
			`@likable-hair/svelte ${app.lib ?? '—'}${app.libInstalled && app.libInstalled !== app.lib?.replace(/^[\^~]/, '') ? ` (installed ${app.libInstalled})` : ''}`,
			`svelte ${app.svelte ?? '—'}`,
			`kit ${app.kit ?? '—'}`,
			app.tailwind ? `tailwind ${app.tailwind}` : 'no tailwind',
			app.git.clean === null ? 'not a git repo' : app.git.clean ? `git clean (${app.git.branch})` : `git: ${app.git.changes} uncommitted changes (${app.git.branch})`
		].join(' · '),
		''
	);
	for (const warning of app.warnings) out.push(`> ${warning}`, '');
	if (!a.usesLibrary) {
		out.push('The app does not use the library.');
		return out.join('\n') + '\n';
	}
	const direct = Object.values(a.components).reduce((s, c) => s + c.usages, 0);
	const via = Object.values(a.components).reduce((s, c) => s + c.via, 0);
	const phase0 = a.phase0.svelte4 || a.phase0.libV3;
	out.push('## Summary', '');
	out.push(
		table(
			['', ''],
			[
				['Files scanned', `${a.files.scanned} (${a.files.svelte} .svelte, ${a.files.importing} import the library)`],
				['Library usages', `${direct} direct, ${via} through wrappers, ${Object.keys(a.components).length} components`],
				['Wrappers', `${a.wrappers.length} (${a.wrappers.filter((w) => w.kind === 'thin').length} thin, ${a.wrappers.filter((w) => w.kind === 'logic').length} with logic), imported by ${a.wrappers.reduce((s, w) => s + w.importers, 0)} files`],
				['Automatic changes', a.totals.auto],
				['To check', a.totals.check],
				['Manual points', `${a.totals.manualPoints} (file × step)`],
				['General checks', `${a.totals.general} (once per component)`],
				['App-level steps', `${a.totals.appSteps} needed, ${a.totals.appReview} to review`],
				['Phase 0', phase0 ? `needed: ${[a.phase0.svelte4 && 'Svelte 4 → 5 (`npx sv migrate svelte-5`)', a.phase0.libV3 && 'library v3 syntax'].filter(Boolean).join(', ')}` : 'not needed'],
				['Parse errors', a.files.parseErrors.length]
			]
		),
		''
	);
	if (phase0)
		out.push(
			'## Phase 0',
			'',
			`- ${a.phase0.legacyFiles} .svelte files use Svelte 4 syntax (\`export let\`, \`$:\`, \`createEventDispatcher\`).`,
			`- On library components: ${a.legacySyntax.on} \`on:\`, ${a.legacySyntax.slot} \`slot="…"\`, ${a.legacySyntax.let} \`let:\`.`,
			''
		);

	out.push('## App-level steps', '');
	out.push(
		table(
			['needed', 'step', 'summary', 'evidence'],
			a.appSteps.map((s) => [
				s.needed === true ? 'yes' : s.needed === false ? 'no' : '?',
				s.component ? `${s.id} (${s.component})` : s.id,
				short(s.summary, 140),
				s.signal ?? ''
			])
		),
		''
	);

	out.push('## Components', '');
	const byComponent = new Map<string, Finding[]>();
	for (const f of a.findings) {
		if (!f.component) continue;
		if (!byComponent.has(f.component)) byComponent.set(f.component, []);
		byComponent.get(f.component)!.push(f);
	}
	out.push(
		table(
			['v4', 'v5', 'status', 'usages', 'via wrappers', 'files', 'auto', 'check', 'manual'],
			Object.entries(a.components)
				.sort((x, y) => y[1].usages + y[1].via - (x[1].usages + x[1].via))
				.map(([name, c]) => {
					const list = byComponent.get(name) ?? [];
					return [
						name,
						c.to ?? '',
						c.status,
						c.usages,
						c.via,
						c.files,
						list.filter((f) => f.effort === 'auto').length,
						list.filter((f) => f.effort === 'check').length,
						list.filter((f) => f.effort === 'manual').length
					];
				})
		),
		''
	);

	if (a.wrappers.length) {
		out.push('## Wrappers', '');
		out.push(
			table(
				['file', 'wraps', 'kind', 'importers', 'usages', 'rest', 'forwarded', 'fixed props / styles', 'logic'],
				a.wrappers.map((w) => [
					w.file,
					w.component,
					w.kind,
					w.importers,
					w.usages,
					w.rest ? 'yes' : 'no',
					Object.entries(w.forwarded)
						.map(([from, to]) => (from === to ? from : `${from}→${to}`))
						.join(', '),
					`${w.fixed.props} / ${w.fixed.styles}`,
					w.logic.join(', ')
				])
			),
			''
		);
	}

	const section = (title: string, effort: Finding['effort']) => {
		const groups = group(a.findings.filter((f) => f.effort === effort));
		if (!groups.length) return;
		out.push(`## ${title}`, '');
		out.push(
			table(
				['step', 'count', 'files', 'what', 'where'],
				groups.map(([id, list]) => [
					id,
					list.length,
					new Set(list.map((f) => f.file)).size,
					short([list[0].to && `→ ${list[0].to}`, list[0].note].filter(Boolean).join('. ')),
					places(list)
				])
			),
			''
		);
	};
	section('Manual points', 'manual');
	section('To check', 'check');

	const autoKinds = new Map<string, number>();
	for (const f of a.findings) if (f.effort === 'auto') autoKinds.set(f.kind, (autoKinds.get(f.kind) ?? 0) + 1);
	if (autoKinds.size) {
		out.push('## Automatic', '');
		out.push(table(['kind', 'count'], [...autoKinds].sort((x, y) => y[1] - x[1])), '');
	}

	if (a.general.length) {
		out.push('## General checks (once per component)', '');
		out.push(
			table(
				['component', 'step', 'usages', 'files', 'summary'],
				a.general.sort((x, y) => y.usages - x.usages).map((g) => [g.component, g.id, g.usages, g.files, short(g.summary)])
			),
			''
		);
	}

	out.push('## Icons, callbacks, tokens', '');
	out.push(
		table(
			['', ''],
			[
				['MDI strings in library attributes', a.icons.attributes],
				['MDI strings elsewhere (data, local components)', `${a.icons.data} in ${a.icons.dataFiles} files`],
				['`mdi` CSS classes in markup', a.icons.classes],
				['`.detail` in library handlers', a.detail.handlers],
				['`.detail` elsewhere (named handlers, types)', `${a.detail.elsewhere} in ${a.detail.files} files`],
				['v4 color tokens (covered by v4-compat.css)', `${a.tokens.uses} uses in ${a.tokens.files} files, ${a.tokens.overrides} overrides, ${a.tokens.rgbVar} rgb(var())`],
				['Style props on library components', a.styleProps]
			]
		),
		''
	);

	const unknown = Object.entries(a.unknown);
	if (unknown.length) {
		out.push('## Unknown props (typos, v3-only names, or attributes)', '');
		out.push(
			table(
				['component', 'names'],
				unknown.map(([component, names]) => [
					component,
					Object.entries(names)
						.sort((x, y) => y[1] - x[1])
						.map(([n, c]) => `${n} ×${c}`)
						.join(', ')
				])
			),
			''
		);
	}

	if (a.files.parseErrors.length) {
		out.push('## Parse errors', '');
		out.push(table(['file', 'error'], a.files.parseErrors.map((e) => [e.file, short(e.error)])), '');
	}
	return out.join('\n') + '\n';
}

export function summaryTable(list: Analysis[]): string {
	return table(
		['app', 'lib', 'svelte', 'pm', 'TW', 'git', 'phase 0', 'files', 'usages', 'wrappers', 'auto', 'check', 'manual pts', 'general', 'app steps (+review)', 'icons in data', '.detail else', 'tokens'],
		list.map((a) => {
			if (!a.usesLibrary) return [appLabel(a.app.dir), '—', a.app.svelte ?? '', a.app.packageManager, '', '', '', '', 'no library'];
			const direct = Object.values(a.components).reduce((s, c) => s + c.usages, 0);
			const via = Object.values(a.components).reduce((s, c) => s + c.via, 0);
			return [
				appLabel(a.app.dir),
				a.app.libInstalled ?? a.app.lib,
				a.app.svelteInstalled ?? a.app.svelte,
				a.app.packageManager,
				a.app.tailwind ? /(\d+)/.exec(a.app.tailwind)?.[1] : '',
				a.app.git.clean === null ? '—' : a.app.git.clean ? 'clean' : `${a.app.git.changes} ch.`,
				[a.phase0.svelte4 && 'Svelte 4', a.phase0.libV3 && 'lib v3'].filter(Boolean).join(' + ') || 'no',
				a.files.importing,
				`${direct} + ${via}`,
				`${a.wrappers.length} (${a.wrappers.filter((w) => w.kind === 'logic').length} logic)`,
				a.totals.auto,
				a.totals.check,
				a.totals.manualPoints,
				a.totals.general,
				`${a.totals.appSteps} (+${a.totals.appReview})`,
				a.icons.data,
				a.detail.elsewhere,
				a.tokens.uses
			];
		})
	);
}

export function codemodReport(r: CodemodResult): string {
	const out: string[] = [];
	const check = r.changes.filter((c) => c.check);
	out.push(`# Codemod: ${appLabel(r.dir)}`, '', `\`${r.dir}\``, '');
	out.push(
		table(
			['', ''],
			[
				['Files changed', r.files.length],
				['Changes', r.changes.length],
				['Done, to check', check.length],
				['Not done (by hand)', r.skipped.length],
				['New defaults to look at', r.defaults.length],
				['Parse errors', r.parseErrors.length]
			]
		),
		''
	);
	const kinds = new Map<string, number>();
	for (const c of r.changes) kinds.set(c.kind, (kinds.get(c.kind) ?? 0) + 1);
	out.push('## Changes by kind', '', table(['kind', 'count'], [...kinds].sort((a, b) => b[1] - a[1])), '');
	const where = (list: { file: string; line: number }[], max = 4) => {
		const shown = list.slice(0, max).map((c) => `${c.file}:${c.line}`).join(', ');
		return list.length > max ? `${shown} … +${list.length - max}` : shown;
	};
	if (check.length) {
		const groups = new Map<string, CodemodChange[]>();
		for (const c of check) groups.set(c.id, [...(groups.get(c.id) ?? []), c]);
		out.push(
			'## Done, to check',
			'',
			table(
				['step', 'count', 'change', 'what to check', 'where'],
				[...groups].map(([id, list]) => [id, list.length, `${list[0].name} → ${list[0].to ?? ''}`, short(list[0].note, 220), where(list)])
			),
			''
		);
	}
	if (r.skipped.length) {
		const groups = new Map<string, CodemodSkip[]>();
		for (const s of r.skipped) {
			const key = `${s.id}\n${s.reason}`;
			groups.set(key, [...(groups.get(key) ?? []), s]);
		}
		out.push(
			'## Not done (by hand)',
			'',
			table(['step', 'count', 'why', 'where'], [...groups.values()].map((list) => [list[0].id, list.length, list[0].reason, where(list)])),
			''
		);
	}
	if (r.defaults.length) {
		const groups = new Map<string, CodemodResult['defaults']>();
		for (const d of r.defaults) {
			const key = `${d.component}.${d.name}`;
			groups.set(key, [...(groups.get(key) ?? []), d]);
		}
		out.push(
			'## New defaults (not written: look at the pages)',
			'',
			table(
				['prop', 'count', 'kind', 'v4 → v5', 'note', 'where'],
				[...groups].map(([key, list]) => [key, list.length, list[0].kind, `${list[0].v4} → ${list[0].v5}`, short(list[0].note, 200), where(list)])
			),
			''
		);
	}
	if (r.parseErrors.length)
		out.push('## Parse errors', '', table(['file', 'error'], r.parseErrors.map((e) => [e.file, e.error])), '');
	const perFile = new Map<string, number>();
	for (const c of r.changes) perFile.set(c.file, (perFile.get(c.file) ?? 0) + 1);
	out.push('## Files', '', table(['file', 'changes'], r.files.map((f) => [f.rel, perFile.get(f.rel) ?? 0])), '');
	return out.join('\n');
}
