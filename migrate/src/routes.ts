const PAGE = /^src\/routes\/(?:(.*)\/)?\+page(?:@[^/]*)?\.svelte$/;

export function pageUrl(rel: string): string | undefined {
	const match = PAGE.exec(rel.replaceAll('\\', '/'));
	if (!match) return undefined;
	const segments = (match[1] ?? '').split('/').filter((s) => s && !/^\(.*\)$/.test(s));
	return `/${segments.join('/')}`;
}

export function parentPage(rel: string, pages: Set<string>): string | undefined {
	const url = pageUrl(rel);
	if (url === undefined) return undefined;
	const segments = url.split('/').filter(Boolean);
	for (let i = segments.length - 1; i >= 0; i--) {
		const candidate = segments.slice(0, i);
		if (candidate.some((s) => s.includes('['))) return undefined;
		const href = `/${candidate.join('/')}`;
		if (pages.has(href)) return href;
	}
	return undefined;
}
