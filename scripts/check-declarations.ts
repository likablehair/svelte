import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const missing = readdirSync(dist, { recursive: true, encoding: 'utf8' }).filter(
	(file) =>
		(file.endsWith('.svelte') && !existsSync(`${dist}${file}.d.ts`)) ||
		(file.endsWith('.js') && !existsSync(`${dist}${file.replace(/\.js$/, '.d.ts')}`))
);
if (missing.length) {
	console.error(`Type declarations missing in dist/ (svelte-package printed why, above):\n${missing.map((file) => `  dist/${file}`).join('\n')}`);
	process.exit(1);
}
