<script lang="ts" module>
  import type { Item } from "../../../components/simple/forms/Autocomplete.svelte";
  export type { Item }
</script>

<script lang="ts" generics="Data">
  import Autocomplete from "../../../components/simple/forms/Autocomplete.svelte";
  import debounceStore from "$lib/stores/debounce";
  import { writable } from 'svelte/store';
  import type { ComponentProps } from "svelte";

  type AsyncAutocompleteItem = Item<Data>

  interface Props {
    items: AsyncAutocompleteItem[];
    values?: AsyncAutocompleteItem[];
    multiple?: boolean;
    searcher: (params: {
      searchText: string
    }) => Promise<AsyncAutocompleteItem[]>;
    placeholder?: string;
    searchThreshold?: number;
    debounceTimeout?: number;
    searching?: boolean;
    search?: boolean;
    searchText?: string;
    maxVisibleChips?: number;
    menuOpened?: boolean;
    mobileDrawer?: boolean;
    closeOnSelect?: boolean;
    disabled?: boolean;
    chipLabelSnippet?: ComponentProps<typeof Autocomplete<Data>>['chipLabelSnippet']
    itemLabelSnippet?: ComponentProps<typeof Autocomplete<Data>>['itemLabelSnippet']
    onchange?: ComponentProps<typeof Autocomplete<Data>>['onchange']
  }

  let {
    items = [],
    values = [],
    multiple = false,
    searcher,
    placeholder,
    searchThreshold = 2,
    debounceTimeout = 500,
    searching = false,
    search = false,
    searchText,
    maxVisibleChips,
    menuOpened = false,
    mobileDrawer = false,
    closeOnSelect = false,
    disabled = false,
    chipLabelSnippet,
    itemLabelSnippet,
    onchange,
  }: Props = $props();

  const searchTextValue = writable<string | undefined>(searchText)
  let searchTextDebounce = $derived(debounceStore(searchTextValue, debounceTimeout))
  
  $effect(() => {
    if(!!$searchTextDebounce && searchThreshold <= $searchTextDebounce.length) {
      searching = true
      searcher({ searchText: $searchTextDebounce }).then((it) => {
        items = it
      }).finally(() => {
        searching = false
      })
    }
  }) 
  $effect(() => {
    if(search) {
      search = false
      searching = true
      searcher({ searchText: $searchTextDebounce }).then((it) => {
        items = it
      }).finally(() => {
        searching = false
      })
    }
  }) 
  $effect(() => {
    $searchTextValue = searchText
  })
</script>

<Autocomplete
  {items}
  bind:values
  bind:searchText
  {multiple}
  {maxVisibleChips}
  bind:menuOpened
  {mobileDrawer}
  {placeholder}
  {closeOnSelect}
  {disabled}
  searchFunction={() => true}
  {onchange}
  {chipLabelSnippet}
  {itemLabelSnippet}
>
</Autocomplete>