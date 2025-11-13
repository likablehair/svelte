<script lang="ts" context="module">
  import SimpleTable, { type CalculateRowClasses, type CalculateRowStyles } from "$lib/components/simple/lists/SimpleTable.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import Paginator from "$lib/components/simple/lists/Paginator.svelte";
  import Dropdown from "$lib/components/composed/forms/Dropdown.svelte";
  import { createEventDispatcher, type ComponentEvents, type ComponentProps } from "svelte";

  type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

  export type Header = ArrayElement<
    NonNullable<ComponentProps<SimpleTable>["headers"]>
  >;
</script>

<script lang="ts">
  import Filters from "../search/Filters.svelte";
  import SearchBar from "../search/SearchBar.svelte";
  import type Builder from "$lib/utils/filters/builder";
  import Converter from "$lib/utils/filters/filters";

  let clazz: {
    simpleTable?: ComponentProps<SimpleTable>['class']
  } = {};
  export { clazz as class };

  export let headers: ComponentProps<SimpleTable>['headers'] = [],
    items: ComponentProps<SimpleTable>['items'] = [],
    sortedBy: ComponentProps<SimpleTable>['sortedBy'] = undefined,
    sortDirection: ComponentProps<SimpleTable>['sortDirection'] = undefined,
    page: NonNullable<ComponentProps<Paginator>['page']> = 1,
    maxPage: ComponentProps<Paginator>['maxPage'] = undefined,
    rowsPerPageOptions: ComponentProps<Dropdown>['items'] = [
      { label: '20', value: 20 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
    ],
    hideRowsPerPage: boolean = false,
    totalElements: number | undefined = undefined,
    rowsPerPage: number = 20,
    filters:  ComponentProps<Filters>['filters'] = [],
    searchBarColumns: string[] | undefined = undefined,
    searchBarVisible: boolean = true,
    searchBarPlaceholder: string = "Type something to search...",
    lang: 'it' | 'en' = 'en',
    dateLocale: 'it' | 'en' | undefined = undefined,
    editFilterMode: 'one-edit' | 'multi-edit' = 'one-edit',
    showActiveFilters: boolean = true,
    resizableColumns: boolean = false,
    resizedColumnSizeWithPadding: { [value: string]: number } = {},
    pointerOnRowHover: boolean | undefined = undefined,
    doubleClickActive: ComponentProps<SimpleTable>['doubleClickActive'] = false,
    doubleClickDelay: ComponentProps<SimpleTable>['doubleClickDelay'] = 250,
    searchTimeoutDelay: number = 300;


  export let calculateRowStyles: CalculateRowStyles | undefined = undefined;
  export let calculateRowClasses: CalculateRowClasses | undefined = undefined;

  let searchBarInput: HTMLElement,
    searchText: string | undefined = undefined,
    sortModify: Header['sortModify'],
    searchTimeout: NodeJS.Timeout

  let dispatch = createEventDispatcher<{
    paginationChange: {
      rowsPerPage: number,
      page: number,
      builder: Builder
    },
    filtersChange: {
      builder: Builder
    }
  }>()

  let rowsPerPageSelection: ComponentProps<Dropdown>['values'] = []

  $: rowsPerPageSelection = [
    { label: rowsPerPage.toString(), value: rowsPerPage }
  ]

  $: if(totalElements !== undefined) maxPage = Math.max(Math.ceil(totalElements/rowsPerPage), 1)

  function handleRowsPerPageChange(e: CustomEvent<{ selection: ComponentProps<Dropdown>['items']}>) {
    rowsPerPage = Number(e.detail.selection?.[0].value)
    handlePaginationChange()
  }

  function handlePaginationChange() {
    let builder = buildFilters()

    dispatch('paginationChange', {
      rowsPerPage, page, builder
    })
  }

  function handleSearchChange(searchText: string | undefined) {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      let builder = buildFilters({searchText})
  
      dispatch('filtersChange', {
        builder
      })
    }, searchTimeoutDelay);
  }

  function handleSort(e: ComponentEvents<SimpleTable>['sort']) {
    sortModify = e.detail.sortModify
    handleFiltersChange()
  }

  function handleFiltersChange() {
    let builder = buildFilters({searchText})

    dispatch('filtersChange', {
      builder
    })
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
    <slot name="search-bar" {handleSearchChange}>
      <div class="search-bar-container">
        <SearchBar
          placeholder={searchBarPlaceholder}
          bind:input={searchBarInput}
          bind:value={searchText}
          on:input={() => handleSearchChange(searchText)}
        >
        </SearchBar>
      </div>
    </slot>
  {/if}
  <div class="filter-container">
    <Filters
      bind:filters
      on:applyFilter={handleFiltersChange}
      on:removeFilter={handleFiltersChange}
      on:removeAllFilters={handleFiltersChange}
      on:removeFilter
      on:removeAllFilters
      --filters-default-wrapper-width="100%"
      {lang}
      {dateLocale}
      {editFilterMode}
      {showActiveFilters}
    >
      <svelte:fragment slot="append">
        <slot name="filter-append"></slot>
      </svelte:fragment>
      <svelte:fragment slot="custom-chip" let:filter>
        <slot name="custom-filter-chip" {filter}></slot>
      </svelte:fragment>
      <svelte:fragment slot="custom" let:filter let:updateFunction let:mAndDown>
        <slot name="custom-filter" {filter} {updateFunction} {mAndDown}></slot>
      </svelte:fragment>
    </Filters>
  </div>

  <slot name="totals"></slot>

  <SimpleTable
    bind:headers
    bind:class={clazz.simpleTable}
    bind:items
    bind:sortedBy
    bind:sortDirection
    bind:pointerOnRowHover
    {doubleClickActive}
    {doubleClickDelay}
    on:sort={handleSort}
    on:sort
    on:rowClick
    on:rowDoubleClick
    {calculateRowStyles}
    {calculateRowClasses}
    {resizableColumns}
    bind:resizedColumnSizeWithPadding
  >
    <svelte:fragment slot="header" let:head>
      <slot name="header" {head} >
        <span class="header-label">
          <slot name="headerLabel">
            {head.label}
          </slot>
        </span>
        {#if head.sortable}
          <span
            class="header-sort-icon"
            class:active={sortedBy == head.value}
            class:asc={sortDirection == 'asc'}
            class:desc={sortDirection == 'desc'}
          >
            {#if sortDirection == 'asc'}
              <Icon name="mdi-arrow-up"></Icon>
            {:else}
              <Icon name="mdi-arrow-down"></Icon>
            {/if}
          </span>
        {/if}
      </slot>
    </svelte:fragment>
    <svelte:fragment
      slot="custom"
      let:columnIndex
      let:index
      let:header
      let:item
    >
      <slot name="custom" {index} {columnIndex} {header} {item}/>
    </svelte:fragment>
    <svelte:fragment slot="rowActions" let:index let:item>
      <slot name="rowActions" {index} {item} />
    </svelte:fragment>
    <svelte:fragment slot="append" let:index let:item>
      <slot name="append" {index} {item} />
    </svelte:fragment>
  </SimpleTable>

  <div class="footer">
    <slot
      name="footer"
      {hideRowsPerPage}
      {rowsPerPageOptions}
      {rowsPerPageSelection}
      {totalElements}
      {page}
      {maxPage}
      {rowsPerPage}
      {handlePaginationChange}
    >
      {#if !hideRowsPerPage}
        <div class="per-page-dropdown">
          <Dropdown
            placeholder="Per pagina"
            clearable={false}
            mandatory={true}
            bind:items={rowsPerPageOptions}
            bind:values={rowsPerPageSelection}
            --button-default-width="90px"
            on:change={handleRowsPerPageChange}
          ></Dropdown>
        </div>
      {/if}
      {#if totalElements !== undefined}
        <slot name="rangeDescriptor" {page} {maxPage} {rowsPerPage} {totalElements}>
          <div class="range-descriptor">
            viewing {((page || 1) - 1) * rowsPerPage} - {(page || 1) * rowsPerPage} of {totalElements}
          </div>
        </slot>
      {/if}
      <Paginator
        bind:page
        bind:maxPage
        on:change={handlePaginationChange}
      ></Paginator>
    </slot>
  </div>
</div>

<style>
  .paginated-table {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .header-sort-icon {
    display: none;
  }

  .header-sort-icon.active {
    display: inline;
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