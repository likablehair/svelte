<script lang="ts">
	import { Icon, ToolTip, SimpleTextField } from "$lib";
    import type { ComponentProps } from "svelte";

	interface Props {
    value?: string | number;
    label?: string;
    description?: string;
    info?: string;
    placeholder?: string;
    name: string;
    type?: 'password' | 'text' | 'number';
    readonly?: boolean;
    error?: boolean;
    errorText?: string;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
		class?: {
			label?: string
			input?: {
				container?: string,
				row?: string,
				field?: string,
				hint?: string,
				input?: string
			}
		}
		onkeydown?: ComponentProps<typeof SimpleTextField>['onkeydown']
		onfocus?: ComponentProps<typeof SimpleTextField>['onfocus']
		oninput?: ComponentProps<typeof SimpleTextField>['oninput']
		prependInnerSnippet?: ComponentProps<typeof SimpleTextField>['prependInnerSnippet']
		appendInnerSnippet?: ComponentProps<typeof SimpleTextField>['appendInnerSnippet']
  }

  let {
    value = $bindable(undefined),
    label = undefined,
    description = undefined,
    info = undefined,
    placeholder = '',
    name,
    type = 'text',
    readonly = false,
    error = false,
    disabled = false,
    orientation = 'vertical',
		class: clazz = {},
		onfocus,
		oninput,
		onkeydown,
		appendInnerSnippet,
		prependInnerSnippet,
  }: Props = $props();

	let infoActivator: HTMLElement | undefined = $state()
		
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
			{disabled}
			{placeholder}
			{oninput}
			{onfocus}
			{onkeydown}
			class={clazz.input}
			--simple-textfield-border={error ? "1px solid red" : "0"}
			{prependInnerSnippet}
			{appendInnerSnippet}
		>
		</SimpleTextField>
	</div>
</div>


