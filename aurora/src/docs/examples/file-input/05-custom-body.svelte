<!-- @component Custom content
`bodySnippet` replaces the content of the zone and receives `dragging` (files are over it) and `disabled`. The whole zone stays clickable and keeps the keyboard. -->
<script lang="ts">
	import { FileInput, Icon } from '#lib';
	import { mdiFileWordOutline } from '@mdi/js';
</script>

<div class="demo">
	<FileInput accept=".docx" maxFiles={1} replace --file-input-height="160px">
		{#snippet bodySnippet({ dragging })}
			<Icon path={mdiFileWordOutline} --icon-size="40px" />
			<strong>{dragging ? 'Release to replace the letter' : 'Welcome letter template'}</strong>
			<small>Word file only (.docx)</small>
		{/snippet}
	</FileInput>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 420px;
	}

	small {
		color: var(--global-color-text-3);
	}
</style>
