<script lang="ts" generics="Item extends {[key: string]: any}, Data">
  import type { ComponentProps } from "svelte";
  import PaginatedTable from "./PaginatedTable.svelte";
  import HeadersDrawer from "../common/HeadersDrawer.svelte";
  import { Icon } from "$lib";
  import './EnhancedPaginatedTable.css'
  import lodash from "lodash";

  const deepEqual = lodash.isEqual

  interface Props extends ComponentProps<typeof PaginatedTable<Item, Data>> {
    headersToShowInTable: ComponentProps<typeof PaginatedTable<Item, Data>>['headers']
    pinnableColumns?: boolean,
    headerDrawerProps?: ComponentProps<typeof HeadersDrawer>['drawerProps']
    onsaveHeadersToShow?: ComponentProps<typeof HeadersDrawer>['onsaveHeadersToShow']
    headerDrawerContentSnippet?: ComponentProps<typeof HeadersDrawer>['contentSnippet']
    headerDrawerHeadersToAddSnippet?: ComponentProps<typeof HeadersDrawer>['headersToAddSnippet']
    headerDrawerItemSnippet?: ComponentProps<typeof HeadersDrawer>['itemSnippet']
  }

  let {
    headersToShowInTable = $bindable(),
    pinnableColumns,
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
    resizedColumnSizeWithPadding = $bindable({}),
    ...rest
  }: Props = $props()

  const organizedHeaders = () => {
    let pinnedFixedHeaders = headers.filter(h => h.pinned).map(h => ({
      ...h,
      locked: true,
    }))
    let pinnedByUserHeaders = headersToShowInTable.filter(h => 
      h.pinned
      && !pinnedFixedHeaders.find(fixed => fixed.value == h.value)
    )
    let otherHeaders = headersToShowInTable.filter(h =>
      !pinnedFixedHeaders.find(fixed => fixed.value == h.value)
      && !pinnedByUserHeaders.find(fixed => fixed.value == h.value)
    )
    return [
      ...pinnedFixedHeaders,
      ...pinnedByUserHeaders,
      ...otherHeaders
    ];
  }
  $effect(() => {
    if(!deepEqual(organizedHeaders(), headersToShowInTable)) {
      headersToShowInTable = organizedHeaders()
    }
  });

  let openHeaderDrawer: boolean = $state(false),
    availableHeaders = $derived.by(() => {
      return !!headers
        ? headers
            .filter((h) => {
              return !headersToShowInTable.find((hst) => hst.value == h.value);
            })
        : []
    })

  function handleSaveHeadersToShow(event: Parameters<NonNullable<ComponentProps<typeof HeadersDrawer<Item, Data>>['onsaveHeadersToShow']>>[0]) {
    headersToShowInTable = event.detail.headersToShow;
    onsaveHeadersToShow?.(event)
  }
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
  onsaveHeadersToShow={handleSaveHeadersToShow}
  {availableHeaders}
  bind:headersToShow={headersToShowInTable}
  contentSnippet={headerDrawerContentSnippet}
  drawerProps={headerDrawerProps}
  headersToAddSnippet={headerDrawerHeadersToAddSnippet}
  itemSnippet={headerDrawerItemSnippet}
  {pinnableColumns}
/>