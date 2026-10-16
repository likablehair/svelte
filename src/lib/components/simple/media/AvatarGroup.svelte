<!-- @component
Row of overlapping avatars, for example the people assigned to a task. Every avatar is an `Avatar` built from an `AvatarGroupItem`, `{ name?: string; src?: string | Blob; text?: string; alt?: string; colorKey?: string | number; color?: …; status?: … }`, with a Tooltip that shows its name. With `maxVisible` the extra avatars become a "+N" counter whose Tooltip lists their names. A thin gap in the color of `--avatar-gap-color` separates the avatars: set it to the background behind the group. The group is an ARIA `group`: give it an `aria-label` that says what the people are.
-->
<script lang="ts" module>
	export type AvatarGroupItem = {
		/** Full name: initials, color, accessible name and Tooltip. */
		name?: string;
		/** Image: a URL, or a `Blob`/`File`. */
		src?: string | Blob;
		/** Text shown instead of the initials of `name`. */
		text?: string;
		/** Accessible name and Tooltip text instead of `name`. */
		alt?: string;
		/** Value that picks the color instead of `name`, for example the id of the person. */
		colorKey?: string | number;
		/** Fixed background instead of the one picked from `colorKey` or `name`. */
		color?: 'auto' | 'primary' | 'neutral' | 1 | 2 | 3 | 4 | 5 | 6;
		/** Status dot in the bottom-right corner. */
		status?: 'online' | 'away' | 'busy' | 'offline';
	};
</script>

<script lang="ts">
	import '../../../css/tokens.css';
	import './AvatarGroup.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Avatar from './Avatar.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import { inheritedLocale } from '../../../utils/locale.js';
	import { libraryTexts } from '../../../utils/texts.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** The avatars, in order: the first one is at the start. */
		avatars: AvatarGroupItem[];
		/** Shows at most this many avatars, followed by a "+N" counter whose Tooltip lists the hidden names. */
		maxVisible?: number;
		/** Size of every avatar: `xs` 24px, `sm` 32px, `md` 40px, `lg` 56px, `xl` 80px. */
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		/** Shape of every avatar. */
		shape?: 'circle' | 'square';
		/** Shows the name of every avatar in a Tooltip. */
		tooltips?: boolean;
		/** BCP 47 locale of the texts (`it` and `en` are built in, other languages fall back to English). Defaults to the one set with `setDefaultLocale`, else `en`. */
		locale?: string;
		/** Accessible name of the counter. Defaults to "{count} more", in the language of `locale`; `{count}` is replaced with the number of hidden avatars. */
		moreLabel?: string;
		/** The root `<div>` element. */
		avatarGroupElement?: HTMLDivElement;
		/** Extra classes on the root `<div>` element. */
		class?: string;
		/** Replaces every avatar, for example to wrap it in a link. */
		avatarSnippet?: Snippet<[{ avatar: AvatarGroupItem; index: number }]>;
		/** Replaces the "+N" counter. */
		counterSnippet?: Snippet<[{ count: number; hidden: AvatarGroupItem[] }]>;
	}

	let {
		avatars,
		maxVisible,
		size = 'md',
		shape = 'circle',
		tooltips = true,
		locale: localeProp,
		moreLabel,
		avatarGroupElement = $bindable(),
		class: clazz = '',
		avatarSnippet,
		counterSnippet,
		...rest
	}: Props = $props();

	const defaultLocale = inheritedLocale();
	let locale = $derived(localeProp ?? defaultLocale());
	let texts = $derived(libraryTexts(locale).avatarGroup);

	let visible = $derived(
		maxVisible !== undefined && avatars.length > maxVisible ? avatars.slice(0, Math.max(0, maxVisible)) : avatars
	);
	let hidden = $derived(avatars.slice(visible.length));
	let nodes = $state<(HTMLSpanElement | undefined)[]>([]);
	let counterNode = $state<HTMLSpanElement>();

	const nameOf = (avatar: AvatarGroupItem) => avatar.alt ?? avatar.name?.trim() ?? '';
</script>

<div
	role="group"
	{...rest}
	bind:this={avatarGroupElement}
	data-size={size}
	class="aurora-avatar-group {clazz}"
>
	{#each visible as avatar, index (index)}
		{#if avatarSnippet}
			{@render avatarSnippet({ avatar, index })}
		{:else}
			<Avatar
				name={avatar.name}
				src={avatar.src}
				text={avatar.text}
				alt={avatar.alt}
				colorKey={avatar.colorKey}
				color={avatar.color}
				status={avatar.status}
				{size}
				{shape}
				{locale}
				bind:avatarElement={nodes[index]}
			/>
			{#if tooltips && nameOf(avatar)}
				<Tooltip activator={nodes[index]} text={nameOf(avatar)} />
			{/if}
		{/if}
	{/each}
	{#if hidden.length > 0}
		{#if counterSnippet}
			{@render counterSnippet({ count: hidden.length, hidden })}
		{:else}
			<Avatar
				text="+{hidden.length}"
				alt={(moreLabel ?? texts.more).replace('{count}', String(hidden.length))}
				color="neutral"
				{size}
				{shape}
				{locale}
				class="aurora-avatar-group-counter"
				bind:avatarElement={counterNode}
			/>
			{#if hidden.some((avatar) => nameOf(avatar))}
				<Tooltip
					activator={counterNode}
					text={hidden
						.map(nameOf)
						.filter(Boolean)
						.join(', ')}
				/>
			{/if}
		{/if}
	{/if}
</div>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-avatar-group {
			--_overlap: var(--avatar-group-default-overlap);
			--avatar-gap-width: var(--avatar-group-gap-width, var(--avatar-group-default-gap-width));
			display: inline-flex;
			align-items: center;
			flex-shrink: 0;
			vertical-align: middle;
		}

		.aurora-avatar-group[data-size='xs'] {
			--_overlap: var(--avatar-group-default-xs-overlap);
		}

		.aurora-avatar-group[data-size='sm'] {
			--_overlap: var(--avatar-group-default-sm-overlap);
		}

		.aurora-avatar-group[data-size='lg'] {
			--_overlap: var(--avatar-group-default-lg-overlap);
		}

		.aurora-avatar-group[data-size='xl'] {
			--_overlap: var(--avatar-group-default-xl-overlap);
		}

		.aurora-avatar-group > :global(* + *) {
			margin-inline-start: calc(-1 * var(--avatar-group-overlap, var(--_overlap)));
		}

		.aurora-avatar-group > :global(.aurora-avatar-group-counter) {
			--avatar-background: var(--avatar-group-counter-background, var(--avatar-group-default-counter-background));
			--avatar-color: var(--avatar-group-counter-color, var(--avatar-group-default-counter-color));
			--avatar-font-size: var(--avatar-group-counter-font-size, calc(var(--_size-now) * 0.34));
		}
	}
</style>
