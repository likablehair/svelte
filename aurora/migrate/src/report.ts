import { basename, dirname } from 'node:path';
import type { Analysis } from './analyze.ts';
import type { CodemodChange, CodemodResult, CodemodSkip } from './codemod.ts';
import type { Finding } from './match.ts';
import type { ErrorPoint, Remaining, ReviewPoint } from './remaining.ts';

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
				['Files deleted', r.deleted.length],
				['Changes', r.changes.length],
				['Done, to check', check.length],
				['Not done (by hand)', r.skipped.length],
				['New defaults to look at', r.defaults.length],
				['Parse errors', r.parseErrors.length]
			]
		),
		''
	);
	if (r.wrappers.length) {
		out.push(
			'## Wrappers',
			'',
			'Each use of a wrapper becomes the library component. Kept from the wrapper: what its props mean and the layout (widths, margins); dropped: its look (colors, padding, heights, radius, shadows), listed here to put back as CSS variables if wanted.',
			'',
			table(
				['wrapper', 'component', 'uses dissolved', 'file', 'props', 'why kept'],
				r.wrappers.map((w) => [
					w.file.replace(/^.*\//, '').replace(/\.svelte$/, ''),
					w.target ?? '—',
					`${w.dissolved} / ${w.usages}`,
					w.deleted ? 'deleted' : 'kept',
					w.props.map((p) => `${p.name}: ${p.handling}`).join('; '),
					w.blockers.join('; ')
				])
			),
			''
		);
		const dropped = r.wrappers.filter((w) => w.dropped.length && w.dissolved);
		if (dropped.length) {
			out.push('### Look dropped with the wrappers', '');
			for (const w of dropped) out.push(`- **${w.file.replace(/^.*\//, '').replace(/\.svelte$/, '')}**: ${w.dropped.map((d) => `\`${d}\``).join(', ')}`);
			out.push('');
		}
	}
	if (r.locals.length) {
		out.push(
			'## Local copies',
			'',
			'Each use of a local copy of a component that the library now has becomes the library component; the copy is deleted when no file imports it any more.',
			'',
			table(
				['copy', 'component', 'uses', 'file'],
				r.locals.map((l) => [l.file, l.to, l.usages, l.deleted ? 'deleted' : 'kept: still imported'])
			),
			''
		);
	}
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
	out.push('## Files', '', table(['file', 'changes'], [...r.files.map((f) => [f.rel, perFile.get(f.rel) ?? 0]), ...r.deleted.map((f) => [f, 'deleted'])]), '');
	return out.join('\n');
}

const KIND_LABEL: Record<ReviewPoint['kind'], string> = {
	manual: 'changed',
	check: 'done, to check',
	'not-done': 'not done',
	default: 'new default'
};

const lineList = (lines: number[], max = 8) =>
	lines.length > max ? `${lines.slice(0, max).join(', ')} … +${lines.length - max}` : lines.join(', ');

function errorGroups(errors: ErrorPoint[]) {
	const groups = new Map<string, { point: ErrorPoint; lines: number[] }>();
	for (const e of errors) {
		const key = e.explanations.length
			? `${e.component}|${e.name}|${e.explanations.map((x) => x.id).join(',')}|${e.via?.tag ?? ''}`
			: `${e.line}|${e.message}`;
		const group = groups.get(key);
		if (group) {
			if (!group.lines.includes(e.line)) group.lines.push(e.line);
		} else groups.set(key, { point: e, lines: [e.line] });
	}
	return [...groups.values()];
}

function errorsMarkdown(errors: ErrorPoint[]): string[] {
	const out: string[] = [];
	for (const { point, lines } of errorGroups(errors)) {
		const what = [point.component, point.name && `\`${point.name}\``, point.via && `on \`<${point.via.tag}>\``].filter(Boolean).join(' ');
		out.push(`- **line ${lineList(lines)}**${what ? ` · ${what}` : ''}: ${short(point.message.split('\n')[0], 220)}`);
		for (const x of point.explanations) out.push(`  - ${x.text} \`${x.id}\``);
		if (!point.explanations.length && !point.hint) out.push('  - No migration rule matches: app code, often a consequence of another error in this file.');
		if (point.hint) out.push(`  - ${point.hint}`);
	}
	return out;
}

function reviewMarkdown(points: ReviewPoint[]): string[] {
	return points.map(
		(p) => `- line ${lineList(p.lines)} · ${KIND_LABEL[p.kind]}${p.component ? ` · ${p.component}` : ''}: ${p.title}${p.text && p.text !== p.title ? ` ${short(p.text, 400)}` : ''} \`${p.id}\``
	);
}

function pagesMarkdown(r: Remaining): string[] {
	const out: string[] = [];
	if (r.layouts.length)
		out.push(
			'Layouts (every page under them):',
			'',
			table(['route', 'file', 'changed files', 'components to look at'], r.layouts.map((p) => [p.route, p.file, p.touched.length, p.components.join(', ')])),
			''
		);
	if (r.pages.length)
		out.push(
			table(['page', 'changed files', 'components to look at', 'file'], r.pages.map((p) => [p.route, p.touched.length, p.components.join(', '), p.file])),
			''
		);
	if (r.global.length) out.push(`Changed files no page imports (app shell, config, or loaded in a way the tool cannot follow): ${r.global.map((f) => `\`${f}\``).join(', ')}`, '');
	return out;
}

function summaryLine(r: Remaining) {
	const errorFiles = r.files.filter((f) => f.errors.length).length;
	const reviewPoints = r.files.reduce((sum, f) => sum + f.review.length, 0);
	return [
		r.check.ran ? `svelte-check: **${r.check.errors} errors** in ${errorFiles} files` : `svelte-check did not run: ${r.check.error ?? 'unknown error'}`,
		`${reviewPoints} points to look at in ${r.files.filter((f) => f.review.length).length} files`,
		`${r.pages.length} pages to try`
	].join(' · ');
}

export function remainingReport(r: Remaining): string {
	const out: string[] = [`# Remaining points: ${appLabel(r.dir)}`, '', `\`${r.dir}\`${r.base ? ` · v4 code read from commit \`${r.base.slice(0, 10)}\`` : ''}`, '', summaryLine(r), ''];
	if (!r.base) out.push('The v4 code could not be read from git (no repository or no branch base): only the svelte-check errors are listed.', '');
	if (r.files.length)
		out.push(
			'## Files',
			'',
			'Errors first (fix them in this order: components before the pages that use them), then the files with only points to look at. `next` shows one file with the details.',
			'',
			table(
				['file', 'errors', 'to look at', 'components'],
				r.files.map((f) => [
					f.file,
					f.errors.length || '',
					f.review.length || '',
					[...new Set([...f.errors.map((e) => e.component), ...f.review.map((p) => p.component)].filter(Boolean))].join(', ')
				])
			),
			''
		);
	out.push('## Pages to try', '', 'Pages that use the changed files, with the components whose behaviour or look changed there. The apps have no tests: open each page, in light and dark, desktop and phone.', '', ...pagesMarkdown(r));
	if (r.general.length)
		out.push(
			'## Changed for every use (per component)',
			'',
			table(['component', 'step', 'what changed', 'uses', 'files'], r.general.map((g) => [g.component, g.id, short(g.summary, 240), g.usages, g.files])),
			''
		);
	if (r.appSteps.length)
		out.push('## App steps', '', table(['step', 'what', 'needed'], r.appSteps.map((s) => [s.id, short(s.summary, 240), s.needed === null ? 'look' : 'yes'])), '');
	if (r.dropped.length) {
		out.push('## Look dropped with the wrappers', '', 'Put any of it back as CSS variables in the app CSS only if the page really needs it.', '');
		for (const w of r.dropped) out.push(`- **${basename(w.wrapper, '.svelte')}** (${w.target ?? '?'}): ${w.dropped.map((d) => `\`${short(d, 90)}\``).join(', ')}`);
		out.push('');
	}
	return out.join('\n');
}

export function nextReport(r: Remaining, file?: string): string {
	const out: string[] = [`# Next: ${appLabel(r.dir)}`, '', summaryLine(r), ''];
	const target = file ? r.files.find((f) => f.file === file || f.file.endsWith(`/${file}`)) : r.files.find((f) => f.errors.length);
	if (file && !target) {
		out.push(`Nothing left in \`${file}\`.`);
		return out.join('\n');
	}
	if (!r.check.ran) out.push(`svelte-check did not run (${r.check.error ?? 'unknown error'}): install the app dependencies and run it again.`, '');
	if (target) {
		out.push(`## ${target.file}`, '');
		if (target.errors.length) out.push(`### Errors (${target.errors.length})`, '', ...errorsMarkdown(target.errors), '');
		if (target.review.length)
			out.push('### To look at in this file', '', 'Behaviour or look changed, or done by the tool with a warning: read them while you are in the file; most need no code.', '', ...reviewMarkdown(target.review), '');
		const others = r.files.filter((f) => f.errors.length && f !== target);
		if (others.length)
			out.push('### Then', '', ...others.slice(0, 10).map((f) => `- ${f.file}: ${f.errors.length} errors`), ...(others.length > 10 ? [`- … ${others.length - 10} more files`] : []), '');
		out.push('Run `next` again after the changes: svelte-check runs again and the list updates.');
		return out.join('\n');
	}
	out.push('No svelte-check errors left. What is left is to look: the points below and the pages.', '');
	for (const f of r.files.filter((f) => f.review.length)) out.push(`### ${f.file}`, '', ...reviewMarkdown(f.review), '');
	out.push('## Pages to try', '', ...pagesMarkdown(r));
	return out.join('\n');
}
