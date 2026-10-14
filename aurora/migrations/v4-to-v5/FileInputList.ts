import type { ComponentMigration, Removal } from '../types.js';

const gone = (suffix: string, note: string, replacement?: string): Removal[] => [
	{ name: `--file-input-list-${suffix}`, note, replacement },
	{
		name: `--file-input-list-default-${suffix}`,
		note,
		replacement: replacement?.replace(/--file-input-/g, '--file-input-default-')
	}
];

export default {
	from: 'FileInputList',
	to: 'FileInputList',
	props: {
		renamed: [
			{ from: 'message', to: 'title' },
			{
				from: 'previewFiles',
				to: 'view',
				note: '`previewFiles` (true) → `view="grid"`; false → nothing. In the list view images already show a small thumbnail.'
			}
		],
		inverted: [
			{
				from: 'persistOverUpload',
				to: 'replace',
				note: '`persistOverUpload={false}` → `replace`; `persistOverUpload` (true, the default) → nothing.'
			}
		],
		removed: [
			{
				name: 'dropAreaActive',
				note: 'Internal hover state exposed by mistake. The pattern `disabled={readonly} dropAreaActive={!readonly}` becomes `readonly={readonly}` (list only, no zone, no remove buttons).',
				replacement: 'readonly'
			}
		],
		types: [
			{
				name: 'class',
				v4: 'string',
				v5: '{ container?: string; label?: string; zone?: string; hint?: string; list?: string; item?: string }',
				note: 'The v4 string went on the outer box: `class="x"` → `class={{ container: \'x\' }}`.'
			}
		],
		changed: [
			{
				name: 'icon',
				note: 'v4: the icon of every file in the list; v5: the icon of the drop zone. Files get the icon and color of their type (PDF, image, spreadsheet, ...) and images a thumbnail: delete the v4 value, or use `fileIconSnippet` for custom file icons.'
			},
			{
				name: 'maxFiles',
				note: 'Files over the limit are refused with a message under the zone and `onreject` (v4 dropped them silently). With `maxFiles={1}` the picker chooses a single file. The zone is still disabled when the list is full.'
			},
			{
				name: 'disabled',
				note: 'It also disables the remove buttons (v4 only the zone). To show files that cannot be changed use `readonly`.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onfileChange',
				to: 'onchange',
				argument: { 'detail.files': 'files' },
				type: '{ files: File[]; added: File[]; removed: File[] }',
				note: 'Called for every change (added or removed files) with the whole list in `files`, the new files in `added` and the removed ones in `removed`.'
			},
			{
				name: 'onfileDrop',
				to: 'onchange',
				argument: {},
				type: '{ files: File[]; added: File[]; removed: File[] }',
				note: 'v4 called it with no argument after a drop; `onchange` also runs for picked and removed files: check `added.length > 0`.'
			},
			{
				name: 'onfileSelect',
				to: 'onchange',
				argument: {},
				type: '{ files: File[]; added: File[]; removed: File[] }',
				note: 'v4 called it with no argument after a pick; `onchange` also runs for dropped and removed files: check `added.length > 0`.'
			},
			{
				name: 'onchange',
				argument: {},
				type: '{ files: File[]; added: File[]; removed: File[] }',
				note: 'v4 forwarded the native `change` of the hidden input (picker only, no argument); v5 calls it for every change with the files.'
			}
		]
	},
	snippets: {
		removed: [
			{
				name: 'messageSnippet',
				note: 'The zone shows an icon, a title and "or browse your files" by default. Move the parts of the snippet to `icon` (SVG path), `title` and `description` (the accepted formats); use `bodySnippet` only for other content.',
				replacement: 'icon + title + description'
			}
		],
		parameters: [
			{
				name: 'bodySnippet',
				v4: '{ active: boolean }',
				v5: '{ dragging: boolean; disabled: boolean }',
				note: '`active` → `dragging`. It replaces only the icon and texts of the zone: the list is below the zone and stays.'
			},
			{
				name: 'fileListSnippet',
				v4: '{ files: File[]; previewFiles: boolean; fileActive: File | null }',
				v5: '{ files: File[]; remove: (file: File) => void }',
				note: 'Rendered below the zone (v4: inside it). `remove(file)` takes a file out and calls `onchange`. For one row only use `fileSnippet`.'
			}
		]
	},
	cssVars: {
		removed: [
			...gone(
				'background-color',
				'The zone is a FileInput: its background is `--file-input-background` (rows: `--file-input-list-item-background`).',
				'--file-input-background'
			),
			...gone('color', 'The zone is a FileInput: its text color is `--file-input-color`.', '--file-input-color'),
			...gone(
				'border-radius',
				'The zone is a FileInput: its radius is `--file-input-border-radius` (rows: `--file-input-list-item-border-radius`).',
				'--file-input-border-radius'
			),
			...gone(
				'border',
				'The dashed border is on the zone: `none` → `--file-input-border-width="0"`; a color → `--file-input-border-color`.',
				'--file-input-border-width + --file-input-border-color'
			),
			...gone('border-color', 'It had no effect in v4 (applied to a box without border): delete it.'),
			...gone('hover-color', 'Hover colors the zone border and background: `--file-input-hover-border-color`, `--file-input-hover-background`.'),
			...gone('selected-row-color', 'Rows are not highlighted on hover anymore.'),
			...gone('selected-row-background', 'Rows are not highlighted on hover anymore.')
		],
		changed: ['--file-input-list-height', '--file-input-list-default-height'].map((name) => ({
			name,
			note: 'Still the height of the whole field, but the list is below the zone (v4: inside it); the zone grows to fill the height and the list scrolls when it does not fit. Default `auto` (v4: 64px). Small fixed heights (100–180px) leave little room for the list: prefer `auto` or a larger value.'
		}))
	},
	manual: [
		{
			id: 'file-input-list-layout',
			summary:
				'The files are listed below the zone, which turns into one line while files are listed (`compact="auto"`); v4 listed them inside the zone, in a box of fixed height.',
			action:
				'Check the pages that set `--file-input-list-height`: with `100%` the parent must have a height; with small values (100–180px) remove the height or raise it.',
			when: { cssVars: ['--file-input-list-height'] }
		},
		{
			id: 'file-input-list-drain',
			summary:
				'Pages that copied the files in `onfileChange`, emptied the list (`files = []`) and rendered their own list only need the drop zone.',
			action:
				'Replace FileInputList with FileInput and read the new files from `onchange={({ added }) => ...}`; drop `previewFiles`, the bound array that was emptied and the copy logic.',
			when: { events: ['onfileChange'] }
		},
		{
			id: 'file-input-list-validation',
			summary: '`accept`, `maxSize` and `maxFiles` refuse files, with a message under the zone and `onreject`.',
			action:
				'Replace checks of `file.type`, extensions, `file.size` or `files.length == 1` / `slice(0, 1)` (and the toasts they show) with `accept=".docx"`, `maxSize` (bytes, decimal: 10 MB = `10_000_000`) and `maxFiles={1}`; a hint like "Only .docx files" goes in `description`.',
			when: { events: ['onfileChange'], snippets: ['messageSnippet'] }
		}
	],
	added: [
		'`fileStatus(file)`: progress, done or error (with message) on each row.',
		'`view="grid"` cards, `compact`, `readonly`, `emptyLabel`, `removeLabel`.',
		'`fileSnippet`, `fileIconSnippet`; every FileInput prop (`accept`, `maxSize`, `label`, `hint`, `state`, `description`, `name`, `required`, ...).',
		'Remove buttons with a tooltip, focus kept in the list after a removal, file sizes in kB/MB in the language of `locale`.',
		'`--file-input-list-*` variables for rows, icons, colors per file type, progress, status and cards.'
	]
} satisfies ComponentMigration;
