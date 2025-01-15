<script lang="ts">
  import Autocomplete, {
    type Item,
  } from "$lib/components/simple/forms/Autocomplete.svelte";
  import type { ComponentProps } from "svelte";
  import { countriesOptions } from '$lib/utils/countries';
  import FlagIcon from "$lib/components/simple/media/FlagIcon.svelte";

  let clazz: {
    flagIcon?: string,
  } = {};
	export { clazz as class };

  export let autocompleteProps: Omit<ComponentProps<Autocomplete>, 'items'> = {},
    selected: Item[] = [],
    items: Item[] = countriesOptions;
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
    <FlagIcon
      alpha2={selection.value.toString().toLowerCase()}
      class={clazz.flagIcon}
    ></FlagIcon>
    {selection.label}
  </svelte:fragment>
  <svelte:fragment
    slot="item-label" 
    let:item
  >
    <FlagIcon
      alpha2={item.value.toString().toLowerCase()}
      class={clazz.flagIcon}
    ></FlagIcon>
    {item.label}
  </svelte:fragment>
</Autocomplete>
