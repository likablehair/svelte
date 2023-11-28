<script lang="ts">
  import Autocomplete, {
    type Item,
  } from "$lib/components/simple/forms/Autocomplete.svelte";
  import type { ComponentProps } from "svelte";
  import { countriesOptions } from '$lib/utils/countries';

  let clazz: {
    flagIcon?: string,
  } = {};
	export { clazz as class };

  export let autocompleteProps: Omit<ComponentProps<Autocomplete>, 'items'> = {},
    selected: Item[] = []

  let items: Item[] = countriesOptions;
</script>

<Autocomplete
  items={items}
  bind:values={selected}
  {...autocompleteProps}
  on:blur
  on:close
  on:focus
  on:keydown
  on:change
>
  <svelte:fragment 
    slot="chip-label"
    let:selection
  >
    <span 
      class="flag-icon fi fi-{selection.value.toString().toLowerCase()} fis {clazz.flagIcon || ''}"
    ></span>
    {selection.label}
  </svelte:fragment>
  <svelte:fragment
    slot="item-label" 
    let:item
  >
    <span 
      class="flag-icon fi fi-{item.value.toString().toLowerCase()} fis {clazz.flagIcon || ''}"
    ></span>
    {item.label}
  </svelte:fragment>
</Autocomplete>

<style>
  .flag-icon {
    border-radius: 4px;
    font-size: var(--countries-autocomplete-flag-icon-size, 1.2rem);
  }
</style>
