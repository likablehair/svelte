import type { ComponentMigration } from '../types.js';

export default {
	from: 'Avatar',
	to: 'Avatar',
	props: {
		changed: [
			{
				name: 'alt',
				note: 'v4: `alt` of the `<img>`, `""` by default, so the avatar was always decorative. v5: accessible name of the whole avatar (role `img`), by default `name`; `alt=""` keeps it decorative. Without `name` nothing changes.'
			},
			{
				name: 'imageLoadingStatus',
				note: "Gains `'loading'` (until the image arrives) and is `undefined` without `src`; v4 started at `'success'`. Code that tests `=== 'success'` to decide whether an image exists keeps working once the image has loaded."
			},
			{
				name: 'src',
				note: 'Also accepts a `Blob` or `File`: the avatar creates and revokes the object URL. An empty string counts as no image, as before.'
			}
		]
	},
	cssVars: {
		renamed: [
			{
				from: '--avatar-width',
				to: '--avatar-size',
				note: 'The avatar is always square: one size for width and height. Use a `size` (`xs` 24, `sm` 32, `md` 40, `lg` 56, `xl` 80) when the v4 value is one of those, else `--avatar-size`. If `--avatar-height` is also set, keep one of the two (`avatar-size`).'
			},
			{
				from: '--avatar-height',
				to: '--avatar-size',
				note: 'See `--avatar-width`: keep one of the two.'
			},
			{ from: '--avatar-background-color', to: '--avatar-background' },
			{ from: '--avatar-text-color', to: '--avatar-color' },
			{
				from: '--avatar-text-size',
				to: '--avatar-font-size',
				note: 'By default the text is 0.38 × the size (v4 about 0.41 × the height); set it only where a different ratio is wanted.'
			},
			{ from: '--avatar-text-weight', to: '--avatar-font-weight' },
			{ from: '--avatar-default-width', to: '--avatar-default-size' },
			{ from: '--avatar-default-height', to: '--avatar-default-size' },
			{ from: '--avatar-default-text-weight', to: '--avatar-default-font-weight' }
		],
		removed: [
			{
				name: '--avatar-min-width',
				note: 'The avatar no longer shrinks in a flex row (`flex-shrink: 0`), which is what the apps used it for: delete it.'
			},
			{ name: '--avatar-max-width', note: 'The size is fixed: delete it, or set `--avatar-size`.' },
			{ name: '--avatar-min-height', note: 'The size is fixed: delete it, or set `--avatar-size`.' },
			{ name: '--avatar-max-height', note: 'The size is fixed: delete it, or set `--avatar-size`.' },
			{
				name: '--avatar-default-min-width',
				note: 'Never read by v4 either (set in some apps by mistake): delete it.'
			},
			{
				name: '--avatar-default-background-color',
				note: 'The background is one of six gradients picked from the name (`--avatar-default-background-1` … `-6`, built on the `--global-color-data-*` tokens). For one color everywhere set `--avatar-background` in the app CSS, or `color="primary"` on the avatars.',
				replacement: '--avatar-background'
			},
			{
				name: '--avatar-default-text-color',
				note: 'Text on the gradients is `--avatar-default-color`; on `color="neutral"` it is `--avatar-default-neutral-color`.',
				replacement: '--avatar-default-color'
			}
		]
	},
	manual: [
		{
			id: 'avatar-initials',
			kind: 'review',
			summary:
				'v5 computes the initials from `name`: first letter of the first and of the last word ("Mario Rossi" → "MR"). The apps passed `text={username.substring(0, 2).toUpperCase()}` ("MA").',
			action:
				'Replace `text={fullName.substring(0, 2).toUpperCase()}` (and similar code that builds initials) with `name={fullName}`, which also gives the color and the accessible name. Keep `text` only for text that is not initials, such as a short company name. Guard names that may be missing ("undefined undefined") before passing them.',
			when: { props: ['text'] }
		},
		{
			id: 'avatar-color',
			kind: 'review',
			summary:
				'The background is a gradient picked from the name, so every person has their own color; v4 used the primary color for everyone.',
			action:
				'Leave it where avatars stand for people. Pass `colorKey={id}` where the name can change but the color should not, `color="primary"` where the brand color must stay, and delete the per-person palettes built in the app (by position or by `id % n`).'
		},
		{
			id: 'avatar-children',
			kind: 'edit',
			summary:
				'`children` now replaces only the content inside the circle (initials or icon); in v4 it replaced the whole avatar, circle included.',
			action:
				'Where `children` rebuilt the circle (a `div` with the avatar size, radius and background around an icon), keep only the inner content, for example `<Avatar color={4}><Icon path={mdiCurrencyEur} /></Avatar>`.',
			when: { snippets: ['children'] }
		},
		{
			id: 'avatar-empty',
			kind: 'review',
			summary: 'Without `src`, `name` or `text` the avatar shows a person icon; v4 showed an empty circle.',
			action: 'Nothing to do unless the empty circle was meant: pass `icon` for another icon, or `text=" "` for an empty avatar.'
		},
		{
			id: 'avatar-look',
			kind: 'review',
			summary:
				'Default look: 40px circle (unchanged), text weight 600 instead of 700, text 0.38 × the size. The image covers the initials, which stay visible while it loads or when it fails (v4 showed the broken image for a moment and downloaded it twice).',
			action:
				'Compare the screens with avatars; restore `--avatar-font-weight="700"` where the bolder text is wanted. Where width and height differed (a rectangle), choose one size: rectangular avatars are not supported.',
			when: { cssVars: ['--avatar-width', '--avatar-height'] }
		},
		{
			id: 'avatar-blob',
			kind: 'review',
			summary:
				'`src` accepts a `Blob`/`File`: images downloaded with authentication no longer need to be turned into data URLs.',
			action:
				'Where the app downloads the image as a blob and converts it with `FileReader.readAsDataURL` (or keeps an object URL it never revokes), pass the blob directly: `src={blob}`.',
			scope: 'app'
		}
	],
	added: [
		'`name`: initials, color and accessible name.',
		'`colorKey` and `color` (`auto`, `1`–`6`, `primary`, `neutral`): the background.',
		'`size` (`xs`, `sm`, `md`, `lg`, `xl`) and `--avatar-size`.',
		'`shape="square"`, `ring`, `status` with `statusLabel`, `icon`, `locale`.',
		'`badgeSnippet`: content in the bottom-right corner.',
		'`class`, native attributes and `avatarElement` on the root `<span>`.',
		'`--avatar-gap-color`, `--avatar-ring-color`, `--avatar-ring-width`, `--avatar-status-color`, `--avatar-status-size`.',
		'`AvatarGroup`: overlapping avatars with a "+N" counter.'
	]
} satisfies ComponentMigration;
