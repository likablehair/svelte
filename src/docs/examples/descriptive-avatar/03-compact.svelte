<!-- @component Compact
`compact` shows only the avatar and moves the title and subtitle to a Tooltip, for a sidebar that collapses. The accessible name stays the title. -->
<script lang="ts">
	import { DescriptiveAvatar, Switch } from '#lib';

	let compact = $state(true);
</script>

<Switch bind:checked={compact} label="Compact" />
<div class="sidebar" class:compact>
	<DescriptiveAvatar title="Giulia Marini" subtitle="Senior Colorist" {compact} onclick={() => {}} />
	<DescriptiveAvatar title="Mario Rossi" subtitle="Manager" {compact} onclick={() => {}} />
</div>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 240px;
		margin-top: 16px;
		padding: 8px;
		border: 1px solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
	}

	.sidebar.compact {
		width: fit-content;
	}
</style>
