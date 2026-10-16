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
	manual: [
		{
			id: 'user-avatar-look',
			kind: 'review',
			summary: 'Avatar colors per person (from the name) and Aurora texts; one size, `--avatar-size`, instead of width and height.',
			action: 'Check the user menu and the sidebar footer: `--avatar-width`/`--avatar-height` became `--avatar-size`; `--user-avatar-font-size` never had an effect and can be removed.'
		}
	]
} satisfies LocalMigration;
