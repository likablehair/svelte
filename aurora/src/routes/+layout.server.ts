import { getGalleryThemes, getThemes, listComponents } from '../docs/api.server.js';

const categories: Record<string, string> = {
	simple: 'Components',
	composed: 'Composed',
	layouts: 'Layouts'
};

export function load() {
	const components = listComponents();
	const nav = [
		{
			title: 'Foundations',
			links: [
				{ href: '/', label: 'Tokens' },
				{ href: '/themes', label: 'Themes' },
				{ href: '/styling', label: 'CSS and Tailwind' }
			]
		},
		...Object.entries(categories)
			.map(([category, title]) => ({
				title,
				links: components
					.filter((c) => c.category === category)
					.map((c) => ({ href: `/components/${c.slug}`, label: c.name }))
			}))
			.filter((g) => g.links.length)
	];
	return { nav, themes: getThemes(), galleryThemes: getGalleryThemes() };
}
