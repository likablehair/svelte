<!-- @component Basic
`bind:value` keeps the text in sync and `label` is linked to the textarea. `rows` sets the visible lines (3 by default); the user can drag the field taller. -->
<script lang="ts">
	import { Textarea } from '#lib';

	let notes = $state('');
</script>

<div class="form">
	<Textarea
		label="Customer notes"
		placeholder="Allergies, preferences, usual color…"
		hint="Visible to every stylist of the salon."
		bind:value={notes}
	/>
</div>

<style>
	.form {
		width: 100%;
		max-width: 340px;
	}
</style>
