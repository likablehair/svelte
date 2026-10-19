import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
	TOKENS_CSS,
	V4_COMPAT_CSS,
	V4_MAIN_CSS,
	auroraColors,
	buildV4Compat,
	compatValues,
	toOklab,
	toRgb,
	v4Palette
} from '../scripts/v4-compat.ts';

const main = readFileSync(V4_MAIN_CSS, 'utf8');
const tokens = readFileSync(TOKENS_CSS, 'utf8');
const values = compatValues(main, tokens);
const lightness = (rgb: [number, number, number]) => toOklab(rgb)[0];
const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

describe('v4-compat.css', () => {
	test('is up to date with the v4 palette and the tokens (run `pnpm migrate:compat`)', () => {
		expect(readFileSync(V4_COMPAT_CSS, 'utf8') === buildV4Compat(main, tokens)).toBe(true);
	});

	test('reads the 88 v4 colors of each mode', () => {
		const palette = v4Palette(main);
		expect(Object.keys(palette.light)).toHaveLength(88);
		expect(Object.keys(palette.dark)).toHaveLength(88);
		expect(palette.light['primary-500']).toEqual([69, 93, 201]);
	});

	test('the 500 of every color is the Aurora color of that role', () => {
		const aurora = auroraColors(tokens);
		for (const mode of ['light', 'dark'] as const) {
			expect(values[mode]['primary-500']).toEqual(aurora[mode].primary);
			expect(values[mode]['secondary-500']).toEqual(aurora[mode].accent);
			expect(values[mode]['error-500']).toEqual(aurora[mode].error);
		}
		expect(values.light['primary-500']).toEqual([31, 90, 240]);
	});

	test('every ramp keeps the order of lightness of v4', () => {
		const palette = v4Palette(main);
		for (const mode of ['light', 'dark'] as const)
			for (const ramp of ['background', 'contrast', 'primary', 'error']) {
				const v4 = STEPS.map((s) => lightness(palette[mode][`${ramp}-${s}`]));
				const v5 = STEPS.map((s) => lightness(values[mode][`${ramp}-${s}`]));
				for (let i = 1; i < STEPS.length; i++) expect(Math.sign(v5[i] - v5[i - 1])).toBe(Math.sign(v4[i] - v4[i - 1]));
			}
	});

	test('the extremes of the v4 neutrals become the extremes of Aurora', () => {
		const palette = v4Palette(main);
		const neutrals = ['background', 'contrast', 'grey'].flatMap((ramp) => STEPS.map((s) => `${ramp}-${s}`));
		const darkest = (mode: 'light' | 'dark') =>
			neutrals.reduce((a, b) => (lightness(palette[mode][a]) <= lightness(palette[mode][b]) ? a : b));
		expect(values.light['background-50']).toEqual([255, 255, 255]);
		expect(values.dark[darkest('dark')]).toEqual(auroraColors(tokens).dark.bg);
	});

	test('app overrides win: every v4 name reads --global-color-light-* / -dark-* first', () => {
		const css = buildV4Compat(main, tokens);
		expect(css).toContain('--global-color-background-100: var(--global-color-light-background-100, ');
		expect(css).toContain('--global-color-background-100: var(--global-color-dark-background-100, ');
		expect(css).toContain('rgb(var(--global-color-light-primary-500, 31, 90, 240))');
	});

	test('colors outside sRGB lose chroma, not lightness', () => {
		const lab = toOklab([31, 90, 240]);
		const rgb = toRgb([lab[0], lab[1] * 3, lab[2] * 3]);
		expect(Math.abs(lightness(rgb) - lab[0])).toBeLessThan(0.02);
	});
});
