<script lang="ts" context="module">
  import type { Item } from "../../../components/simple/forms/Autocomplete.svelte";
  export type { Item }
</script>

<script lang="ts">
  import Autocomplete from "../../../components/simple/forms/Autocomplete.svelte";
  import debounceStore from "$lib/stores/debounce";
  import { writable } from 'svelte/store';

  export let items: Item[] = [],
    values: Item[] = [],
    multiple: boolean = false,
    searcher: (params: {
      searchText: string
    }) => Promise<Item[]>,
    searchThreshold: number = 2,
    debounceTimeout: number = 500,
    searching: boolean = false,
    search: boolean = false,
    searchText: string | undefined = undefined,
    maxVisibleChips: number | undefined = undefined,
    menuOpened: boolean = false,
    mobileDrawer: boolean = false

  const searchTextValue = writable<string | undefined>(searchText)
  $: searchTextDebounce = debounceStore(searchTextValue, debounceTimeout)
  
  $: if(!!$searchTextDebounce && searchThreshold <= $searchTextDebounce.length) {
    searching = true
    searcher({ searchText: $searchTextDebounce }).then((it) => {
      items = it
    }).finally(() => {
      searching = false
    })
  }
  $: if(search) {
    search = false
    searching = true
    searcher({ searchText: $searchTextDebounce }).then((it) => {
      items = it
    }).finally(() => {
      searching = false
    })
  }
  $: $searchTextValue = searchText
</script>

<Autocomplete
  bind:items
  bind:values
  bind:searchText
  bind:multiple
  bind:maxVisibleChips
  bind:menuOpened
  bind:mobileDrawer
  searchFunction={() => true}
  on:change
></Autocomplete>