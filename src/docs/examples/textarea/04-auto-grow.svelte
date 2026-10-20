<!-- @component Auto grow
With `autoGrow` the field grows with its content instead of scrolling: it starts at `rows` lines and stops at `--textarea-max-height`, then scrolls. It uses CSS `field-sizing: content` where supported and measures the content elsewhere. -->
<script lang="ts">
	import { Textarea } from '#lib';
</script>

<div class="form">
	<Textarea
		label="Message"
		placeholder="Type a few lines…"
		rows={1}
		autoGrow
		--textarea-max-height="160px"
	/>
</div>

<style>
	.form {
		width: 100%;
		max-width: 340px;
	}
</style>
