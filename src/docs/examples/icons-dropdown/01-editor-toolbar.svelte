<!-- @component Editor toolbar
Heading level and text alignment, the typical use. Every option has a `label`: screen readers read it, the Tooltip shows it while the tile is highlighted, and typing its first letter jumps to it. The `label` of the component names the button. -->
<script lang="ts">
	import {
		mdiFormatAlignCenter,
		mdiFormatAlignJustify,
		mdiFormatAlignLeft,
		mdiFormatAlignRight,
		mdiFormatHeader1,
		mdiFormatHeader2,
		mdiFormatHeader3,
		mdiFormatParagraph
	} from '@mdi/js';
	import { IconsDropdown, type IconItem } from '#lib';

	const levels: IconItem[] = [
		{ value: 'p', label: 'Paragraph', icon: mdiFormatParagraph },
		{ value: 'h1', label: 'Heading 1', icon: mdiFormatHeader1 },
		{ value: 'h2', label: 'Heading 2', icon: mdiFormatHeader2 },
		{ value: 'h3', label: 'Heading 3', icon: mdiFormatHeader3 }
	];

	const alignments: IconItem[] = [
		{ value: 'left', label: 'Align left', icon: mdiFormatAlignLeft },
		{ value: 'center', label: 'Center', icon: mdiFormatAlignCenter },
		{ value: 'right', label: 'Align right', icon: mdiFormatAlignRight },
		{ value: 'justify', label: 'Justify', icon: mdiFormatAlignJustify }
	];

	let level: IconItem[] = $state([levels[0]]);
	let alignment: IconItem[] = $state([alignments[0]]);
</script>

<div class="demo">
	<div class="toolbar" role="toolbar" aria-label="Text format">
		<IconsDropdown label="Text style" items={levels} bind:values={level} />
		<IconsDropdown label="Alignment" items={alignments} bind:values={alignment} />
	</div>
	<p>{level[0]?.label} · {alignment[0]?.label}</p>
</div>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	.toolbar {
		display: flex;
		gap: 6px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
