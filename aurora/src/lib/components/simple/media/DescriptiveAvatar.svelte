<!-- @component
Avatar with a title and a subtitle, for example a person with their role in a list, a sidebar or a user menu. The avatar takes its initials and color from `title` (or `name`) and is decorative, since the title is written next to it. With `onclick` the whole thing is a `<button>`, with `href` a link: it gets the focus, a hover background and the pointer cursor; otherwise it is a plain `<div>`. `direction="column"` stacks the avatar over the centered texts, `reverse` puts the avatar at the end. With `compact` only the avatar is shown and the title goes in a Tooltip, for a collapsed sidebar. Everything else works as in `Avatar`, including its props and `--avatar-*` variables. Its state is exposed as `data-direction`, `data-reverse`, `data-compact` and `data-interactive` for app CSS.
-->
<script lang="ts">
	import '../../../css/tokens.css';
	import './DescriptiveAvatar.css';
	import type { ComponentProps, Snippet } from 'svelte';
	import type { HTMLAttributes, MouseEventHandler } from 'svelte/elements';
	import Avatar from './Avatar.svelte';
	import Tooltip from '../common/Tooltip.svelte';

	type AvatarProps = ComponentProps<typeof Avatar>;

	interface Props
		extends Omit<AvatarProps, keyof HTMLAttributes<HTMLSpanElement> | 'text' | 'alt' | 'avatarElement'>,
			Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'class' | 'onclick' | 'color'> {
		/** Main line, usually a name. It also gives the initials and the color of the avatar, unless `name` is set. */
		title?: string;
		/** Second line, smaller and dimmer, for example a role or an email. */
		subtitle?: string;
		/** Text of the avatar instead of the initials of `title`. */
		avatarText?: string;
		/** Background of the avatar: `auto` one of six gradients picked from `colorKey` or the title, `1` to `6` a fixed one, `primary` the brand gradient, `neutral` grey. */
		color?: 'auto' | 'primary' | 'neutral' | 1 | 2 | 3 | 4 | 5 | 6;
		/** `row`: avatar beside the texts; `column`: avatar above the centered texts. */
		direction?: 'row' | 'column';
		/** Puts the avatar after the texts (on the right in a row, below in a column). */
		reverse?: boolean;
		/** Shows only the avatar, with the title and subtitle in a Tooltip, for example in a collapsed sidebar. */
		compact?: boolean;
		/** Makes the whole thing a link to this URL. */
		href?: string;
		/** Native `target` of the link (with `href`). With `_blank`, `rel` defaults to `noopener noreferrer`. */
		target?: '_self' | '_blank' | '_parent' | '_top' | (string & {});
		/** Native `rel` of the link (with `href`). */
		rel?: string;
		/** Makes the whole thing a `<button>` that calls this function. */
		onclick?: MouseEventHandler<HTMLElement>;
		/** Disables the button, or the link (which loses its `href` and gets `aria-disabled`). */
		disabled?: boolean;
		/** The root element: `<button>` with `onclick`, `<a>` with `href`, else `<div>`. */
		descriptiveAvatarElement?: HTMLElement;
		/** Extra classes on the root element. */
		class?: string;
		/** Replaces the title and subtitle, for example to add a badge or a second line. */
		children?: Snippet;
		/** Replaces the avatar. */
		avatarSnippet?: Snippet;
	}

	let {
		title,
		subtitle,
		avatarText,
		direction = 'row',
		reverse = false,
		compact = false,
		href,
		target,
		rel,
		onclick,
		disabled = false,
		descriptiveAvatarElement = $bindable(),
		class: clazz = '',
		children,
		avatarSnippet,
		src,
		name,
		colorKey,
		color,
		size,
		shape,
		ring,
		status,
		statusLabel,
		icon,
		referrerpolicy,
		imageLoadingStatus = $bindable(),
		locale,
		badgeSnippet,
		...rest
	}: Props = $props();

	let rootNode = $state<HTMLElement>();
	let tag = $derived(href !== undefined ? 'a' : onclick ? 'button' : 'div');
	let interactive = $derived(tag !== 'div');
	let elementAttributes = $derived<Record<string, unknown>>(
		tag === 'button'
			? { type: 'button', disabled }
			: tag === 'a'
				? {
						href: disabled ? undefined : href,
						target,
						rel: rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined),
						role: disabled ? 'link' : rest.role,
						'aria-disabled': disabled ? 'true' : undefined
					}
				: {}
	);
	let tooltipTitle = $derived(compact && (title || subtitle) ? (title ?? subtitle) : undefined);
</script>

<svelte:element
	this={tag}
	{...rest}
	bind:this={() => rootNode, (node) => (rootNode = descriptiveAvatarElement = node)}
	{...elementAttributes}
	aria-label={compact && interactive ? (rest['aria-label'] ?? title ?? subtitle) : rest['aria-label']}
	onclick={disabled ? undefined : onclick}
	data-direction={direction}
	data-reverse={reverse || undefined}
	data-compact={compact || undefined}
	data-interactive={interactive || undefined}
	class="aurora-descriptive-avatar {clazz}"
>
	{#if avatarSnippet}
		{@render avatarSnippet()}
	{:else}
		<Avatar
			{src}
			name={name ?? title}
			text={avatarText}
			alt={compact && !interactive ? (title ?? subtitle ?? '') : ''}
			{colorKey}
			{color}
			{size}
			{shape}
			{ring}
			{status}
			{statusLabel}
			{icon}
			{referrerpolicy}
			{locale}
			{badgeSnippet}
			bind:imageLoadingStatus
			class="aurora-descriptive-avatar-avatar"
		/>
	{/if}
	{#if !compact}
		{#if children}
			<span class="aurora-descriptive-avatar-text">{@render children()}</span>
		{:else if title || subtitle}
			<span class="aurora-descriptive-avatar-text">
				{#if title}<span class="aurora-descriptive-avatar-title">{title}</span>{/if}
				{#if subtitle}<span class="aurora-descriptive-avatar-subtitle">{subtitle}</span>{/if}
			</span>
		{/if}
	{/if}
</svelte:element>
{#if tooltipTitle}
	<Tooltip
		activator={rootNode}
		variant={title && subtitle ? 'rich' : 'plain'}
		placement="right"
		title={title && subtitle ? title : undefined}
		text={title && subtitle ? subtitle : tooltipTitle}
	/>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-descriptive-avatar {
			--_padding: 0;
			--_radius: 0;
			display: flex;
			align-items: center;
			gap: var(--descriptive-avatar-image-gap, var(--descriptive-avatar-default-image-gap));
			box-sizing: border-box;
			min-width: 0;
			max-width: 100%;
			margin: 0;
			padding: var(--descriptive-avatar-padding, var(--_padding));
			border: 0;
			border-radius: var(--descriptive-avatar-border-radius, var(--_radius));
			background: var(--descriptive-avatar-background, transparent);
			color: var(--descriptive-avatar-color, var(--descriptive-avatar-default-color));
			font: inherit;
			text-align: start;
			text-decoration: none;
			cursor: var(--descriptive-avatar-cursor, auto);
		}

		.aurora-descriptive-avatar[data-reverse] {
			flex-direction: row-reverse;
			text-align: end;
		}

		.aurora-descriptive-avatar[data-direction='column'] {
			flex-direction: column;
			text-align: center;
		}

		.aurora-descriptive-avatar[data-direction='column'][data-reverse] {
			flex-direction: column-reverse;
		}

		.aurora-descriptive-avatar[data-interactive] {
			--_padding: var(--descriptive-avatar-default-interactive-padding);
			--_radius: var(--descriptive-avatar-default-interactive-border-radius);
			cursor: var(--descriptive-avatar-cursor, pointer);
			transition: background-color var(--global-duration-fast) var(--global-ease);
		}

		.aurora-descriptive-avatar[data-interactive][data-reverse] {
			--_padding: var(--descriptive-avatar-default-interactive-reverse-padding);
		}

		.aurora-descriptive-avatar[data-interactive][data-direction='column'] {
			--_padding: var(--descriptive-avatar-default-interactive-column-padding);
			--_radius: var(--descriptive-avatar-default-interactive-column-border-radius);
		}

		.aurora-descriptive-avatar[data-interactive][data-compact] {
			--_padding: var(--descriptive-avatar-default-interactive-compact-padding);
			--_radius: var(--descriptive-avatar-default-interactive-border-radius);
		}

		@media (hover: hover) {
			.aurora-descriptive-avatar[data-interactive]:hover:not(:disabled, [aria-disabled='true']) {
				background: var(--descriptive-avatar-hover-background, var(--descriptive-avatar-default-hover-background));
			}
		}

		.aurora-descriptive-avatar:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: var(--global-focus-ring-offset);
		}

		.aurora-descriptive-avatar:is(:disabled, [aria-disabled='true']) {
			opacity: var(--descriptive-avatar-disabled-opacity, var(--descriptive-avatar-default-disabled-opacity));
			cursor: not-allowed;
		}

		.aurora-descriptive-avatar-text {
			display: flex;
			flex-direction: column;
			gap: var(--descriptive-avatar-text-gap, var(--descriptive-avatar-default-text-gap));
			min-width: 0;
		}

		.aurora-descriptive-avatar-title,
		.aurora-descriptive-avatar-subtitle {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.aurora-descriptive-avatar-title {
			color: var(--descriptive-avatar-title-color, var(--descriptive-avatar-default-title-color));
			font-size: var(--descriptive-avatar-title-font-size, var(--descriptive-avatar-default-title-font-size));
			font-weight: var(--descriptive-avatar-title-font-weight, var(--descriptive-avatar-default-title-font-weight));
			line-height: 1.3;
		}

		.aurora-descriptive-avatar-subtitle {
			color: var(--descriptive-avatar-subtitle-color, var(--descriptive-avatar-default-subtitle-color));
			font-size: var(--descriptive-avatar-subtitle-font-size, var(--descriptive-avatar-default-subtitle-font-size));
			line-height: 1.3;
		}
	}
</style>
