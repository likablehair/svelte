import type { HierarchyMenuOption } from '../components/simple/navigation/HierarchyMenu.svelte';

function normalize(path: string) {
	let pathname = path;
	try {
		pathname = new URL(path, 'http://localhost').pathname;
	} catch {
		pathname = path;
	}
	return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function optionOfPath(options: HierarchyMenuOption[], currentPath: string) {
	const path = normalize(currentPath);
	let best: { name: string; length: number } | undefined;
	const walk = (list: HierarchyMenuOption[]) => {
		for (const option of list) {
			if (option.href !== undefined) {
				const href = normalize(option.href);
				const hit = href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
				if (hit && (!best || href.length > best.length))
					best = { name: option.name, length: href.length };
			}
			if (option.options) walk(option.options);
		}
	};
	walk(options);
	return best?.name;
}
