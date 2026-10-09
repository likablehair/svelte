import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/visual',
	snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{arg}{ext}',
	fullyParallel: true,
	reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/visual/report' }]],
	outputDir: 'tests/visual/results',
	expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002 } },
	use: { baseURL: 'http://localhost:5181', reducedMotion: 'reduce' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
	webServer: {
		command: 'npx vite dev --port 5181 --strictPort',
		url: 'http://localhost:5181',
		reuseExistingServer: !process.env.CI
	}
});
