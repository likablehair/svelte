import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const src = fileURLToPath(new URL('../src/', import.meta.url));
const dist = fileURLToPath(new URL('../dist/', import.meta.url));

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
const files = readdirSync(src).filter((file) => file.endsWith('.ts') && file !== 'types.ts');
for (const file of files) {
	const { outputText } = ts.transpileModule(readFileSync(src + file, 'utf8'), {
		fileName: file,
		compilerOptions: {
			target: ts.ScriptTarget.ES2023,
			module: ts.ModuleKind.ESNext,
			verbatimModuleSyntax: true,
			rewriteRelativeImportExtensions: true
		}
	});
	writeFileSync(dist + file.replace(/\.ts$/, '.js'), outputText);
}
console.log(`${dist}: ${files.length} files`);
