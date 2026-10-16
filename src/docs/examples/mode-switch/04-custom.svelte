<!-- @component Custom look and saving
CSS variables give a neutral pill with round options and the selected one on a raised surface, and `onchange` saves the choice, for example in the user profile. -->
<script lang="ts">
	import { ModeSwitch } from '#lib';

	let saved = $state<string>();
</script>

<div class="demo">
	<ModeSwitch
		onchange={({ mode }) => (saved = mode)}
		--mode-switch-background="var(--global-color-surface-2)"
		--mode-switch-border-color="transparent"
		--mode-switch-border-radius="var(--global-radius-full)"
		--mode-switch-option-border-radius="var(--global-radius-full)"
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
