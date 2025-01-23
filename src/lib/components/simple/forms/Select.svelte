<script lang="ts" context="module">
	import './Select.css'
	export type Option = {
		icon?: string
		value: string | number | undefined
		text: string
	}
</script>

<script lang="ts">
    import { Icon } from "$lib";


	export let options: Option[],
		name: string | undefined = undefined,
		value: string | number | undefined = undefined,
		disabled: boolean = false,
		placeholder: string | undefined = undefined
</script>

<select
	{name}
	bind:value
	on:change
	{placeholder}
	class="select"
	{disabled}
>
	{#each options as option}
		<option value={option.value} class="option">
			{#if !!option.icon}
				<Icon name={option.icon} />
			{/if}
			{option.text}
		</option>
	{/each}
</select>

<style>
	.select {
		height: var(
			--select-height, 
			var(--select-default-height)
		);
		width: var(
			--select-width, 
			var(--select-default-width)
		);
		color: var(
			--select-color, 
			var(--select-default-color)
		);
		background-color: var(
			--select-background-color,
			var(--select-default-background-color)
		);
		padding-left: var(
			--select-padding-left,
			var(--select-default-padding-left)
		);
		padding-right: var(
			--select-padding-right,
			var(--select-default-padding-right)
		);
		font-size: inherit;
		font-family: inherit;
		text-overflow: ellipsis;
		border-radius: var(
			--select-border-radius,
			var(--select-default-border-radius)
		);
		border: var(
			--select-border,
			var(--select-default-border)
		);
	}

	.select:focus,
	.select:active {
		border-color: var(
			--selecr-active-border-color,
			var(--select-default-active-border-color)
		 ) !important;
	}

	.option {
		padding: 10px;
		color: var(
			--option-color,
			var(--option-default-color)
		);
		background-color: var(
			--option-background-color,
			var(--option-default-background-color)
		);
		border-color: var(
			--option-border-color,
			var(--option-default-border-color)
		);
	}

	.select:focus {
		outline: none;
	}
</style>