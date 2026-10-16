<!-- @component Custom look and saving
CSS variables give a neutral look with the selected option on a raised surface, and `onchange` saves the choice, for example in the user profile. -->
<script lang="ts">
	import { ModeSwitch } from '#lib';

	let saved = $state<string>();
</script>

<div class="demo">
	<ModeSwitch
		onchange={({ mode }) => (saved = mode)}
		--mode-switch-background="var(--global-color-surface-2)"
		--mode-switch-border-color="transparent"
		--mode-switch-border-radius="var(--global-radius-md)"
		--mode-switch-option-border-radius="var(--global-radius-sm)"
		--mode-switch-selected-background="var(--global-color-surface-pop)"
		--mode-switch-selected-color="var(--global-color-text)"
		--mode-switch-selected-box-shadow="var(--global-shadow-sm)"
	/>
	<p>{saved ? `Saved in the profile: ${saved}` : 'Pick a mode to save it.'}</p>
</div>

<style>
	.demo {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	p {
		margin: 0;
	}
</style>
