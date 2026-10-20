<!-- @component States
`state="error"` and `state="success"` color the border and the hint; `error` also sets `aria-invalid`. `disabled` and `readonly` are the native attributes. -->
<script lang="ts">
	import { mdiPhoneOutline } from '@mdi/js';
	import { SimpleTextField } from '#lib';
</script>

<div class="form">
	<SimpleTextField
		label="Phone"
		type="tel"
		value="+39 33"
		prependInnerIcon={mdiPhoneOutline}
		state="error"
		hint="Invalid phone number"
	/>
	<SimpleTextField label="Promo code" value="AURORA25" state="success" hint="Code applied" />
	<SimpleTextField label="Customer ID" value="C-1024" readonly />
	<SimpleTextField label="Branch" value="Milan" disabled />
</div>

<style>
	.form {
		display: grid;
		gap: 16px;
		width: 100%;
		max-width: 340px;
	}
</style>
