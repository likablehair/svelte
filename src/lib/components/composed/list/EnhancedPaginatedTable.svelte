<script lang="ts" generics="Item extends {[key: string]: any}, Data">
  import type { ComponentProps } from "svelte";
  import PaginatedTable from "./PaginatedTable.svelte";
  import HeadersDrawer from "../common/HeadersDrawer.svelte";
  import { Icon } from "$lib";
  import './EnhancedPaginatedTable.css'


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
    stickyAppendSnippet: internalStickyAppendSnippet,
    sortedBy = $bindable(undefined),
    sortDirection = $bindable("asc"),
    page = $bindable(1),
    rowsPerPage = $bindable(20),
    filters = $bindable([]),
    quickFilters = $bindable(),
    selectedItems = $bindable([]),
    selectedAll = $bindable(),
    stickFirstColumn,
    resizedColumnSizeWithPadding = $bindable({}),
    ...rest
  }: Props = $props()

  let openHeaderDrawer: boolean = $state(false),
    availableHeaders = $derived.by(() => {
      return !!headers
        ? headers
            .filter((h) => {
              return !headersToShowInTable.find((hst) => hst.value == h.value);
            })
        : []
    }),
    firstColumn = $derived.by(() => {
      return stickFirstColumn
        ? headers[0]
        : undefined;
    })

  $effect(() => {
    if (firstColumn) {
      if (headersToShowInTable[0].value === firstColumn.value) {
        return; 
      }

      const otherHeaders = headersToShowInTable.filter(h => h.value !== firstColumn.value);
      headersToShowInTable = [firstColumn, ...otherHeaders];
    }
  });
</script>

<PaginatedTable 
  {...rest} 
  {lang} 
  headers={headersToShowInTable}
  {stickFirstColumn}
  bind:sortedBy
  bind:sortDirection
  bind:page
  bind:rowsPerPage
  bind:filters
  bind:quickFilters
  bind:selectedItems
  bind:selectedAll
  bind:resizedColumnSizeWithPadding
>
  {#snippet stickyAppendSnippet()}
    <Icon
      name="mdi-plus-circle-outline"
      onclick={() => (openHeaderDrawer = true)}
      --icon-size="var(
        --enhanced-paginated-table-customize-headers-icon-size,
        var(--enhanced-paginated-table-default-customize-headers-icon-size)
      )"
    />
    {@render internalStickyAppendSnippet?.()}
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
  {firstColumn}
/>