<!-- @component
Flag of a country, from the `flag-icons` set: 4:3 by default, square with `square`. `alpha2` is the ISO 3166-1 alpha-2 code in any case (`IT`, `it`); the set also has a few other regions, such as `eu`, `un` and `gb-sct`. The flag is as tall as `--flag-icon-size` (by default a bit taller than the surrounding text). Without `title` it is decorative and hidden from screen readers. The flags are SVG files of the `flag-icons` package, loaded by its CSS: by default Vite inlines the smaller ones (about 320 KB) in the app's CSS; to download each flag only when it is shown, set `build: { assetsInlineLimit: (file) => (file.includes('/flag-icons/') ? false : undefined) }` in `vite.config`.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './FlagIcon.css';

	const ALIASES: Record<string, string> = {
		uk: 'gb',
		el: 'gr',
		xs: 'rs',
		xi: 'gb-nir',
		ac: 'sh-ac',
		ta: 'sh-ta'
	};

	interface Props {
		/** ISO 3166-1 alpha-2 code of the country, in any case (`IT`, `it`). The aliases of version 4 still work: `uk`, `el`, `xs`, `xi`, `ac`, `ta`. */
		alpha2: string;
		/** Shows the square (1:1) version of the flag instead of the 4:3 one. */
		square?: boolean;
		/** Accessible name, for example the country name. Without it the flag is decorative and hidden from screen readers. */
		title?: string;
		/** Extra classes on the `<span>` element. */
		class?: string;
	}

	let { alpha2, square = false, title, class: clazz = '' }: Props = $props();

	let code = $derived(ALIASES[alpha2.toLowerCase()] ?? alpha2.toLowerCase());
</script>

<span
	class="aurora-flag-icon fi fi-{code} {clazz}"
	class:fis={square}
	role={title ? 'img' : undefined}
	aria-label={title}
	aria-hidden={title ? undefined : 'true'}
	{title}
></span>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-flag-icon {
			flex-shrink: 0;
			font-size: var(--flag-icon-size, var(--flag-icon-default-size));
			border-radius: var(--flag-icon-border-radius, var(--flag-icon-default-border-radius));
			box-shadow: var(--flag-icon-box-shadow, var(--flag-icon-default-box-shadow));
			vertical-align: middle;
		}
	}
</style>
