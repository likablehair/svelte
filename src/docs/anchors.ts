export const slugify = (title: string) =>
	title
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

const variable = (name: string) => name.replace(/^--/, '');

export const anchors = {
	prop: (name: string) => `prop-${name}`,
	snippet: (name: string) => `snippet-${name}`,
	event: (name: string) => `event-${name}`,
	method: (name: string) => `method-${name}`,
	type: (name: string) => `type-${name}`,
	css: (name: string) => `css-${variable(name)}`,
	token: (name: string) => `token-${variable(name)}`
};
