import type { ComponentMigration } from '../types.js';

export default {
	from: 'FileInput',
	to: 'FileInput',
	props: {
		renamed: [{ from: 'placeholder', to: 'title' }],
		inverted: [
			{
				from: 'persistOverUpload',
				to: 'replace',
				note: '`persistOverUpload={false}` → `replace`; `persistOverUpload` (true, the default) → nothing.'
			}
		],
		types: [
			{
				name: 'class',
				v4: 'string',
				v5: '{ container?: string; label?: string; zone?: string; hint?: string }',
				note: 'The v4 string went on the drop area: `class="x"` → `class={{ zone: \'x\' }}`.'
			}
		],
		changed: [
			{
				name: 'maxFiles',
				note: 'Files over the limit are refused with a message under the zone and `onreject` (v4 dropped them silently). With `maxFiles={1}` the picker chooses a single file (v4: always `multiple`).'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onfileDrop',
				to: 'onchange',
				argument: { 'detail.files': 'added', 'detail.nativeEvent': null },
				type: '{ files: File[]; added: File[]; removed: File[] }',
				note: 'One callback for dropped and picked files. `added` holds the new files (v4 `detail.files`), `files` the whole list.'
			},
			{
				name: 'onfileSelect',
				to: 'onchange',
				argument: { 'detail.files': 'added', 'detail.nativeEvent': null },
				type: '{ files: File[]; added: File[]; removed: File[] }',
				note: 'One callback for dropped and picked files. If the app also had `onfileDrop` with the same body, keep one `onchange`.'
			},
			{
				name: 'onchange',
				argument: {},
				type: '{ files: File[]; added: File[]; removed: File[] }',
				note: 'v4 forwarded the native `change` of the hidden input (picker only, no argument); v5 calls it for every change (drop, picker, `replace`, form reset) with the files.'
			}
		]
	},
	snippets: {
		parameters: [
			{
				name: 'bodySnippet',
				v4: '{ active: boolean }',
				v5: '{ dragging: boolean; disabled: boolean }',
				note: '`active` → `dragging`. The snippet replaces the icon and the texts of the zone; the zone keeps its border and padding.'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--file-input-background-color', to: '--file-input-background' },
			{ from: '--file-input-default-background-color', to: '--file-input-default-background' },
			{ from: '--file-input-active-background-color', to: '--file-input-dragging-background' },
			{ from: '--file-input-default-active-background-color', to: '--file-input-default-dragging-background' }
		],
		removed: [
			{
				name: '--file-input-focus-shadow',
				note: 'v4 put a shadow on hover. Hover now colors the border and the background (`--file-input-hover-border-color`, `--file-input-hover-background`); keyboard focus shows a ring.',
				replacement: '--file-input-hover-background'
			},
			{
				name: '--file-input-default-focus-shadow',
				note: 'Hover colors the border and the background instead.',
				replacement: '--file-input-default-hover-background'
			}
		],
		changed: ['--file-input-height', '--file-input-default-height'].map((name) => ({
			name,
			note: 'It sets the height of the whole field (label, zone, hint) and defaults to `auto` (v4: 64px drop area). The default zone is about 170px tall; set `compact` for a one-line zone (about 60px) where space is tight.'
		}))
	},
	manual: [
		{
			id: 'file-input-look',
			kind: 'review',
			summary:
				'The zone looks like the prototype: dashed border, icon tile, "Drop files here / or browse your files" and an optional `description`; v4 was a 64px grey box with one line of text.',
			action:
				'Check pages where the zone sits in a tight space and add `compact`. Put the accepted formats in `description` instead of a custom snippet.'
		},
		{
			id: 'file-input-validation',
			kind: 'review',
			summary: '`accept`, `maxSize` and `maxFiles` refuse files, with a message under the zone and `onreject`.',
			action:
				'Replace checks of `file.type`, extensions, `file.size` or the number of files in the callbacks (and the toasts they show) with `accept=".pdf,image/*"`, `maxSize` (bytes, decimal: 10 MB = `10_000_000`) and `maxFiles`.',
			when: { events: ['onfileDrop', 'onfileSelect', 'onchange'] }
		}
	],
	added: [
		'`accept`, `maxSize`, `onreject`, `rejectedSnippet`: refused files with the reason.',
		'`label`, `hint`, `state`, `labelSnippet`, `hintSnippet`: field anatomy like the other inputs.',
		'`compact`, `icon`, `description`, `browseLabel`, `locale`.',
		'`readonly`, `name`, `required`, `id`, `bind:input`, native attributes on the input, `children` below the zone.',
		'`data-dragging`, `data-full`, `data-disabled`, `data-state`, `data-compact` attributes.',
		'`--file-input-*` variables for border, hover, dragging, icon, texts, focus ring, error, label and hint.'
	]
} satisfies ComponentMigration;
