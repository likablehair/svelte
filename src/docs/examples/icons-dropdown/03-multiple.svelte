<!-- @component Multiple
With `multiple` more icons can be chosen and the list stays open. The button shows up to `maxVisibleIcons` tiles, then a "+N" counter; screen readers hear every label. -->
<script lang="ts">
	import {
		mdiCodeTags,
		mdiFormatBold,
		mdiFormatItalic,
		mdiFormatStrikethrough,
		mdiFormatUnderline
	} from '@mdi/js';
	import { IconsDropdown, type IconItem } from '#lib';

	const marks: IconItem[] = [
		{ value: 'bold', label: 'Bold', icon: mdiFormatBold },
		{ value: 'italic', label: 'Italic', icon: mdiFormatItalic },
		{ value: 'underline', label: 'Underline', icon: mdiFormatUnderline },
		{ value: 'strike', label: 'Strikethrough', icon: mdiFormatStrikethrough },
		{ value: 'code', label: 'Code', icon: mdiCodeTags }
	];

	let values: IconItem[] = $state(marks.slice(0, 4));
</script>

<div class="demo">
	<IconsDropdown label="Marks" items={marks} bind:values multiple mandatory={false} maxVisibleIcons={2} />
	<p>{values.map((mark) => mark.label).join(', ') || 'No marks'}</p>
</div>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}
</style>
