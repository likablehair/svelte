import type { Item } from '../components/simple/forms/item.js';

/** Extra data of the country items made by `countryItems`. */
export type CountryData = {
	/** International dialing code with the plus sign, for example `+39`. Missing for territories without one. */
	dialCode?: string;
};

const TABLE =
	'AD376 AE971 AF93 AG1 AI1 AL355 AM374 AO244 AQ AR54 AS1 AT43 AU61 AW297 AX358 AZ994 BA387 ' +
	'BB1 BD880 BE32 BF226 BG359 BH973 BI257 BJ229 BL590 BM1 BN673 BO591 BQ599 BR55 BS1 BT975 ' +
	'BV BW267 BY375 BZ501 CA1 CC61 CD243 CF236 CG242 CH41 CI225 CK682 CL56 CM237 CN86 CO57 ' +
	'CR506 CU53 CV238 CW599 CX61 CY357 CZ420 DE49 DJ253 DK45 DM1 DO1 DZ213 EC593 EE372 EG20 ' +
	'EH212 ER291 ES34 ET251 FI358 FJ679 FK500 FM691 FO298 FR33 GA241 GB44 GD1 GE995 GF594 ' +
	'GG44 GH233 GI350 GL299 GM220 GN224 GP590 GQ240 GR30 GS GT502 GU1 GW245 GY592 HK852 HM ' +
	'HN504 HR385 HT509 HU36 ID62 IE353 IL972 IM44 IN91 IO246 IQ964 IR98 IS354 IT39 JE44 JM1 ' +
	'JO962 JP81 KE254 KG996 KH855 KI686 KM269 KN1 KP850 KR82 KW965 KY1 KZ7 LA856 LB961 LC1 ' +
	'LI423 LK94 LR231 LS266 LT370 LU352 LV371 LY218 MA212 MC377 MD373 ME382 MF590 MG261 MH692 ' +
	'MK389 ML223 MM95 MN976 MO853 MP1 MQ596 MR222 MS1 MT356 MU230 MV960 MW265 MX52 MY60 MZ258 ' +
	'NA264 NC687 NE227 NF672 NG234 NI505 NL31 NO47 NP977 NR674 NU683 NZ64 OM968 PA507 PE51 ' +
	'PF689 PG675 PH63 PK92 PL48 PM508 PN PR1 PS970 PT351 PW680 PY595 QA974 RE262 RO40 RS381 ' +
	'RU7 RW250 SA966 SB677 SC248 SD249 SE46 SG65 SH290 SI386 SJ47 SK421 SL232 SM378 SN221 ' +
	'SO252 SR597 SS211 ST239 SV503 SX1 SY963 SZ268 TC1 TD235 TF TG228 TH66 TJ992 TK690 TL670 ' +
	'TM993 TN216 TO676 TR90 TT1 TV688 TW886 TZ255 UA380 UG256 UM US1 UY598 UZ998 VA39 VC1 ' +
	'VE58 VG1 VI1 VN84 VU678 WF681 WS685 YE967 YT262 ZA27 ZM260 ZW263';

const DIAL_CODES = new Map(
	TABLE.split(' ').map((entry) => [entry.slice(0, 2), entry.slice(2) || undefined] as const)
);

/** ISO 3166-1 alpha-2 codes of the 249 countries and territories, uppercase and in alphabetical order. */
export const countryCodes: readonly string[] = Object.freeze([...DIAL_CODES.keys()]);

const displayNames = new Map<string, Intl.DisplayNames>();

/**
 * Name of a country in a language, from the browser (`Intl.DisplayNames`), so every language works without data in the library.
 * Unknown codes are returned as they are.
 * @param alpha2 ISO 3166-1 alpha-2 code, in any case.
 * @param locale BCP 47 language tag, such as `en`, `it` or `fr-CH`.
 */
export function countryName(alpha2: string, locale = 'en'): string {
	let names = displayNames.get(locale);
	if (!names) {
		names = new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' });
		displayNames.set(locale, names);
	}
	try {
		return names.of(alpha2.toUpperCase()) ?? alpha2;
	} catch {
		return alpha2;
	}
}

/**
 * International dialing code of a country with the plus sign, such as `+39`, or `undefined` for territories without one.
 * @param alpha2 ISO 3166-1 alpha-2 code, in any case.
 */
export function dialCode(alpha2: string): string | undefined {
	const code = DIAL_CODES.get(alpha2.toUpperCase());
	return code && `+${code}`;
}

/**
 * Countries as `Item`s for `CountriesAutocomplete` and the other pickers: `value` is the uppercase ISO code, `label` the name in `locale`, `data.dialCode` the dialing code. Sorted by name in that language.
 * @param locale BCP 47 language tag of the names, such as `en`, `it` or `fr-CH`.
 * @param codes ISO codes to include, for a subset of the countries. Defaults to all of them.
 */
export function countryItems(
	locale = 'en',
	codes: readonly string[] = countryCodes
): Item<CountryData>[] {
	const collator = new Intl.Collator(locale);
	return codes
		.map((code) => ({
			value: code.toUpperCase(),
			label: countryName(code, locale),
			data: { dialCode: dialCode(code) }
		}))
		.sort((a, b) => collator.compare(a.label, b.label));
}
