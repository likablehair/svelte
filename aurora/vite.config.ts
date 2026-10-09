import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const compilerOptions = {
	runes: ({ filename }: { filename: string }) =>
		filename.split(/[/\\]/).includes('node_modules') ? undefined : true
};

export default defineConfig({
	plugins: [sveltekit({ compilerOptions })],
	test: {
		projects: [
			{
				plugins: [svelte({ compilerOptions })],
				test: {
					name: 'components',
					include: ['tests/components/**/*.test.ts'],
					setupFiles: ['tests/setup.ts'],
					expect: { requireAssertions: true },
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }, { browser: 'firefox' }],
						viewport: { width: 1280, height: 800 },
						screenshotFailures: false
					}
				}
			},
			{
				test: {
					name: 'node',
					include: ['tests/node/**/*.test.ts'],
					environment: 'node',
					expect: { requireAssertions: true }
				}
			}
		]
	}
});
