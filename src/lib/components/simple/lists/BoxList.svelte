<!-- @component
Grid of cards, each with an icon, a label and a description, usually the entry points of a section (settings, reports, tools). A box with `href` is a link, one without is a button when it has its own `onclick` or `onboxClick` is set, and a plain card otherwise; `onboxClick` is called for links too. The grid fills the width with as many columns as fit (`--box-list-min-width` each, one column on a phone). `color` gives a box a different icon tone. Its state is exposed as `data-color` and `data-interactive` on each box for app CSS.
-->
<script lang="ts" module>
	/** One card of a `BoxList`. */
	export interface BoxListItem<Data = unknown> {
		/** Unique key of the box in the list, passed back to `onboxClick`. */
		name: string;
		/** Main text of the box, also its accessible name. */
		label: string;
		/** Secondary text under the label, always visible. Screen readers read it as the description of the box. */
		description?: string;
		/** SVG path of the icon shown in a tile above the label. */
		icon?: string;
		/** Tone of the icon tile: `primary` (the default) or one of the six data colors of the theme. */
		color?: 'primary' | 1 | 2 | 3 | 4 | 5 | 6;
		/** Makes the box a link to this URL. */
		href?: string;
		/** Called when this box is clicked, before `onboxClick`. A box without `href` becomes a button. */
		onclick?: (event: MouseEvent) => void;
		/** Disables the box: a button gets `disabled`, a link loses its `href` and gets `aria-disabled`; `onclick` and `onboxClick` are not called. */
		disabled?: boolean;
		/** Extra classes on the box element. */
		class?: string;
		/** Any app data, passed back to the snippets and to `onboxClick`. */
		data?: Data;
	}
</script>

<script lang="ts" generics="Data">
	import '../../../css/tokens.css';
	import './BoxList.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '../media/Icon.svelte';

	interface Props extends Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'children'> {
		/** The boxes, shown in this order. */
		boxes: BoxListItem<Data>[];
		/** Called when a box is clicked, links included (before the navigation), after the `onclick` of the box. Without it, the boxes without `href` or `onclick` are plain cards. */
		onboxClick?: (args: { box: BoxListItem<Data>; event: MouseEvent }) => void;
		/** Extra classes on the list. */
		class?: string;
		/** The `<ul>` element. */
		boxListElement?: HTMLUListElement;
		/** Replaces the whole content of each box (icon, label, description, prepend and append), inside the link or button of the library. */
		boxSnippet?: Snippet<[{ box: BoxListItem<Data>; index: number }]>;
		/** Replaces the icon tile, also in the boxes without `icon`. */
		iconSnippet?: Snippet<[{ box: BoxListItem<Data> }]>;
		/** Replaces the label. */
		labelSnippet?: Snippet<[{ box: BoxListItem<Data> }]>;
		/** Replaces the description, for example to render rich text; shown in every box. */
		descriptionSnippet?: Snippet<[{ box: BoxListItem<Data> }]>;
		/** Content before the icon and the texts, on the start side of the box, such as an avatar. */
		prependSnippet?: Snippet<[{ box: BoxListItem<Data>; index: number }]>;
		/** Content after the texts, on the end side of the box, such as an arrow or a badge. */
		appendSnippet?: Snippet<[{ box: BoxListItem<Data>; index: number }]>;
	}

	let {
		boxes,
		onboxClick,
		class: clazz = '',
		boxListElement = $bindable(),
		boxSnippet,
		iconSnippet,
		labelSnippet,
		descriptionSnippet,
		prependSnippet,
		appendSnippet,
		...rest
	}: Props = $props();

	const uid = $props.id();

	function tagOf(box: BoxListItem<Data>): 'a' | 'button' | 'div' {
		return box.href !== undefined ? 'a' : onboxClick || box.onclick ? 'button' : 'div';
	}

	function attributesOf(box: BoxListItem<Data>, index: number): Record<string, unknown> {
		const tag = tagOf(box);
		if (tag === 'div') return {};
		const described = !boxSnippet && (descriptionSnippet || box.description);
		const naming = {
			'aria-labelledby': boxSnippet ? undefined : `${uid}-${index}-label`,
			'aria-describedby': described ? `${uid}-${index}-description` : undefined
		};
		if (tag === 'button') return { ...naming, type: 'button', disabled: box.disabled };
		return {
			...naming,
			href: box.disabled ? undefined : box.href,
			role: box.disabled ? 'link' : undefined,
			'aria-disabled': box.disabled ? 'true' : undefined
		};
	}

	function handleClick(box: BoxListItem<Data>, event: MouseEvent) {
		if (box.disabled) return;
		box.onclick?.(event);
		onboxClick?.({ box, event });
	}
</script>

<ul {...rest} bind:this={boxListElement} class="aurora-box-list {clazz}">
	{#each boxes as box, index (box.name)}
		{@const tag = tagOf(box)}
		<li class="aurora-box-list-item">
			<svelte:element
				this={tag}
				{...attributesOf(box, index)}
				onclick={tag === 'div' ? undefined : (event: MouseEvent) => handleClick(box, event)}
				data-color={box.color ?? 'primary'}
				data-interactive={tag !== 'div' || undefined}
				class="aurora-box-list-box {box.class ?? ''}"
			>
				{#if boxSnippet}
					{@render boxSnippet({ box, index })}
				{:else}
					{#if prependSnippet}
						<span class="aurora-box-list-prepend">{@render prependSnippet({ box, index })}</span>
					{/if}
					<span class="aurora-box-list-content">
						{#if iconSnippet}
							<span class="aurora-box-list-icon">{@render iconSnippet({ box })}</span>
						{:else if box.icon}
							<span class="aurora-box-list-icon"><Icon path={box.icon} /></span>
						{/if}
						<span id="{uid}-{index}-label" class="aurora-box-list-label"
							>{#if labelSnippet}{@render labelSnippet({ box })}{:else}{box.label}{/if}</span
						>
						{#if descriptionSnippet}
							<span id="{uid}-{index}-description" class="aurora-box-list-description"
								>{@render descriptionSnippet({ box })}</span
							>
						{:else if box.description}
							<span id="{uid}-{index}-description" class="aurora-box-list-description"
								>{box.description}</span
							>
						{/if}
					</span>
					{#if appendSnippet}
						<span class="aurora-box-list-append">{@render appendSnippet({ box, index })}</span>
					{/if}
				{/if}
			</svelte:element>
		</li>
	{/each}
</ul>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-box-list {
			display: grid;
			grid-template-columns: repeat(
				auto-fill,
				minmax(min(var(--box-list-min-width, var(--box-list-default-min-width)), 100%), 1fr)
			);
			gap: var(--box-list-gap, var(--box-list-default-gap));
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.aurora-box-list-item {
			display: flex;
			min-width: 0;
		}

		.aurora-box-list-box {
			--_icon-color: var(--box-list-default-icon-color);
			--_icon-background: var(--box-list-default-icon-background);
			position: relative;
			display: flex;
			flex: 1;
			align-items: center;
			gap: var(--box-list-box-gap, var(--box-list-default-box-gap));
			box-sizing: border-box;
			min-width: 0;
			margin: 0;
			padding: var(--box-list-box-padding-y, var(--box-list-default-box-padding-y))
				var(--box-list-box-padding-x, var(--box-list-default-box-padding-x));
			overflow: hidden;
			border: var(--box-list-box-border-width, var(--box-list-default-box-border-width)) solid
				var(--box-list-box-border-color, var(--box-list-default-box-border-color));
			border-radius: var(--box-list-box-border-radius, var(--box-list-default-box-border-radius));
			background: var(--box-list-box-background, var(--box-list-default-box-background));
			box-shadow: var(--box-list-box-shadow, var(--box-list-default-box-shadow));
			color: var(--box-list-box-color, var(--box-list-default-box-color));
			font: inherit;
			text-align: start;
			text-decoration: none;
		}

		.aurora-box-list-box[data-color='1'] {
			--_icon-color: var(--box-list-default-icon-color-1);
			--_icon-background: var(--box-list-default-icon-background-1);
		}

		.aurora-box-list-box[data-color='2'] {
			--_icon-color: var(--box-list-default-icon-color-2);
			--_icon-background: var(--box-list-default-icon-background-2);
		}

		.aurora-box-list-box[data-color='3'] {
			--_icon-color: var(--box-list-default-icon-color-3);
			--_icon-background: var(--box-list-default-icon-background-3);
		}

		.aurora-box-list-box[data-color='4'] {
			--_icon-color: var(--box-list-default-icon-color-4);
			--_icon-background: var(--box-list-default-icon-background-4);
		}

		.aurora-box-list-box[data-color='5'] {
			--_icon-color: var(--box-list-default-icon-color-5);
			--_icon-background: var(--box-list-default-icon-background-5);
		}

		.aurora-box-list-box[data-color='6'] {
			--_icon-color: var(--box-list-default-icon-color-6);
			--_icon-background: var(--box-list-default-icon-background-6);
		}

		.aurora-box-list-box[data-interactive] {
			--_tone: var(--box-list-icon-color, var(--_icon-color));
			isolation: isolate;
			cursor: pointer;
			transition:
				transform var(--global-duration) var(--global-ease),
				border-color var(--global-duration) var(--global-ease),
				box-shadow var(--global-duration) var(--global-ease),
				background-color var(--global-duration) var(--global-ease);
		}

		.aurora-box-list-box[data-interactive]::after {
			content: '';
			position: absolute;
			z-index: -1;
			inset: 0;
			background: var(
				--box-list-glow,
				radial-gradient(
					var(--box-list-default-glow-size) at 0% 0%,
					color-mix(in oklab, var(--_tone) var(--box-list-default-glow-tint), transparent),
					transparent var(--box-list-default-glow-reach)
				)
			);
			opacity: 0;
			pointer-events: none;
			transition: opacity var(--global-duration-slow) var(--global-ease);
		}

		.aurora-box-list-box[data-interactive] .aurora-box-list-icon {
			transition: box-shadow var(--global-duration-slow) var(--global-ease);
		}

		@media (hover: hover) {
			.aurora-box-list-box[data-interactive]:hover:not(:disabled, [aria-disabled='true']) {
				transform: translateY(
					calc(var(--box-list-box-hover-lift, var(--box-list-default-box-hover-lift)) * -1)
				);
				border-color: var(
					--box-list-box-hover-border-color,
					color-mix(in oklab, var(--_tone) var(--box-list-default-box-hover-border-tint), transparent)
				);
				background: var(--box-list-box-hover-background, var(--box-list-default-box-hover-background));
				box-shadow: var(
					--box-list-box-hover-shadow,
					var(--box-list-default-box-hover-shadow-shape)
						color-mix(in oklab, var(--_tone) var(--box-list-default-box-hover-shadow-tint), transparent)
				);
			}

			.aurora-box-list-box[data-interactive]:hover:not(:disabled, [aria-disabled='true'])::after {
				opacity: 1;
			}

			.aurora-box-list-box[data-interactive]:hover:not(:disabled, [aria-disabled='true']) .aurora-box-list-icon {
				box-shadow: var(
					--box-list-icon-hover-shadow,
					var(--box-list-default-icon-hover-shadow-shape)
						color-mix(in oklab, var(--_tone) var(--box-list-default-icon-hover-shadow-tint), transparent)
				);
			}
		}

		@media (prefers-reduced-motion: reduce) {
			.aurora-box-list-box[data-interactive]:hover {
				transform: none;
			}
		}

		.aurora-box-list-box:focus-visible {
			outline: var(--global-focus-ring-width) solid var(--global-focus-ring-color);
			outline-offset: var(--global-focus-ring-offset);
		}

		.aurora-box-list-box:is(:disabled, [aria-disabled='true']) {
			opacity: var(--box-list-disabled-opacity, var(--box-list-default-disabled-opacity));
			cursor: not-allowed;
		}

		.aurora-box-list-content {
			display: flex;
			flex: 1;
			flex-direction: column;
			align-items: flex-start;
			gap: var(--box-list-text-gap, var(--box-list-default-text-gap));
			min-width: 0;
		}

		.aurora-box-list-icon {
			display: grid;
			flex: none;
			place-items: center;
			width: var(--box-list-icon-tile-size, var(--box-list-default-icon-tile-size));
			height: var(--box-list-icon-tile-size, var(--box-list-default-icon-tile-size));
			margin-bottom: calc(
				var(--box-list-icon-gap, var(--box-list-default-icon-gap)) -
					var(--box-list-text-gap, var(--box-list-default-text-gap))
			);
			border-radius: var(--box-list-icon-tile-border-radius, var(--box-list-default-icon-tile-border-radius));
			background: var(--box-list-icon-background, var(--_icon-background));
			color: var(--box-list-icon-color, var(--_icon-color));
			--icon-size: var(--box-list-icon-size, var(--box-list-default-icon-size));
		}

		.aurora-box-list-label {
			max-width: 100%;
			color: var(--box-list-label-color, var(--box-list-default-label-color));
			font-size: var(--box-list-label-font-size, var(--box-list-default-label-font-size));
			font-weight: var(--box-list-label-font-weight, var(--box-list-default-label-font-weight));
			line-height: 1.35;
			overflow-wrap: anywhere;
		}

		.aurora-box-list-description {
			max-width: 100%;
			color: var(--box-list-description-color, var(--box-list-default-description-color));
			font-size: var(--box-list-description-font-size, var(--box-list-default-description-font-size));
			line-height: 1.4;
			overflow-wrap: anywhere;
		}

		.aurora-box-list-description:empty {
			display: none;
		}

		.aurora-box-list-prepend,
		.aurora-box-list-append {
			display: flex;
			flex: none;
			align-items: center;
		}

		.aurora-box-list-append {
			color: var(--box-list-append-color, var(--box-list-default-append-color));
		}
	}
</style>
