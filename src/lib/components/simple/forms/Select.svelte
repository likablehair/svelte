<script lang="ts" context="module">
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
		borderRadius: string | undefined = undefined,
		placeholder: string | undefined = undefined,
		border: string = '1.3px solid rgb(var(--global-color-contrast-300), .3)'
</script>

<select
	{name}
	bind:value
	on:change
	{placeholder}
	class="select"
	style:color="rgb(var(--global-color-contrast-900))"
	style:background-color="transparent"
	style:border-radius={!!borderRadius ? borderRadius : '5px'}
	style:font-family="inherit"
	style:font-size="inherit"
	style:padding-left="5px"
	style:padding-right="5px"
	style:border
	style:text-overflow="ellipsis"
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
		height: var(--standard-select-height, 36px);
		width: var(--standard-select-width, 100%);
		color: var(--global-contrast-color);
		background-color: var(--global-background-color);
		border-color: var(--global-thin-contrast-color);
		padding-left: var(--standard-select-padding-left, 5px);
		padding-right: var(--standard-select-padding-right, 5px);
	}

	.select:focus,
	.select:active {
		border-color: rgb(var(--global-color-primary-500)) !important;
	}

	.option {
		padding: 10px;
		color: rgb(var(--global-color-contrast-700));
		background-color: rgb(var(--global-color-background-200));
		border-color: rgb(var(--global-color-contrast-200));
	}

	.select:focus {
		outline: none;
	}
</style>