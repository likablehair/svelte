import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type Rgb = [number, number, number];
type Lab = [number, number, number];
type Mode = 'light' | 'dark';

const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const NEUTRAL = ['background', 'contrast', 'grey'];
const BRAND: Record<string, string> = {
	primary: 'primary',
	secondary: 'accent',
	error: 'error',
	warning: 'warning',
	success: 'success'
};
const ANCHORS = [
	'surface-pop',
	'surface-solid',
	'bg',
	'bg-2',
	'surface-2',
	'surface-3',
	'border-strong',
	'text-3',
	'text-2',
	'text'
];
const LAYERS = '@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;';

const toLinear = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function toOklab([r, g, b]: Rgb): Lab {
	const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
	const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
	const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
	const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
	];
}

function linearRgb([L, A, B]: Lab): Rgb {
	const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
	const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
	const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	];
}

const inGamut = (lab: Lab) => linearRgb(lab).every((c) => c >= -1e-4 && c <= 1 + 1e-4);

export function toRgb(lab: Lab): Rgb {
	let [L, A, B] = lab;
	if (!inGamut(lab)) {
		let low = 0;
		let high = 1;
		for (let i = 0; i < 30; i++) {
			const mid = (low + high) / 2;
			if (inGamut([L, A * mid, B * mid])) low = mid;
			else high = mid;
		}
		A *= low;
		B *= low;
	}
	return linearRgb([L, A, B]).map((c) => Math.round(Math.min(255, Math.max(0, fromLinear(Math.min(1, Math.max(0, c))))))) as Rgb;
}

function parseColor(text: string): { rgb: Rgb; alpha: number } {
	const value = text.trim();
	const hex = /^#([0-9a-f]{6})$/i.exec(value);
	if (hex) {
		const n = parseInt(hex[1], 16);
		return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 };
	}
	const rgb = /^rgb\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/.exec(value);
	if (rgb) return { rgb: [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])], alpha: rgb[4] ? Number(rgb[4]) : 1 };
	throw new Error(`Unsupported color: ${value}`);
}

function splitLightDark(value: string): [string, string] {
	const inner = /^light-dark\(([\s\S]*)\)$/.exec(value.trim())?.[1];
	if (!inner) return [value, value];
	let depth = 0;
	for (let i = 0; i < inner.length; i++) {
		if (inner[i] === '(') depth++;
		else if (inner[i] === ')') depth--;
		else if (inner[i] === ',' && depth === 0) return [inner.slice(0, i), inner.slice(i + 1)];
	}
	throw new Error(`Malformed light-dark(): ${value}`);
}

export function auroraColors(tokensCss: string): Record<Mode, Record<string, Rgb>> {
	const declared = new Map<string, string>();
	for (const m of tokensCss.matchAll(/--global-color-([a-z0-9-]+)\s*:\s*([^;]+);/g))
		if (!declared.has(m[1])) declared.set(m[1], m[2]);
	const result: Record<Mode, Record<string, Rgb>> = { light: {}, dark: {} };
	(['light', 'dark'] as const).forEach((mode, index) => {
		const pick = (name: string) => {
			const value = declared.get(name);
			if (!value) throw new Error(`Missing token --global-color-${name}`);
			return parseColor(splitLightDark(value)[index]);
		};
		const bg = pick('bg').rgb;
		for (const name of [...ANCHORS, ...Object.values(BRAND)]) {
			const { rgb, alpha } = pick(name);
			result[mode][name] = rgb.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))) as Rgb;
		}
	});
	return result;
}

export function v4Palette(mainCss: string): Record<Mode, Record<string, Rgb>> {
	const result: Record<Mode, Record<string, Rgb>> = { light: {}, dark: {} };
	for (const m of mainCss.matchAll(/--global-color-(light|dark)-([a-z]+-\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g)) {
		const mode = m[1] as Mode;
		if (!result[mode][m[2]]) result[mode][m[2]] = [Number(m[3]), Number(m[4]), Number(m[5])];
	}
	return result;
}

function neutralScale(anchors: Rgb[]) {
	const points = anchors.map(toOklab).sort((a, b) => a[0] - b[0]);
	const min = points[0][0];
	const max = points[points.length - 1][0];
	return (position: number): Lab => {
		const L = min + Math.min(1, Math.max(0, position)) * (max - min);
		for (let i = 1; i < points.length; i++) {
			const [a, b] = [points[i - 1], points[i]];
			if (L <= b[0] || i === points.length - 1) {
				const t = b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (L - a[0]) / (b[0] - a[0])));
				return [L, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
			}
		}
		return points[points.length - 1];
	};
}

const chroma = ([, a, b]: Lab) => Math.hypot(a, b);

function brandStep(step: Lab, v4Base: Lab, aurora: Lab): Lab {
	const [L, L5, La] = [step[0], v4Base[0], aurora[0]];
	const lightness = L >= L5 ? La + ((L - L5) / (1 - L5 || 1)) * (1 - La) : La - ((L5 - L) / (L5 || 1)) * La;
	const scale = chroma(v4Base) > 1e-6 ? chroma(step) / chroma(v4Base) : 1;
	return [lightness, aurora[1] * scale, aurora[2] * scale];
}

export function compatValues(mainCss: string, tokensCss: string): Record<Mode, Record<string, Rgb>> {
	const palette = v4Palette(mainCss);
	const aurora = auroraColors(tokensCss);
	const result: Record<Mode, Record<string, Rgb>> = { light: {}, dark: {} };
	for (const mode of ['light', 'dark'] as const) {
		const v4 = palette[mode];
		const neutralNames = NEUTRAL.flatMap((ramp) => STEPS.map((step) => `${ramp}-${step}`));
		const lightness = neutralNames.map((name) => toOklab(v4[name])[0]);
		const [min, max] = [Math.min(...lightness), Math.max(...lightness)];
		const scale = neutralScale(ANCHORS.map((name) => aurora[mode][name]));
		for (const name of neutralNames) result[mode][name] = toRgb(scale((toOklab(v4[name])[0] - min) / (max - min)));
		for (const [ramp, token] of Object.entries(BRAND)) {
			const base = toOklab(v4[`${ramp}-500`]);
			const target = toOklab(aurora[mode][token]);
			for (const step of STEPS)
				result[mode][`${ramp}-${step}`] =
					step === '500' ? aurora[mode][token] : toRgb(brandStep(toOklab(v4[`${ramp}-${step}`]), base, target));
		}
	}
	return result;
}

export function buildV4Compat(mainCss: string, tokensCss: string): string {
	const values = compatValues(mainCss, tokensCss);
	const names = [...NEUTRAL, ...Object.keys(BRAND)].flatMap((ramp) => STEPS.map((step) => `${ramp}-${step}`));
	const block = (mode: Mode, indent: string) =>
		names
			.map((name) => `${indent}--global-color-${name}: var(--global-color-${mode}-${name}, ${values[mode][name].join(', ')});`)
			.join('\n');
	const triplet = (mode: Mode, token: string) => values[mode][`${token}-500`].join(', ');
	const brand = Object.entries(BRAND)
		.map(
			([ramp, token]) =>
				`\t\t--global-color-${token}: light-dark(\n\t\t\trgb(var(--global-color-light-${ramp}-500, ${triplet('light', ramp)})),\n\t\t\trgb(var(--global-color-dark-${ramp}-500, ${triplet('dark', ramp)}))\n\t\t);`
		)
		.join('\n');
	return [
		LAYERS,
		'',
		'@layer global.base {',
		'\t:root {',
		block('light', '\t\t'),
		'\t}',
		'',
		'\t@media (prefers-color-scheme: dark) {',
		"\t\t:root:not([data-mode='light']) {",
		block('dark', '\t\t\t'),
		'\t\t}',
		'\t}',
		'',
		"\t:root[data-mode='dark'] {",
		block('dark', '\t\t'),
		'\t}',
		'}',
		'',
		'@layer global.theme {',
		'\t:root:not([data-theme]) {',
		brand,
		'\t}',
		'}',
		''
	].join('\n');
}

export const V4_MAIN_CSS = new URL('../v4/css/main.css', import.meta.url);
export const TOKENS_CSS = new URL('../../src/lib/css/tokens.css', import.meta.url);
export const V4_COMPAT_CSS = new URL('../../src/lib/css/v4-compat.css', import.meta.url);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	writeFileSync(V4_COMPAT_CSS, buildV4Compat(readFileSync(V4_MAIN_CSS, 'utf8'), readFileSync(TOKENS_CSS, 'utf8')));
	console.log(fileURLToPath(V4_COMPAT_CSS));
}
