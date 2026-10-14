<!-- @component
Renders `defaultSnippet` with the breakpoints of the window as flags (`xs`, `s`, `m`, `l`, `xl`, `sAndDown`, `mAndDown`, `lAndUp`, ...), to show different markup on phones, tablets and desktops. The widths are those of v4 and of the components, which switch to their mobile variant on `mAndDown` (up to 1024px). The same flags are reactive in scripts as `breakpoints`. On the server the window counts as wide (`xl`).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { breakpoints, type Breakpoints } from '../../../utils/breakpoints.svelte.js';

	interface Props {
		/** Content, which receives the flags of the breakpoints (see `Breakpoints`). */
		defaultSnippet?: Snippet<[Breakpoints]>;
	}

	let { defaultSnippet }: Props = $props();
</script>

{@render defaultSnippet?.(breakpoints)}
