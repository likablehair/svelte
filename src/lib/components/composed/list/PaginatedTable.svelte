<script lang="ts" context="module">
  import SimpleTable from "$lib/components/simple/lists/SimpleTable.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import Paginator from "$lib/components/composed/list/Paginator.svelte";
  import Dropdown from "$lib/components/composed/forms/Dropdown.svelte";
  import { createEventDispatcher, type ComponentProps } from "svelte";

  type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

  export type Header = ArrayElement<NonNullable<ComponentProps<SimpleTable>['headers']>>;
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
    lang: 'it' | 'en' = 'en'

  let searchBarInput: HTMLElement,
    searchText: string | undefined = undefined

  let dispatch = createEventDispatcher<{
    paginationChange: {
      rowsPerPage: number,
      page: number
    },
    filtersChange: {
      builder: Builder
    }
  }>()

  let rowsPerPageSelection: ComponentProps<Dropdown>['values'] = []

  $: rowsPerPageSelection = [
    { label: rowsPerPage.toString(), value: rowsPerPage }
  ]

  $: if(totalElements !== undefined) maxPage = Math.max(Math.round(totalElements/rowsPerPage), 1)

  function handleRowsPerPageChange(e: CustomEvent<{ selection: ComponentProps<Dropdown>['items']}>) {
    rowsPerPage = Number(e.detail.selection?.[0].value)
    handlePaginationChange()
  }

  function handlePaginationChange() {
    dispatch('paginationChange', {
      rowsPerPage, page
    })
  }

  function handleSearchChange(searchText: string | undefined) {
    let converter = new Converter()
    let builder: Builder
    builder = converter.createBuilder({
      filters: filters || []
    })

    if(!!searchText && !!searchBarColumns && searchBarColumns.length > 0) {
      builder.where(b => {
        b.where(searchBarColumns![0], 'like', searchText)
        for(let i = 1; i < searchBarColumns!.length; i += 1) {
          b.orWhere(searchBarColumns![i], 'like', searchText)
        }
      })
    }

    dispatch('filtersChange', {
      builder
    })
  }

  $: handleSearchChange(searchText)

  function handleFiltersChange() {
    handleSearchChange(searchText)
  }


</script>

<div class="paginated-table">
  {#if searchBarVisible}
    <slot name="search-bar" {handleSearchChange}>
      <SearchBar
        placeholder="Type something to search..."
        bind:input={searchBarInput}
        bind:value={searchText}
      >
      </SearchBar>
    </slot>
  {/if}
  <div class="filter-container">
    <Filters
      bind:filters
      on:applyFilter={handleFiltersChange}
      on:removeFilter={handleFiltersChange}
      --filters-default-wrapper-width="100%"
      {lang}
    > 
      <svelte:fragment slot="append">
        <slot name="filter-append"></slot>
      </svelte:fragment>
    </Filters>
  </div>
  <SimpleTable
    bind:headers
    bind:class={clazz.simpleTable}
    bind:items
    bind:sortedBy
    bind:sortDirection
    on:sort
    on:rowClick
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
    gap: 24px;
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
    margin-top: 10px;
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 10px;
    width: 100%;
  }

  @media only screen and (max-width: 768px) {
    .per-page-dropdown {
      display: none;
    }
  }

</style>