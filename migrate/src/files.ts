import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['node_modules', '.svelte-kit', '.git', 'build', 'dist', '.vercel', '.netlify']);
const EXTENSIONS = /\.(svelte|ts|js|mjs|cjs|css|pcss|postcss|scss|html)$/;

export function listFiles(dir: string): string[] {
	const out: string[] = [];
	const visit = (current: string) => {
		let entries: string[];
		try {
			entries = readdirSync(current);
		} catch {
			return;
		}
		for (const name of entries.sort()) {
			if (SKIP.has(name)) continue;
			const path = join(current, name);
			let stats;
			try {
				stats = statSync(path);
			} catch {
				continue;
			}
			if (stats.isDirectory()) visit(path);
			else if (EXTENSIONS.test(name) && !name.endsWith('.d.ts')) out.push(path);
		}
	};
	visit(dir);
	return out;
}

export class Lines {
	private starts: number[] = [0];

	constructor(text: string) {
		for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) this.starts.push(i + 1);
	}

	at(offset: number): number {
		let low = 0;
		let high = this.starts.length - 1;
		while (low < high) {
			const mid = (low + high + 1) >> 1;
			if (this.starts[mid] <= offset) low = mid;
			else high = mid - 1;
		}
		return low + 1;
	}
}
