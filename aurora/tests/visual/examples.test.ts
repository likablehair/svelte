import { readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const root = new URL('../../src/docs/examples/', import.meta.url);
const examples = readdirSync(root).flatMap((slug) =>
	readdirSync(new URL(`${slug}/`, root))
		.filter((file) => file.endsWith('.svelte'))
		.map((file) => ({ slug, id: file.replace(/\.svelte$/, '') }))
);
const appearances = [
	{ theme: 'aurora', mode: 'light' },
	{ theme: 'aurora', mode: 'dark' },
	{ theme: 'classic', mode: 'light' },
	{ theme: 'classic', mode: 'dark' }
];

for (const { slug, id } of examples) {
	for (const { theme, mode } of appearances) {
		test(`${slug}/${id} ${theme} ${mode}`, async ({ page }) => {
			await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
			await page.clock.setFixedTime(new Date(2026, 8, 24, 10));
			await page.addInitScript(
				([theme, mode]) => {
					if (theme !== 'aurora') localStorage.setItem('aurora-docs-theme', theme);
					localStorage.setItem('aurora-docs-mode', mode);
				},
				[theme, mode]
			);
			await page.goto(`/examples/${slug}/${id}`, { waitUntil: 'networkidle' });
			await expect(page.locator('.example-frame')).toHaveScreenshot(
				`${slug}/${id}-${theme}-${mode}.png`
			);
		});
	}
}
