import { createRawSnippet, type Component } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import MediaQueryComponent from '#lib/components/simple/common/MediaQuery.svelte';
import { BREAKPOINTS, breakpoints, type Breakpoints } from '#lib/utils/breakpoints.svelte.js';

const MediaQuery = MediaQueryComponent as Component<any>;

const flags = (value: Breakpoints) =>
	(Object.keys(value) as (keyof Breakpoints)[]).filter((key) => value[key]).sort().join(',');

describe('breakpoints and MediaQuery', () => {
	afterEach(async () => {
		await page.viewport(1280, 800);
	});

	test('the flags follow the widths of v4', async () => {
		expect(BREAKPOINTS).toEqual({ xs: 425, s: 768, m: 1024, l: 1440 });
		const cases: [number, string][] = [
			[400, 'lAndDown,mAndDown,sAndDown,xlAndDown,xs,xsAndDown,xsAndUp'],
			[600, 'lAndDown,mAndDown,s,sAndDown,sAndUp,xlAndDown,xsAndUp'],
			[900, 'lAndDown,m,mAndDown,mAndUp,sAndUp,xlAndDown,xsAndUp'],
			[1280, 'l,lAndDown,lAndUp,mAndUp,sAndUp,xlAndDown,xsAndUp'],
			[1600, 'lAndUp,mAndUp,sAndUp,xl,xlAndDown,xlAndUp,xsAndUp']
		];
		for (const [width, expected] of cases) {
			await page.viewport(width, 700);
			await expect.poll(() => flags(breakpoints)).toBe(expected);
		}
	});

	test('v4 bug: sAndUp is false on xs', async () => {
		await page.viewport(400, 700);
		await expect.poll(() => breakpoints.xs).toBe(true);
		expect(breakpoints.sAndUp).toBe(false);
	});

	test('defaultSnippet receives the flags and follows the window', async () => {
		const content = createRawSnippet((params: () => Breakpoints) => ({
			render: () => '<p></p>',
			setup: (node) => {
				$effect(() => {
					node.textContent = params().mAndDown ? 'mobile' : 'desktop';
				});
			}
		}));
		const screen = await render(MediaQuery, { defaultSnippet: content });
		await expect.element(screen.getByText('desktop')).toBeInTheDocument();
		await page.viewport(800, 700);
		await expect.element(screen.getByText('mobile')).toBeInTheDocument();
	});
});
