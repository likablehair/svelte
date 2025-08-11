<script lang="ts" module>
  import type { Item } from "../../../components/simple/forms/Autocomplete.svelte";
  export type { Item }
</script>

<script lang="ts" generics="Data">
  import Autocomplete from "../../../components/simple/forms/Autocomplete.svelte";
  import debounceStore from "$lib/stores/debounce";
  import { writable } from 'svelte/store';
  import type { ComponentProps } from "svelte";
  import Menu from "$lib/components/simple/common/Menu.svelte";

  type AsyncAutocompleteItem = Item<Data>

  type Props = {
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
    menuWidth?: string;
    menuAnchor?: ComponentProps<typeof Menu>['anchor']
  } & ComponentProps<typeof Autocomplete<Data>>

  let {
    items = [],
    values = $bindable(),
    multiple = false,
    searcher,
    placeholder,
    searchThreshold = 2,
    debounceTimeout = 500,
    searching = false,
    search = false,
    searchText = $bindable(),
    maxVisibleChips,
    menuOpened = $bindable(false),
    mobileDrawer = false,
    closeOnSelect = false,
    disabled = false,
    menuAnchor,
    menuWidth,
    onchange,
    ...restProps
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
  {menuWidth}
  {menuAnchor}
  searchFunction={() => true}
  {onchange}
  {...restProps}
></Autocomplete>