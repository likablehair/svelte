<script lang="ts" context="module">
	export type Option = {
		icon?: string
		value: string | number | undefined
		text: string
	};
</script>

<script lang="ts">
    import { Icon, ToolTip } from "$lib";
    import Select from "$lib/components/simple/forms/Select.svelte";

	let clazz: {
		label?: string
		input?: {
			container?: string
			row?: string
			input?: string
		}
	} = {}
	export { clazz as class }
  
	export let value: string | number | undefined = undefined,
		label: string,
		description: string | undefined = undefined,
		info: string | undefined = undefined,
		name: string,
		options: Option[],
		disabled: boolean = false,
		orientation: 'horizontal' | 'vertical' = 'vertical'

	let infoActivator: HTMLElement

</script>

<div
	style:display={orientation === 'horizontal' ? 'grid' : 'block'}
	style:grid-template-columns="1fr 1fr"
	style:gap="15px"
>
	<div
		style:grid-column="1"
		style:grid-row="1"
	>
		<div
			bind:this={infoActivator}
		>	
			<label 
				style:font-weight="500" 
				style:margin-left="4px" 
				for={name} 
				class={clazz.label}
			>
				{label || ''}
			</label>
			{#if !!info}
				<Icon						
					name="mdi-help-circle-outline"
					--icon-size="16px"
				/>
			{/if}
		</div>
		<div
			style:font-weight="200"
		>
			{description || ''}
		</div>
		{#if !!info}
			<ToolTip
				appearTimeout={1000}
				activator={infoActivator}
			>
				<div
					style:background-color='rgb(var(--global-color-background-600), .95)'
					style:border-radius="5px"
					style:padding="10px"
				>
					{info}
				</div>
			</ToolTip>
		{/if}
	</div>
	
	<div 
		style:margin-top="8px"
		style:grid-column="2"
		style:grid-row="1"
	>
		<Select bind:value {options} {disabled} on:change />
	</div>
</div>