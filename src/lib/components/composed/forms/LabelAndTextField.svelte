<script lang="ts">
    import { Icon, ToolTip, SimpleTextField } from "$lib";

	let clazz: {
		label?: string
		input?: {
			container?: string,
			row?: string,
			field?: string,
			hint?: string,
			input?: string
		}
	} = {}
	export { clazz as class }

	export let value: string | number | undefined = undefined,
		label: string | undefined = undefined,
		description: string | undefined = undefined,
		info: string | undefined = undefined,
		placeholder: string = '',
		name: string,
		type: 'password' | 'text' | 'number' = 'text',
		readonly: boolean = false,
		error: boolean = false,
		errorText: string = '',
		disabled: boolean = false,
		orientation: 'horizontal' | 'vertical' = 'vertical'

	let infoActivator: HTMLElement
		
</script>

<div
	style:display={orientation === 'horizontal' ? 'grid' : 'block'}
	style:grid-template-columns="1fr 1fr"
	style:gap="15px"
>
	{#if !!label}
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
	{/if}
	
	<div 
		style:margin-top="8px"
		style:grid-column="2"
		style:grid-row="1"
	>
		<SimpleTextField
			bind:value
			{type}
			{readonly}
			{errorText}
			bind:error
			{disabled}
			{placeholder}
			on:input
			on:focus
			on:keydown
			class={clazz.input}
			--simple-textfield-border={error ? "1px solid red" : "0"}
		>
			<svelte:fragment slot="prepend-inner">
				<slot name="prepend-inner" />
			</svelte:fragment>
			<svelte:fragment slot="append-inner">
				<slot name="append-inner" />
			</svelte:fragment>
		</SimpleTextField>
	</div>
</div>


