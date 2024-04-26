<script lang="ts" context="module">
  export type IconItem = {
    value: string | number,
    icon: string,
    data?: any
  };
</script>

<script lang="ts">
  import Dropdown, { type Item } from "./Dropdown.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { createEventDispatcher } from "svelte";

  let dispatch = createEventDispatcher<{
    change: {
      unselect: IconItem | undefined;
      select: IconItem | undefined;
      selection: IconItem[];
    }
  }>()

  export let items: IconItem[] = [],
    values: IconItem[] = [],
    clearable: boolean = false,
    disabled: boolean = false

  let dropdownValues: Item[] = []

  $: dropdownValues = values.map((e) => ({
    value: e.value,
    data: {
      icon: e.icon,
      data: e.data
    }
  }))

  $: dropDownItems = items.map((e) => ({
    value: e.value,
    data: {
      icon: e.icon,
      data: e.data
    }
  }))

  function handleChange(event: CustomEvent<{
    unselect: Item | undefined;
    select: Item | undefined;
    selection: Item[];
  }>) {
    values = event.detail.selection.map((e) => ({
      value: e.value,
      icon: e.data.icon,
      data: e.data
    }))

    dispatch('change', {
      unselect: !!event.detail.unselect ? {
        value: event.detail.unselect.value,
        icon: event.detail.unselect.data.icon,
        data: event.detail.unselect.data
      } : undefined,
      select: !!event.detail.select ? {
        value: event.detail.select.value,
        icon: event.detail.select.data.icon,
        data: event.detail.select.data
      } : undefined,
      selection: values
    })
  }
</script>

<Dropdown
  items={dropDownItems}
  clearable={clearable}
  placeholder=""
  bind:disabled
  bind:values={dropdownValues}
  on:change={handleChange}
  width="60px"
>
  <svelte:fragment slot="label" let:generatedLabel let:values let:placeholder let:clearable let:handleCloseClick>
    {#if values.length == 0}
      {placeholder}
    {:else if values.length == 1}
      <Icon name={values[0].data.icon}></Icon> 
    {:else}
      {generatedLabel}
    {/if}
    {#if clearable && values.length > 0}
      <Icon
        name="mdi-close"
        click
        on:click={handleCloseClick}
      ></Icon>
    {:else}
      <Icon name="mdi-chevron-down"></Icon>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="item-label" let:item>
    <div class="label-container">
      <Icon
        name={item.data.icon}
        --icon-size="20px"
      ></Icon>
    </div>
  </svelte:fragment>
</Dropdown>

<style>
  .label-container {
    display: flex;
    justify-content: center;
  }
</style>