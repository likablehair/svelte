<!-- @component
Shows the toasts: short messages that appear in a corner of the screen and close by themselves. Mount it once, in the root layout; then call the functions from any component or `.ts` file: `addToast(options)`, `addSuccessToast`, `addErrorToast`, `addWarningToast`, `addInfoToast` (a string is the title, or pass `{ title, description, duration, action, loading, progress, icon, closable, onclose }`), `updateToast(id, patch)` and `removeToast(id)`. Each `add*` returns the toast id. A toast closes after `duration` (5000 ms by default, `0` keeps it open), pauses while the pointer or the focus is on it and while the tab is hidden, and the same message shown twice restarts its timer instead of stacking. Beyond `limit` the oldest toasts close. Screen readers announce new toasts: errors and warnings right away, the others politely. While a `Dialog` or `Drawer` is open the toasts show inside it, because a modal dialog makes the rest of the page inert. The toasts are `AlertBanner`s on an opaque surface, styled with the `--toast-*` variables or replaced with `toastSnippet`.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Toaster.css';
	import type { Snippet } from 'svelte';
	import ToastList from './ToastList.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';
	import { pauseToasts, resumeToasts, toaster, type Toast } from './toasts.svelte.js';

	interface Props {
		/** Corner or edge of the screen. On screens up to 640px wide the toasts take the full width. */
		position?: 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
		/** Maximum number of toasts on screen. When a new one exceeds it, the oldest that would close by itself closes. */
		limit?: number;
		/** Accessible name of the close buttons. Defaults to "Dismiss", in the language of `locale`. */
		closeLabel?: string;
		/** Accessible name of the toast region. Defaults to "Notifications", in the language of `locale`. */
		label?: string;
		/** BCP 47 locale of the texts: `it` and `en` are built in, other languages fall back to English. Defaults to the one set with `setDefaultLocale`, else `en`. It also names the progress bar of a toast without a title ("Loading", "Progress"). */
		locale?: string;
		/** Extra classes on the element that holds the toasts. */
		class?: string;
		/** Replaces each toast. `close` closes it. */
		toastSnippet?: Snippet<[{ toast: Toast; close: () => void }]>;
	}

	let {
		position = 'bottom-end',
		limit = 5,
		closeLabel,
		label,
		locale: localeProp,
		class: clazz,
		toastSnippet
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).toaster);

	$effect(() => {
		toaster.config = {
			position,
			limit,
			closeLabel: closeLabel ?? texts.close,
			label: label ?? texts.label,
			loadingLabel: texts.loading,
			progressLabel: texts.progress,
			className: clazz,
			toastSnippet
		};
	});

	$effect(() => {
		const update = () => {
			if (document.hidden) pauseToasts('hidden');
			else resumeToasts('hidden');
		};
		update();
		document.addEventListener('visibilitychange', update);
		return () => {
			document.removeEventListener('visibilitychange', update);
			resumeToasts('hidden');
		};
	});
</script>

<ToastList base />
