<script lang="ts" generics="Item extends {[key: string]: any}, Data">
    import type { ComponentProps } from "svelte";
    import PaginatedTable from "./PaginatedTable.svelte";
    import HeadersDrawer from "../common/HeadersDrawer.svelte";
    import { Icon } from "$lib";


  interface Props extends ComponentProps<typeof PaginatedTable<Item, Data>> {
    headersToShowInTable: ComponentProps<typeof PaginatedTable<Item, Data>>['headers']
    headerDrawerProps?: ComponentProps<typeof HeadersDrawer>['drawerProps']
    onsaveHeadersToShow?: ComponentProps<typeof HeadersDrawer>['onsaveHeadersToShow']
    headerDrawerContentSnippet?: ComponentProps<typeof HeadersDrawer>['contentSnippet']
    headerDrawerHeadersToAddSnippet?: ComponentProps<typeof HeadersDrawer>['headersToAddSnippet']
    headerDrawerItemSnippet?: ComponentProps<typeof HeadersDrawer>['itemSnippet']
  }

  let {
    headersToShowInTable = $bindable(),
    headerDrawerProps,
    onsaveHeadersToShow,
    headerDrawerContentSnippet,
    headerDrawerItemSnippet,
    headerDrawerHeadersToAddSnippet,
    lang = 'en',
    headers,
    appendSnippet: internalAppendSnippet,
    sortedBy = $bindable(undefined),
    sortDirection = $bindable("asc"),
    page = $bindable(1),
    rowsPerPage = $bindable(20),
    filters = $bindable([]),
    quickFilters = $bindable(),
    selectedItems = $bindable([]),
    selectedAll = $bindable(),
    ...rest
  }: Props = $props()

  let openHeaderDrawer: boolean = $state(false),
    availableHeaders = !!headers
      ? headers
          .filter((h) => {
            return !headersToShowInTable.find((hst) => hst.value == h.value);
          })
      : []
</script>

<PaginatedTable 
  {...rest} 
  {lang} 
  headers={headersToShowInTable}
  bind:sortedBy
  bind:sortDirection
  bind:page
  bind:rowsPerPage
  bind:filters
  bind:quickFilters
  bind:selectedItems
  bind:selectedAll
>
  {#snippet appendSnippet({ index, item, })}
    {#if index == -1}
      <Icon
        name="mdi-plus-circle-outline"
        onclick={() => (openHeaderDrawer = true)}
      />
    {/if}
    {@render internalAppendSnippet?.({ index, item, })}
  {/snippet}
</PaginatedTable>

<HeadersDrawer
  bind:open={openHeaderDrawer}
  {lang}
  {onsaveHeadersToShow}
  {availableHeaders}
  bind:headersToShow={headersToShowInTable}
  contentSnippet={headerDrawerContentSnippet}
  drawerProps={headerDrawerProps}
  headersToAddSnippet={headerDrawerHeadersToAddSnippet}
  itemSnippet={headerDrawerItemSnippet}
/>