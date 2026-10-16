import {
	getComponentDoc,
	getExamples,
	getThemeSources,
	getThemes,
	getTokens,
	listComponents
} from '../src/docs/api.server.ts';
import { componentMarkdown, PACKAGE, tokensMarkdown } from '../src/docs/markdown.ts';
import { getPatterns } from '../src/docs/patterns.server.ts';
import { expandIndex } from '../src/docs/search.ts';
import { searchIndex } from '../src/docs/search.server.ts';
import { stylingMarkdown } from '../src/docs/styling.ts';

export function specSources(version: string) {
	const components = listComponents().flatMap((entry) => {
		const doc = getComponentDoc(entry.slug);
		if (!doc) return [];
		const examples = getExamples(entry.slug);
		return [{ ...doc, examples, markdown: componentMarkdown(doc, examples) }];
	});
	const tokens = getTokens();
	return {
		schema: 1,
		package: PACKAGE,
		version,
		components,
		tokens: { groups: tokens, markdown: tokensMarkdown(tokens, getThemes()) },
		themes: getThemeSources(),
		styling: stylingMarkdown(),
		patterns: getPatterns(),
		search: expandIndex(searchIndex()).map(({ kind, label, description, href, context, text }) => ({
			kind,
			label,
			description,
			href,
			context,
			text
		}))
	};
}
