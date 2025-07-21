<script lang="ts">
  import Autocomplete, {
    type Item,
  } from "$lib/components/simple/forms/Autocomplete.svelte";
  import type { ComponentProps } from "svelte";
  import { countriesOptions } from '$lib/utils/countries';
  import FlagIcon from "$lib/components/simple/media/FlagIcon.svelte";

  interface Props {
    autocompleteProps?: Omit<ComponentProps<typeof Autocomplete>, 'items'>;
    selected?: Item[];
    items?: Item[];
    class?: {
      flagIcon?: string,
    }
    onblur?: ComponentProps<typeof Autocomplete>['onblur']
    onclose?: ComponentProps<typeof Autocomplete>['onclose']
    onfocus?: ComponentProps<typeof Autocomplete>['onfocus']
    onkeydown?: ComponentProps<typeof Autocomplete>['onblur']
    onchange?: ComponentProps<typeof Autocomplete>['onchange']
  }

  let {
    autocompleteProps = {},
    selected = $bindable(),
    items = countriesOptions,
    onblur,
    onchange,
    onclose,
    onfocus,
    onkeydown,
    class: clazz = {}
  }: Props = $props();
</script>

<Autocomplete
  items={items}
  bind:values={selected}
  {...autocompleteProps}
  {onblur}
  {onclose}
  {onfocus}
  {onkeydown}
  {onchange}
>
  {#snippet chipLabelSnippet({ selection })}
    <FlagIcon
      alpha2={selection.value.toString().toLowerCase()}
      class={clazz.flagIcon}
    ></FlagIcon>
    {selection.label}
  {/snippet}
  {#snippet itemLabelSnippet({ item })}
    <FlagIcon
      alpha2={item.value.toString().toLowerCase()}
      class={clazz.flagIcon}
    ></FlagIcon>
    {item.label}
  {/snippet}
</Autocomplete>
