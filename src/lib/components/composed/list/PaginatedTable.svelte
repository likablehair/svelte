<script lang="ts" module>
  type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
    
    export type Header = ArrayElement<
    NonNullable<ComponentProps<typeof SimpleTable>["headers"]>
      >;
    </script>

<script lang="ts">
  import SimpleTable from "$lib/components/simple/lists/SimpleTable.svelte";
  import Paginator from "$lib/components/simple/lists/Paginator.svelte";
  import Dropdown from "$lib/components/composed/forms/Dropdown.svelte";
  import { type ComponentProps, type Snippet } from "svelte";
  import Filters from "../search/Filters.svelte";
  import SearchBar from "../search/SearchBar.svelte";
  import type Builder from "$lib/utils/filters/builder";
  import Converter from "$lib/utils/filters/filters";

  interface Props extends Omit<ComponentProps<typeof SimpleTable>, 'class'>{
    page?: NonNullable<ComponentProps<typeof Paginator>["page"]>;
    maxPage?: ComponentProps<typeof Paginator>["maxPage"];
    rowsPerPageOptions?: ComponentProps<typeof Dropdown>["items"];
    hideRowsPerPage?: boolean;
    totalElements?: number;
    rowsPerPage?: number;
    filters?: ComponentProps<typeof Filters>["filters"];
    searchBarColumns?: string[];
    searchBarVisible?: boolean;
    searchBarPlaceholder?: string;
    editFilterMode?: "one-edit" | "multi-edit";
    showActiveFilters?: boolean;
    class?: {
      simpleTable?: ComponentProps<typeof SimpleTable>['class']
    }
    onpaginationChange?: (event: {
      detail: {
        rowsPerPage: number,
        page: number,
        builder: Builder
      }
    }) => void
    onfiltersChange?: (event: {
      detail: {
        builder: Builder
      }
    }) => void
    onremoveFilter?: ComponentProps<typeof Filters>['onremoveFilter']
    onremoveAllFilters?: ComponentProps<typeof Filters>['onremoveAllFilters']
    filterAppendSnippet?: ComponentProps<typeof Filters>['appendSnippet']
    customFilterChipSnippet?: ComponentProps<typeof Filters>['customChipSnippet']
    customFilterSnippet?: ComponentProps<typeof Filters>['customSnippet']
    searchBarSnippet?: Snippet<[{
      handleSearchChange: typeof handleSearchChange
    }]>
    footerSnippet?: Snippet<[{
      hideRowsPerPage: typeof hideRowsPerPage,
      rowsPerPageOptions: typeof rowsPerPageOptions,
      rowsPerPageSelection: typeof rowsPerPageSelection,
      totalElements: typeof totalElements,
      page: typeof page,
      maxPage: typeof maxPage,
      rowsPerPage: typeof rowsPerPage,
      handlePaginationChange: typeof handlePaginationChange
    }]>
    rangeDescriptorSnippet?: Snippet<[{
      totalElements: typeof totalElements,
      page: typeof page,
      maxPage: typeof maxPage,
      rowsPerPage: typeof rowsPerPage,
    }]>
  }

  let {
    headers = [],
    items = [],
    sortedBy = $bindable(undefined),
    sortDirection = $bindable('asc'),
    page = 1,
    maxPage = undefined,
    rowsPerPageOptions = [
      { label: "20", value: 20 },
      { label: "50", value: 50 },
      { label: "100", value: 100 },
    ],
    hideRowsPerPage = false,
    totalElements = undefined,
    rowsPerPage = $bindable(20),
    filters = $bindable([]),
    searchBarColumns = undefined,
    searchBarVisible = true,
    searchBarPlaceholder = "Type something to search...",
    lang = "en",
    editFilterMode = "one-edit",
    showActiveFilters = true,
    resizableColumns = false,
    resizedColumnSizeWithPadding = {},
    pointerOnRowHover = undefined,
    doubleClickActive = false,
    doubleClickDelay = 250,
    calculateRowStyles = undefined,
    calculateRowClasses = undefined,
    class: clazz = {},
    onfiltersChange,
    onpaginationChange,
    onremoveFilter,
    onremoveAllFilters,
    customFilterChipSnippet,
    customFilterSnippet,
    filterAppendSnippet,
    onrowClick,
    onrowDoubleClick,
    appendSnippet,
    customSnippet,
    headerLabelSnippet,
    headerSnippet,
    rowActionsSnippet,
    onsort,
    footerSnippet,
    rangeDescriptorSnippet,
    searchBarSnippet,
    noDataSnippet,
    oncolumnResize,
  }: Props = $props();

  let searchBarInput: HTMLElement | undefined = $state(),
    searchText: string | undefined = $state(),
    sortModify: Header['sortModify']

  let rowsPerPageSelection: ComponentProps<typeof Dropdown>['values'] = $state([])

  $effect(() => {
    rowsPerPageSelection = [
      { label: rowsPerPage.toString(), value: rowsPerPage }
    ]
  })

  $effect(() => {
    if(totalElements !== undefined) maxPage = Math.max(Math.round(totalElements/rowsPerPage), 1)
  })

  function handleRowsPerPageChange(event: Parameters<NonNullable<ComponentProps<typeof Dropdown>['onchange']>>[0]) {
    rowsPerPage = Number(event.detail.selection?.[0].value)
    handlePaginationChange()
  }

  function handlePaginationChange() {
    let builder = buildFilters()

    if(onpaginationChange) {
      onpaginationChange({
        detail: {
          rowsPerPage, page, builder
        }
      })
    }
  }

  function handleSearchChange(searchText: string | undefined) {
    let builder = buildFilters({searchText})

    if(onfiltersChange) {
      onfiltersChange({
        detail: {
          builder
        }
      })
    }
  }

  $effect(() => {
    handleSearchChange(searchText)
  })

  function handleFiltersChange() {
    let builder = buildFilters({searchText})

    if(onfiltersChange) {
      onfiltersChange({
        detail: {
          builder
        }
      })
    }
  }

  function handleRemoveFilter(event: Parameters<NonNullable<ComponentProps<typeof Filters>['onremoveFilter']>>[0]) {
    handleFiltersChange()
    
    if(onremoveFilter) {
      onremoveFilter(event)
    }
  }

  function handleRemoveAllFilters() {
    handleFiltersChange()
    
    if(onremoveAllFilters) {
      onremoveAllFilters()
    }
  }

  function handleOnSort(event: Parameters<NonNullable<ComponentProps<typeof SimpleTable>['onsort']>>[0]) {
    sortModify = event.detail.sortModify
    handleFiltersChange()
    
    if(onsort) {
      onsort(event)
    }
  }

  function buildFilters(params?:{searchText?:string | undefined}){
    let converter = new Converter()
    let builder: Builder
    builder = converter.createBuilder({
      filters: filters || []
    })

    if(!!params?.searchText && !!searchBarColumns && searchBarColumns.length > 0) {

      builder.where(b => {
        b.where(searchBarColumns![0], 'ilike', '%' + params?.searchText + '%')
        for(let i = 1; i < searchBarColumns!.length; i += 1) {
          b.orWhere(searchBarColumns![i], 'ilike', '%' + params?.searchText + '%')
        }
      })
    }

    if (!!sortedBy) {
      if(sortModify){
        builder = sortModify({ builder, sortDirection: sortDirection || 'asc' })
      }
      else {
        builder.orderBy(sortedBy, sortDirection || "asc");
      }
    }

    return builder
  }

</script>

<div class="paginated-table">
  {#if searchBarVisible}
    {#if searchBarSnippet}
      {@render searchBarSnippet({ handleSearchChange })}
    {:else}
      <div class="search-bar-container">
        <SearchBar
          placeholder={searchBarPlaceholder}
          bind:input={searchBarInput}
          bind:value={searchText}
        >
        </SearchBar>
      </div>
    {/if}
  {/if}
  <div class="filter-container">
    <Filters
      bind:filters
      onapplyFilter={handleFiltersChange}
      onremoveFilter={handleRemoveFilter}
      onremoveAllFilters={handleRemoveAllFilters}
      --filters-default-wrapper-width="100%"
      {lang}
      {editFilterMode}
      {showActiveFilters}
      appendSnippet={filterAppendSnippet}
      customChipSnippet={customFilterChipSnippet}
      customSnippet={customFilterSnippet}
    >
    </Filters>
  </div>
  <SimpleTable
    {headers}
    class={clazz.simpleTable}
    {items}
    bind:sortedBy
    bind:sortDirection
    {pointerOnRowHover}
    onsort={handleOnSort}
    {doubleClickActive}
    {doubleClickDelay}
    {lang}
    {onrowClick}
    {onrowDoubleClick}
    {calculateRowStyles}
    {calculateRowClasses}
    {resizableColumns}
    bind:resizedColumnSizeWithPadding
    {customSnippet}
    {rowActionsSnippet}
    {appendSnippet}
    {headerSnippet}
    {headerLabelSnippet}
    {noDataSnippet}
    {oncolumnResize}
  >
  </SimpleTable>

  <div class="footer">
    {#if footerSnippet}
      {@render footerSnippet({ 
        hideRowsPerPage,
        rowsPerPageOptions,
        rowsPerPageSelection,
        totalElements,
        page,
        maxPage,
        rowsPerPage,
        handlePaginationChange
      })}
    {:else}
      {#if !hideRowsPerPage}
        <div class="per-page-dropdown">
          <Dropdown
            placeholder="Per pagina"
            clearable={false}
            mandatory={true}
            items={rowsPerPageOptions}
            bind:values={rowsPerPageSelection}
            --button-default-width="90px"
            onchange={handleRowsPerPageChange}
          ></Dropdown>
        </div>
      {/if}
      {#if totalElements !== undefined}
        {#if rangeDescriptorSnippet}
          {@render rangeDescriptorSnippet({ page, maxPage, rowsPerPage, totalElements })}
        {:else}
          <div class="range-descriptor">
            viewing {((page || 1) - 1) * rowsPerPage} - {(page || 1) * rowsPerPage} of {totalElements}
          </div>
        {/if}
      {/if}
      <Paginator
        bind:page
        {maxPage}
        onchange={handlePaginationChange}
      ></Paginator>
    {/if}
  </div>
</div>

<style>
  .paginated-table {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .range-descriptor {
    font-size: .7rem;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .filter-container {
    margin-top: var(--paginated-table-filter-container-margin-top, 10px);
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 10px;
    width: 100%;
  }

  .search-bar-container {
    padding: var(
      --paginated-table-search-bar-container-padding,
      var(--paginated-table-search-bar-container-default-padding, 0)
    );
  }

  @media only screen and (max-width: 768px) {
    .per-page-dropdown {
      display: none;
    }
  }

</style>