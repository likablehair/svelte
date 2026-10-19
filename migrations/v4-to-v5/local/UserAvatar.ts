import type { LocalMigration } from '../../types.js';

export default {
	from: 'UserAvatar',
	to: 'DescriptiveAvatar',
	files: ['UserAvatar.svelte'],
	contains: ['username'],
	summary: 'The local `UserAvatar` copy becomes `DescriptiveAvatar` of the library.',
	props: {
		renamed: [
			{ from: 'username', to: 'title', note: 'It also gives the initials and the color of the avatar.' },
			{ from: 'description', to: 'subtitle' }
		],
		inverted: [
			{
				from: 'showTitleAndDescription',
				to: 'compact',
				note: 'Only the avatar, with the name in a Tooltip; the initials are those of the first and last name.'
			}
		],
		removed: [
			{ name: 'cursor', note: 'The pointer cursor and the hover come with `onclick` or `href`.', drop: true },
			{
				name: 'solanaPublicKey',
				note: 'Pass the extra line through `children`, which replaces the title and subtitle, or keep a small wrapper of DescriptiveAvatar in the app.'
			}
		]
	},
	events: {
		changed: [
			{ name: 'on:click', to: 'onclick', argument: {}, type: 'MouseEvent', note: 'Svelte 4 event directive of older app code.' }
		]
	},
	cssVars: {
		removed: [{ name: '--user-avatar-font-size', note: 'Never had an effect (the copy did not read it): removed.', drop: true }]
	},
	variants: [
		{
			name: 'UserAvatarCompact',
			when: { prop: 'showTitleAndDescription', value: 'false' },
			to: 'Avatar',
			summary: 'The local `UserAvatar` copy with `showTitleAndDescription={false}` drew only a library `Avatar` with the initials: it becomes `Avatar` with `name`.',
			props: {
				renamed: [
					{
						from: 'username',
						to: 'name',
						note: 'Initials of the first and last word ("Mario Rossi" → "MR"; the copy took the first two letters, "MA"), color of the person and accessible name.'
					}
				],
				removed: [
					{ name: 'showTitleAndDescription', note: 'The variant without title and description is `Avatar`.', drop: true },
					{ name: 'description', note: 'Not shown without the title (v4 too): removed.', drop: true },
					{ name: 'direction', note: 'Layout of the title and description, not shown: removed.', drop: true },
					{ name: 'reverse', note: 'Layout of the title and description, not shown: removed.', drop: true },
					{ name: 'cursor', note: 'Not shown without the title: removed.', drop: true },
					{ name: 'solanaPublicKey', note: 'Not shown without the title: removed.', drop: true },
					{
						name: 'onclick',
						note: 'The copy did not pass it to the avatar without the title. `Avatar` is not a button: wrap it in a `<button>` or `<a>` if it must react, or use `DescriptiveAvatar compact` with `onclick`.'
					}
				]
			},
			cssVars: {
				removed: [{ name: '--user-avatar-font-size', note: 'Never had an effect (the copy did not read it): removed.', drop: true }]
			},
			manual: [
				{
					id: 'user-avatar-compact-look',
					kind: 'review',
					summary: 'A round avatar with the initials and the color of the person, as the copy drew it; `src`, when given, now shows the picture (some copies ignored it without the title).',
					action: 'Check the user menu and the bar: `--avatar-width`/`--avatar-height` became `size` (`xs` 24, `sm` 32, `md` 40, `lg` 56, `xl` 80) or `--avatar-size`.'
				}
			]
		}
	],
	manual: [
		{
			id: 'user-avatar-look',
			kind: 'review',
			summary: 'Avatar colors per person (from the name) and Aurora texts; one size, `--avatar-size`, instead of width and height.',
			action: 'Check the user menu and the sidebar footer: `--avatar-width`/`--avatar-height` became `size` or `--avatar-size`.'
		}
	]
} satisfies LocalMigration;
