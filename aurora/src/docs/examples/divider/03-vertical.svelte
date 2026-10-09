<!-- @component Vertical
`orientation="vertical"` separates items in a row: in a flex row it is as tall as the row, with 10px on each side. -->
<script lang="ts">
	import {
		mdiFormatBold,
		mdiFormatItalic,
		mdiFormatListBulleted,
		mdiFormatListNumbered,
		mdiLinkVariant
	} from '@mdi/js';
	import { Button, Divider } from '#lib';
</script>

<div class="toolbar" role="toolbar" aria-label="Formatting">
	<Button buttonType="text" variant="secondary" icon={mdiFormatBold} aria-label="Bold" />
	<Button buttonType="text" variant="secondary" icon={mdiFormatItalic} aria-label="Italic" />
	<Divider orientation="vertical" />
	<Button buttonType="text" variant="secondary" icon={mdiFormatListBulleted} aria-label="Bulleted list" />
	<Button buttonType="text" variant="secondary" icon={mdiFormatListNumbered} aria-label="Numbered list" />
	<Divider orientation="vertical" variant="gradient" />
	<Button buttonType="text" variant="secondary" icon={mdiLinkVariant} aria-label="Link" />
</div>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		padding: 4px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-md);
	}
</style>
