import { MediaQuery } from 'svelte/reactivity';

/** Upper widths in pixels of the breakpoints `xs`, `s`, `m` and `l`; `xl` is everything wider than `l`. The same as v4. */
export const BREAKPOINTS = { xs: 425, s: 768, m: 1024, l: 1440 } as const;

/** Which breakpoint the window is in, as reactive flags. `xs` up to 425px (phones), `s` up to 768px (tablets), `m` up to 1024px (small laptops), `l` up to 1440px, `xl` wider. The components switch to their mobile variant on `mAndDown`. On the server every flag says the window is wide (`xl`). */
export interface Breakpoints {
	/** Up to 425px. */
	readonly xs: boolean;
	/** From 426px to 768px. */
	readonly s: boolean;
	/** From 769px to 1024px. */
	readonly m: boolean;
	/** From 1025px to 1440px. */
	readonly l: boolean;
	/** Wider than 1440px. */
	readonly xl: boolean;
	/** Up to 425px. */
	readonly xsAndDown: boolean;
	/** Up to 768px. */
	readonly sAndDown: boolean;
	/** Up to 1024px: where the components use their mobile variant. */
	readonly mAndDown: boolean;
	/** Up to 1440px. */
	readonly lAndDown: boolean;
	/** Always true. */
	readonly xlAndDown: boolean;
	/** Always true. */
	readonly xsAndUp: boolean;
	/** From 426px. */
	readonly sAndUp: boolean;
	/** From 769px. */
	readonly mAndUp: boolean;
	/** From 1025px. */
	readonly lAndUp: boolean;
	/** From 1441px. */
	readonly xlAndUp: boolean;
}

const upTo = (width: number) => new MediaQuery(`max-width: ${width}px`, false);
const xsDown = upTo(BREAKPOINTS.xs);
const sDown = upTo(BREAKPOINTS.s);
const mDown = upTo(BREAKPOINTS.m);
const lDown = upTo(BREAKPOINTS.l);

/** The breakpoints of the window, reactive in templates, `$derived` and `$effect` (see `Breakpoints`). */
export const breakpoints: Breakpoints = {
	get xs() {
		return xsDown.current;
	},
	get s() {
		return sDown.current && !xsDown.current;
	},
	get m() {
		return mDown.current && !sDown.current;
	},
	get l() {
		return lDown.current && !mDown.current;
	},
	get xl() {
		return !lDown.current;
	},
	get xsAndDown() {
		return xsDown.current;
	},
	get sAndDown() {
		return sDown.current;
	},
	get mAndDown() {
		return mDown.current;
	},
	get lAndDown() {
		return lDown.current;
	},
	get xlAndDown() {
		return true;
	},
	get xsAndUp() {
		return true;
	},
	get sAndUp() {
		return !xsDown.current;
	},
	get mAndUp() {
		return !sDown.current;
	},
	get lAndUp() {
		return !mDown.current;
	},
	get xlAndUp() {
		return !lDown.current;
	}
};
