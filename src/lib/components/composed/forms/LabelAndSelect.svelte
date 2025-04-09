<script lang="ts" module>
	export type Option = {
		icon?: string
		value: string | number | undefined
		text: string
	};
</script>

<script lang="ts">
	import { Icon, ToolTip } from "$lib";
	import Select from "$lib/components/simple/forms/Select.svelte";
    import type { ComponentProps } from "svelte";
  
	interface Props {
    value?: string | number;
    label: string;
    description?: string;
    info?: string;
    name: string;
    options: Option[];
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
		class?: {
			label?: string
			input?: {
				container?: string
				row?: string
				input?: string
			}
		}
		onchange?: ComponentProps<typeof Select>['onchange']
  }

  let {
    value = $bindable(undefined),
    label,
    description = undefined,
    info = undefined,
    name,
    options,
    disabled = false,
    orientation = 'vertical',
		class: clazz = {},
		onchange,
  }: Props = $props();

	let infoActivator: HTMLElement | undefined = $state()

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
		<Select bind:value {options} {disabled} {onchange} />
	</div>
</div>