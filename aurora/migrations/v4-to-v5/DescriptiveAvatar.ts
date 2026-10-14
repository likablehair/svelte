import type { ComponentMigration } from '../types.js';

export default {
	from: 'DescriptiveAvatar',
	to: 'DescriptiveAvatar',
	props: {
		changed: [
			{
				name: 'title',
				note: 'It also gives the initials of the avatar: first letter of the first and of the last word ("Mario Rossi" → "MR"); v4 took the first two letters ("MA"). `avatarText` still wins.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onclick',
				argument: {},
				note: 'With `onclick` the component is a `<button>` (focus, Enter and Space, screen readers); v4 put the click on a `div role="presentation"`.'
			}
		]
	},
	cssVars: {
		changed: [
			{
				name: '--descriptive-avatar-cursor',
				note: 'Defaults to `pointer` only with `onclick` or `href`, `auto` otherwise (v4: always `pointer`). Delete the overrides that set it to `auto`/`default`.'
			},
			{
				name: '--descriptive-avatar-image-gap',
				note: 'Default 12px instead of 8px.'
			},
			{
				name: '--descriptive-avatar-title-font-size',
				note: 'Default 14px with weight 600 (`--descriptive-avatar-title-font-weight`) instead of 1.1rem bold.'
			},
			{
				name: '--descriptive-avatar-subtitle-font-size',
				note: 'Default 12.5px in the dimmer text color (`--descriptive-avatar-subtitle-color`) instead of 1rem.'
			}
		]
	},
	manual: [
		{
			id: 'descriptive-avatar-initials',
			summary:
				'The avatar initials come from `title` as first + last word ("MR"); app wrappers passed `avatarText={username.substring(0, 2).toUpperCase()}` ("MA").',
			action:
				'Delete `avatarText` where it only built initials from the same name; keep it for other text. Guard titles that may be missing ("undefined undefined").',
			when: { props: ['avatarText'] }
		},
		{
			id: 'descriptive-avatar-click-wrappers',
			summary:
				'The component is a real `<button>` with `onclick` (or a link with `href`); the apps wrapped it in clickable `div`s with `on:click`/`on:keypress`, sometimes with `aria-hidden`, and some called the handler twice.',
			action:
				'Remove the clickable wrappers and their `aria-hidden`, and pass the handler once as `onclick`; for navigation pass `href` instead of an `onclick` that calls `goto`. Remove `role="button"`/`tabindex` added by hand.',
			when: { events: ['onclick', 'on:click'] }
		},
		{
			id: 'descriptive-avatar-children',
			summary:
				'`children` replaces the title and subtitle even when neither is set (v4 ignored it without them); the avatar is no longer part of a `slot="avatar"`.',
			action:
				'Check the usages with `children`: the content now always shows. For a custom avatar use `avatarSnippet`.',
			when: { snippets: ['children'] }
		},
		{
			id: 'descriptive-avatar-compact',
			summary:
				'`compact` shows only the avatar, with the title and subtitle in a Tooltip. App wrappers switched between DescriptiveAvatar and a bare Avatar (`showTitleAndDescription`) for collapsed sidebars.',
			action:
				'Replace the `{#if showTitleAndDescription}<DescriptiveAvatar …/>{:else}<Avatar …/>{/if}` switch with one `<DescriptiveAvatar … compact={!showTitleAndDescription} />`.'
		},
		{
			id: 'descriptive-avatar-look',
			summary:
				'Clickable ones (`onclick`, `href`) have padding and a rounded hover background, as in the new design; the texts are smaller (14px / 12.5px) and the gap is 12px.',
			action:
				'Check the alignment where a clickable DescriptiveAvatar sits in a column with other content: set `--descriptive-avatar-padding="0"` to remove the padding. Restore the v4 sizes with the `--descriptive-avatar-*` variables where needed.'
		}
	],
	added: [
		'`href`, `target`, `rel`, `disabled`: link and disabled state.',
		'`compact`: only the avatar, texts in a Tooltip.',
		'All the `Avatar` props: `name`, `colorKey`, `color`, `size`, `shape`, `ring`, `status`, `icon`, `imageLoadingStatus`, `locale`, `badgeSnippet`.',
		'`avatarSnippet`, `class`, native attributes and `descriptiveAvatarElement`.',
		'`--descriptive-avatar-padding`, `--descriptive-avatar-border-radius`, `--descriptive-avatar-hover-background`, `--descriptive-avatar-title-color`, `--descriptive-avatar-subtitle-color`, `--descriptive-avatar-title-font-weight`.'
	]
} satisfies ComponentMigration;
