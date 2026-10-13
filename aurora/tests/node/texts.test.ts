import { describe, expect, test } from 'vitest';
import { formatLetters, libraryTexts, TEXTS_EN, TEXTS_IT } from '../../src/lib/utils/texts.js';

const SAME_IN_ITALIAN = ['table.no', 'timePicker.period'];

function entries(texts: object, prefix = ''): [string, string][] {
	return Object.entries(texts).flatMap(([key, value]) =>
		typeof value === 'string'
			? [[`${prefix}${key}`, value] as [string, string]]
			: entries(value as object, `${prefix}${key}.`)
	);
}

describe('library texts', () => {
	test('Italian has every English key and no empty text', () => {
		const italian = new Map(entries(TEXTS_IT));
		expect(entries(TEXTS_EN).map(([key]) => key).filter((key) => !italian.has(key))).toEqual([]);
		expect(entries(TEXTS_IT).map(([key]) => key)).toEqual(entries(TEXTS_EN).map(([key]) => key));
		expect([...italian].filter(([, text]) => !text.trim()).map(([key]) => key)).toEqual([]);
		expect(entries(TEXTS_EN).filter(([, text]) => !text.trim()).map(([key]) => key)).toEqual([]);
	});

	test('every Italian text differs from the English one, except the listed ones', () => {
		const italian = new Map(entries(TEXTS_IT));
		const same = entries(TEXTS_EN)
			.filter(([key, text]) => italian.get(key) === text)
			.map(([key]) => key);
		expect(same).toEqual(SAME_IN_ITALIAN);
	});

	test('placeholders are kept in the translation', () => {
		const italian = new Map(entries(TEXTS_IT));
		for (const [key, text] of entries(TEXTS_EN)) {
			const placeholders = (value: string) => value.match(/\{\w+\}/g) ?? [];
			expect(placeholders(italian.get(key)!), key).toEqual(placeholders(text));
		}
	});

	test('libraryTexts picks the language of the locale, English for the others', () => {
		expect(libraryTexts('it')).toBe(TEXTS_IT);
		expect(libraryTexts('it-IT')).toBe(TEXTS_IT);
		expect(libraryTexts('IT_ch')).toBe(TEXTS_IT);
		expect(libraryTexts('en-GB')).toBe(TEXTS_EN);
		expect(libraryTexts('fr')).toBe(TEXTS_EN);
		expect(libraryTexts('')).toBe(TEXTS_EN);
	});

	test('formatLetters writes a date format with the letters of the language', () => {
		expect(formatLetters('dd/MM/yyyy', TEXTS_EN.dateLetters)).toBe('dd/mm/yyyy');
		expect(formatLetters('dd/MM/yyyy', TEXTS_IT.dateLetters)).toBe('gg/mm/aaaa');
		expect(formatLetters('yyyy-MM-dd', TEXTS_IT.dateLetters)).toBe('aaaa-mm-gg');
		expect(formatLetters('dd.MM.yyyy', 'tmj')).toBe('tt.mm.jjjj');
	});
});
