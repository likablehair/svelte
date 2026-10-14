<!-- @component
Round picture of a person or a thing. With `src` it shows the image; until the image arrives, and when it cannot load, it shows the initials of `name` (first letter of the first and of the last word: "Mario Rossi" → "MR"), or `text` when given, or an icon when there is neither. The background is one of six gradients picked from `name` (or `colorKey`), so the same person always gets the same color; `color` fixes one. `name` is also the accessible name (`alt` changes it, `alt=""` makes the avatar decorative). `src` can also be a `Blob` or `File`, for images downloaded with authentication: the component creates the object URL and revokes it. `status` adds a dot in the bottom-right corner, `ring` a highlight ring. Its state is exposed as `data-size`, `data-shape`, `data-color`, `data-status` and `data-image` (`loading`, `success`, `error`).
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './Avatar.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';
	import { colorIndex, initials } from '../../../utils/avatar.js';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

	const PERSON_ICON =
		'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z';

	interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'color'> {
		/** Image: a URL, or a `Blob`/`File` (for images downloaded with authentication), turned into an object URL that is revoked when it changes or the avatar goes away. An empty string counts as no image. */
		src?: string | Blob;
		/** Full name of the person or thing. It gives the initials, the color and the accessible name. */
		name?: string;
		/** Text shown instead of the initials of `name`, for example a short company name. */
		text?: string;
		/** Accessible name of the avatar. Defaults to `name`; an empty string makes the avatar decorative, as it should be when the name is written next to it. */
		alt?: string;
		/** Value that picks the color instead of `name`, for example the id of the person, so the color does not change when the name does. */
		colorKey?: string | number;
		/** Background: `auto` one of six gradients picked from `colorKey` or `name` (neutral when there is neither), `1` to `6` a fixed one, `primary` the brand gradient, `neutral` grey. */
		color?: 'auto' | 'primary' | 'neutral' | 1 | 2 | 3 | 4 | 5 | 6;
		/** Size: `xs` 24px, `sm` 32px, `md` 40px, `lg` 56px, `xl` 80px. Any other size with `--avatar-size`. */
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		/** `circle` or `square` with rounded corners. */
		shape?: 'circle' | 'square';
		/** Draws a ring around the avatar, for example for the current user or a selected person. */
		ring?: boolean;
		/** Shows a status dot in the bottom-right corner; its meaning is added to the accessible name. */
		status?: 'online' | 'away' | 'busy' | 'offline';
		/** Accessible text of the status. Defaults to "Online", "Away", "Busy" or "Offline", in the language of `locale`. */
		statusLabel?: string;
		/** SVG path of the icon shown when there is no image, `name` or `text`, for example from `@mdi/js`. Defaults to a person. */
		icon?: string;
		/** Native `referrerpolicy` of the image. `no-referrer` lets profile pictures from Google load. */
		referrerpolicy?: ReferrerPolicy;
		/** State of the image: `loading` until it arrives, then `success` or `error`; `undefined` without `src`. Bind it to react to a broken image. */
		imageLoadingStatus?: 'loading' | 'success' | 'error';
		/** BCP 47 locale of the texts (`it` and `en` are built in, other languages fall back to English). Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** The root `<span>` element. */
		avatarElement?: HTMLSpanElement;
		/** Extra classes on the root `<span>` element. */
		class?: string;
		/** Replaces the initials or the icon inside the avatar, under the image. */
		children?: Snippet;
		/** Replaces the status dot in the bottom-right corner, for example with a count or a small icon. */
		badgeSnippet?: Snippet;
	}

	let {
		src,
		name,
		text,
		alt,
		colorKey,
		color = 'auto',
		size = 'md',
		shape = 'circle',
		ring = false,
		status,
		statusLabel,
		icon,
		referrerpolicy = 'no-referrer',
		imageLoadingStatus = $bindable(),
		locale: localeProp,
		avatarElement = $bindable(),
		class: clazz = '',
		children,
		badgeSnippet,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).avatar);

	let blobUrl = $state<string>();
	$effect(() => {
		if (!(src instanceof Blob)) return;
		const url = URL.createObjectURL(src);
		blobUrl = url;
		return () => {
			URL.revokeObjectURL(url);
			blobUrl = undefined;
		};
	});

	let url = $derived(typeof src === 'string' ? src || undefined : blobUrl);
	let loadedUrl = $state<string>();
	let failedUrl = $state<string>();
	let imageStatus = $derived<'loading' | 'success' | 'error' | undefined>(
		url === undefined ? undefined : url === failedUrl ? 'error' : url === loadedUrl ? 'success' : 'loading'
	);
	$effect.pre(() => {
		imageLoadingStatus = imageStatus;
	});

	let shown = $derived(text || initials(name, locale));
	let seed = $derived(colorKey ?? (name?.trim() || text?.trim() || undefined));
	let tone = $derived(color === 'auto' ? (seed === undefined ? 'neutral' : colorIndex(seed)) : color);
	let label = $derived(alt ?? name?.trim() ?? '');
	let statusText = $derived(status ? (statusLabel ?? texts[status]) : undefined);
	let accessibleName = $derived([label, statusText].filter(Boolean).join(', '));
</script>

<span
	{...rest}
	bind:this={avatarElement}
	role={accessibleName ? 'img' : undefined}
	aria-label={accessibleName || undefined}
	aria-hidden={accessibleName ? undefined : 'true'}
	data-size={size}
	data-shape={shape}
	data-color={tone}
	data-ring={ring || undefined}
	data-status={status}
	data-image={imageStatus}
	class="aurora-avatar {clazz}"
>
	<span class="aurora-avatar-content">
		{#if children}
			{@render children()}
		{:else if shown}
			{shown}
		{:else}
			<Icon path={icon ?? PERSON_ICON} />
		{/if}
	</span>
	{#if url && imageStatus !== 'error'}
		<img
			class="aurora-avatar-image"
			src={url}
			alt=""
			{referrerpolicy}
			onload={() => (loadedUrl = url)}
			onerror={() => (failedUrl = url)}
		/>
	{/if}
	{#if badgeSnippet}
		<span class="aurora-avatar-badge">{@render badgeSnippet()}</span>
	{:else if status}
		<span class="aurora-avatar-status"></span>
	{/if}
</span>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-avatar {
			--_size: var(--avatar-default-size);
			--_bg: var(--avatar-default-neutral-background);
			--_color: var(--avatar-default-neutral-color);
			--_radius: var(--avatar-default-border-radius);
			--_gap-width: var(--avatar-gap-width, 0px);
			--_ring-width: 0px;
			--_size-now: var(--avatar-size, var(--_size));
			--icon-size: calc(var(--_size-now) * var(--avatar-icon-scale, var(--avatar-default-icon-scale)));
			--icon-color: currentColor;
			position: relative;
			display: inline-grid;
			place-items: center;
			flex-shrink: 0;
			box-sizing: border-box;
			width: var(--_size-now);
			height: var(--_size-now);
			border: var(--avatar-border, none);
			border-radius: var(--avatar-border-radius, var(--_radius));
			background: var(--avatar-background, var(--_bg));
			color: var(--avatar-color, var(--_color));
			box-shadow:
				0 0 0 var(--_gap-width) var(--avatar-gap-color, var(--avatar-default-gap-color)),
				0 0 0 calc(var(--_gap-width) + var(--_ring-width))
					var(--avatar-ring-color, var(--avatar-default-ring-color));
			font-size: var(--avatar-font-size, calc(var(--_size-now) * var(--avatar-default-font-scale)));
			font-weight: var(--avatar-font-weight, var(--avatar-default-font-weight));
			line-height: 1;
			letter-spacing: 0.01em;
			vertical-align: middle;
			user-select: none;
		}

		.aurora-avatar[data-size='xs'] {
			--_size: var(--avatar-default-xs-size);
		}

		.aurora-avatar[data-size='sm'] {
			--_size: var(--avatar-default-sm-size);
		}

		.aurora-avatar[data-size='lg'] {
			--_size: var(--avatar-default-lg-size);
		}

		.aurora-avatar[data-size='xl'] {
			--_size: var(--avatar-default-xl-size);
		}

		.aurora-avatar[data-color='1'],
		.aurora-avatar[data-color='2'],
		.aurora-avatar[data-color='3'],
		.aurora-avatar[data-color='4'],
		.aurora-avatar[data-color='5'],
		.aurora-avatar[data-color='6'] {
			--_color: var(--avatar-default-color);
		}

		.aurora-avatar[data-color='1'] {
			--_bg: var(--avatar-default-background-1);
		}

		.aurora-avatar[data-color='2'] {
			--_bg: var(--avatar-default-background-2);
		}

		.aurora-avatar[data-color='3'] {
			--_bg: var(--avatar-default-background-3);
		}

		.aurora-avatar[data-color='4'] {
			--_bg: var(--avatar-default-background-4);
		}

		.aurora-avatar[data-color='5'] {
			--_bg: var(--avatar-default-background-5);
		}

		.aurora-avatar[data-color='6'] {
			--_bg: var(--avatar-default-background-6);
		}

		.aurora-avatar[data-color='primary'] {
			--_bg: var(--avatar-default-primary-background);
			--_color: var(--avatar-default-primary-color);
		}

		.aurora-avatar[data-shape='square'] {
			--_radius: var(--avatar-default-square-border-radius);
		}

		.aurora-avatar[data-ring] {
			--_gap-width: var(--avatar-gap-width, var(--avatar-default-ring-gap));
			--_ring-width: var(--avatar-ring-width, var(--avatar-default-ring-width));
		}

		.aurora-avatar-content {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			max-width: 100%;
			overflow: hidden;
			white-space: nowrap;
		}

		.aurora-avatar-image {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			border-radius: inherit;
			object-fit: cover;
		}

		.aurora-avatar-status,
		.aurora-avatar-badge {
			position: absolute;
			right: 0;
			bottom: 0;
		}

		.aurora-avatar-status {
			box-sizing: border-box;
			width: var(--avatar-status-size, var(--avatar-default-status-size));
			min-width: 8px;
			aspect-ratio: 1;
			border: var(--avatar-status-border-width, var(--avatar-default-status-border-width)) solid
				var(--avatar-gap-color, var(--avatar-default-gap-color));
			border-radius: 50%;
			background: var(--avatar-status-color, var(--_status-color));
		}

		.aurora-avatar[data-status='online'] {
			--_status-color: var(--avatar-default-online-status-color);
		}

		.aurora-avatar[data-status='away'] {
			--_status-color: var(--avatar-default-away-status-color);
		}

		.aurora-avatar[data-status='busy'] {
			--_status-color: var(--avatar-default-busy-status-color);
		}

		.aurora-avatar[data-status='offline'] {
			--_status-color: var(--avatar-default-offline-status-color);
		}
	}
</style>
