<!-- @component Toolbar
Icon-only toggles, as in a text editor, need an `aria-label`. Here `active` is driven from outside, without `bind:`: `onclick` updates the formatting state and the buttons follow it. -->
<script lang="ts">
	import { mdiFormatBold, mdiFormatItalic, mdiFormatUnderline, mdiStar } from '@mdi/js';
	import { ActivableButton } from '#lib';

	let format = $state({ bold: true, italic: false, underline: false });
	let starred = $state(true);
</script>

<div class="row">
	<div class="toolbar" role="toolbar" aria-label="Formatting">
		<ActivableButton
			icon={mdiFormatBold}
			aria-label="Bold"
			size="sm"
			active={format.bold}
			onclick={() => (format.bold = !format.bold)}
		/>
		<ActivableButton
			icon={mdiFormatItalic}
			aria-label="Italic"
			size="sm"
			active={format.italic}
			onclick={() => (format.italic = !format.italic)}
		/>
		<ActivableButton
			icon={mdiFormatUnderline}
			aria-label="Underline"
			size="sm"
			active={format.underline}
			onclick={() => (format.underline = !format.underline)}
		/>
	</div>
	<ActivableButton icon={mdiStar} aria-label="Starred" bind:active={starred} />
	<p class:bold={format.bold} class:italic={format.italic} class:underline={format.underline}>
		Sample text
	</p>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
	}

	.toolbar {
		display: flex;
		gap: 4px;
	}

	p {
		margin: 0;
	}

	.bold {
		font-weight: 700;
	}

	.italic {
		font-style: italic;
	}

	.underline {
		text-decoration: underline;
	}
</style>
