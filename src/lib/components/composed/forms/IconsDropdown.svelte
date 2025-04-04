<script lang="ts" module>
  export type IconItem<Data = any> = {
    value: string | number,
    icon: string,
    data?: Data
  };
</script>

<script lang="ts" generics="Data">
  import Dropdown from "./Dropdown.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import type { ComponentProps } from "svelte";
  import Autocomplete, { type Item } from "$lib/components/simple/forms/Autocomplete.svelte";

  type IconItemData = IconItem<Data>

  type AutocompleteData = { icon: string, data?: Data }
  type AutocompleteItem = Item<AutocompleteData>
  interface Props {
    items?: IconItemData[];
    values?: IconItemData[];
    clearable?: boolean;
    disabled?: boolean;
    placeholder?: string;
    width?: string;
    minWidth?: string;
    menuWidth?: string;
    onchange?: (event: {
      detail: {
        unselect: IconItemData | undefined;
        select: IconItemData | undefined;
        selection: IconItemData[];
      }
    }) => void
  }

  let {
    items = [],
    values = $bindable([]),
    clearable = false,
    disabled = false,
    placeholder = '',
    width = "auto",
    minWidth = "auto",
    menuWidth = "60px",
    onchange,
  }: Props = $props();

  let dropdownValues: AutocompleteItem[] = $state([])

  $effect(() => {
    dropdownValues = values.map((e) => ({
      value: e.value,
      data: {
        icon: e.icon,
        data: e.data
      }
    }))
  })

  let dropDownItems: AutocompleteItem[] = $derived(items.map((e) => ({
    value: e.value,
    data: {
      icon: e.icon,
      data: e.data
    }
  })))

  function handleChange(event: Parameters<NonNullable<ComponentProps<typeof Autocomplete<AutocompleteData>>['onchange']>>[0]) {
    if(event.detail.selection.every(selection => !!selection.data) 
      && !!event.detail.unselect?.data
      && !!event.detail.select?.data
    ) {
      values = event.detail.selection.map((e) => ({
        value: e.value,
        icon: e.data!.icon,
        data: e.data!.data
      }))
  
      if(onchange) {
        onchange({
          detail: {
            unselect: !!event.detail.unselect ? {
              value: event.detail.unselect.value,
              icon: event.detail.unselect.data.icon,
              data: event.detail.unselect.data.data
            } : undefined,
            select: !!event.detail.select ? {
              value: event.detail.select.value,
              icon: event.detail.select.data.icon,
              data: event.detail.select.data.data
            } : undefined,
            selection: values
          }
        })
      }
    }
  }
</script>

<Dropdown
  items={dropDownItems}
  clearable={clearable}
  {placeholder}
  {disabled}
  bind:values={dropdownValues}
  onchange={handleChange}
  {width}
  {minWidth}
  {menuWidth}
>
  {#snippet labelSnippet({ generatedLabel, values, placeholder, handleCloseClick })}
    {#if values.length == 0}
      {placeholder}
    {:else if values.length == 1}
      {#if values[0].data}
        <Icon name={values[0].data.icon}></Icon> 
      {/if}
    {:else}
      {generatedLabel}
    {/if}
    {#if clearable && values.length > 0}
      <Icon
        name="mdi-close"
        onclick={handleCloseClick}
      ></Icon>
    {:else}
      <Icon name="mdi-chevron-down"></Icon>
    {/if}
  {/snippet}
  {#snippet itemLabelSnippet({ item })}
    {#if item.data}
      <div class="label-container">
        <Icon
          name={item.data.icon}
          --icon-size="20px"
        ></Icon>
      </div>
    {/if}
  {/snippet}
</Dropdown>

<style>
  .label-container {
    display: flex;
    justify-content: center;
  }
</style>