<!-- @component States
`state="error"` and `state="success"` color the border and the hint and show an icon; `error` also sets `aria-invalid`. `disabled` and `readonly` are the native attributes. -->
<script lang="ts">
	import { Textarea } from '#lib';
</script>

<div class="form">
	<Textarea label="Reason" value="ok" state="error" hint="Write at least 20 characters" />
	<Textarea label="Feedback" value="Great service, very kind staff." state="success" hint="Thanks!" />
	<Textarea label="Signed agreement" value="The customer accepts the price list." readonly rows={2} />
	<Textarea label="Archived notes" value="Moved to the new branch." disabled rows={2} />
</div>

<style>
	.form {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 340px;
	}
</style>
