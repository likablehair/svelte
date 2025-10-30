<script lang="ts" generics="Item extends {[key: string]: any}, Data">
  import SimpleTable, {
    type Header,
  } from "$lib/components/simple/lists/SimpleTable.svelte";
  import Paginator from "$lib/components/simple/lists/Paginator.svelte";
  import Dropdown from "$lib/components/composed/forms/Dropdown.svelte";
  import { type ComponentProps, type Snippet } from "svelte";
  import Filters from "../search/Filters.svelte";
  import SearchBar from "../search/SearchBar.svelte";
  import type Builder from "$lib/utils/filters/builder";
  import Converter from "$lib/utils/filters/filters";
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
  import QuickFilters from "../search/QuickFilters.svelte";
  import Checkbox from "$lib/components/simple/forms/Checkbox.svelte";
  import { QuickActions } from "$lib";
  import type { Action } from "../common/QuickActions.svelte";

  interface Props extends Omit<ComponentProps<typeof SimpleTable<Item, Data>>, "class"> {
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
    quickFiltersVisible?: boolean;
    quickFilters?: ComponentProps<typeof QuickFilters>["filters"];
    editFilterMode?: "one-edit" | "multi-edit";
    showActiveFilters?: boolean;
    dateLocale?: 'it' | 'en'
    searchTimeoutDelay?: number
    showSelection?: boolean
    selectionMode?: 'single' | 'multiple'
    hideSelectAll?: boolean
    selectedAll?: boolean
    selectedItems?: ComponentProps<typeof SimpleTable<Item, Data>>['items']
    uniqueKey?: keyof ComponentProps<typeof SimpleTable<Item, Data>>['items'][number]
    hideActions?: boolean
    actionsForSelectedItems?: Action[];
    class?: {
      simpleTable?: ComponentProps<typeof SimpleTable<Item, Data>>["class"];
    };
    onpaginationChange?: (event: {
      detail: {
        rowsPerPage: number;
        page: number;
        builder: Builder;
      };
    }) => void;
    onfiltersChange?: (event: {
      detail: {
        builder: Builder;
      };
    }) => void;
    onremoveFilter?: ComponentProps<typeof Filters>["onremoveFilter"];
    onremoveAllFilters?: ComponentProps<typeof Filters>["onremoveAllFilters"];
    filterAppendSnippet?: ComponentProps<typeof Filters>["appendSnippet"];
    customFilterChipSnippet?: ComponentProps<
      typeof Filters
    >["customChipSnippet"];
    customFilterSnippet?: ComponentProps<typeof Filters>["customSnippet"];
    searchBarSnippet?: Snippet<
      [
        {
          handleSearchChange: typeof handleSearchChange;
        },
      ]
    >;
    footerSnippet?: Snippet<
      [
        {
          hideRowsPerPage: typeof hideRowsPerPage;
          rowsPerPageOptions: typeof rowsPerPageOptions;
          rowsPerPageSelection: typeof rowsPerPageSelection;
          totalElements: typeof totalElements;
          page: typeof page;
          maxPage: typeof maxPage;
          rowsPerPage: typeof rowsPerPage;
          handlePaginationChange: typeof handlePaginationChange;
        },
      ]
    >;
    rangeDescriptorSnippet?: Snippet<
      [
        {
          totalElements: typeof totalElements;
          page: typeof page;
          maxPage: typeof maxPage;
          rowsPerPage: typeof rowsPerPage;
        },
      ]
    >;
    totalsSnippet?: Snippet<[]>
  }

  let {
    headers = [],
    items = [],
    sortedBy = $bindable(undefined),
    sortDirection = $bindable("asc"),
    page = $bindable(1),
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
    quickFilters = $bindable(),
    searchBarColumns = undefined,
    searchBarVisible = true,
    quickFiltersVisible = false,
    lang = "en",
    dateLocale,
    searchBarPlaceholder = lang == 'en' ? "Type to search..." : "Scrivi per cercare...",
    editFilterMode = "one-edit",
    showActiveFilters = true,
    resizableColumns = false,
    resizedColumnSizeWithPadding = {},
    pointerOnRowHover = undefined,
    doubleClickActive = false,
    doubleClickDelay = 250,
    searchTimeoutDelay = 300,
    hideSelectAll,
    showSelection,
    selectedItems = $bindable([]),
    selectionMode = 'multiple',
    selectedAll = $bindable(),
    uniqueKey = 'id',
    hideActions,
    actionsForSelectedItems = [],
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
    totalsSnippet,
    oncolumnResize,
    prependSnippet: prependSnippetInternal,
    ...rest
  }: Props = $props();

  let searchBarInput: HTMLElement | undefined = $state(),
    searchText: string | undefined = $state(),
    sortModify: Header<Data>["sortModify"],
    searchTimeout: NodeJS.Timeout,
    selectedIndexes: number[] = []

  let rowsPerPageSelection: ComponentProps<typeof Dropdown>["values"] = $state(
    [],
  );

  $effect(() => {
    rowsPerPageSelection = [
      { label: rowsPerPage.toString(), value: rowsPerPage },
    ];
  });

  $effect(() => {
    if (totalElements !== undefined)
      maxPage = Math.max(Math.round(totalElements / rowsPerPage), 1);
  });

  function handleRowsPerPageChange(
    event: Parameters<
      NonNullable<ComponentProps<typeof Dropdown>["onchange"]>
    >[0],
  ) {
    rowsPerPage = Number(event.detail.selection?.[0].value);
    handlePaginationChange();
  }

  function handlePaginationChange() {
    let builder = buildFilters();

    if (onpaginationChange) {
      onpaginationChange({
        detail: {
          rowsPerPage,
          page,
          builder,
        },
      });
    }
  }

  function handleSearchChange(searchText: string | undefined) {
    clearTimeout(searchTimeout)

    searchTimeout = setTimeout(() => {
      let builder = buildFilters({ searchText })

      onfiltersChange?.({
        detail: { builder },
      });
    }, searchTimeoutDelay);
  }

  function handleFiltersChange() {
    let builder = buildFilters({ searchText });

    onfiltersChange?.({
      detail: {
        builder,
      },
    });
  }

  function handleRemoveFilter(
    event: Parameters<
      NonNullable<ComponentProps<typeof Filters>["onremoveFilter"]>
    >[0],
  ) {
    handleFiltersChange();

    if (onremoveFilter) {
      onremoveFilter(event);
    }
  }

  function handleRemoveAllFilters() {
    handleFiltersChange();

    if (onremoveAllFilters) {
      onremoveAllFilters();
    }
  }

  function handleOnSort(
    event: Parameters<
      NonNullable<ComponentProps<typeof SimpleTable<Item, Data>>["onsort"]>
    >[0],
  ) {
    sortModify = event.detail.sortModify;
    handleFiltersChange();

    if (onsort) {
      onsort(event);
    }
  }

  function buildFilters(params?: { searchText?: string | undefined }) {
    let converter = new Converter();
    let builder: Builder;
    
    builder = converter.createBuilder({
      filters: [
        ...(filters || []),
        ...(quickFilters || [])
      ],
    });

    if (
      !!params?.searchText &&
      !!searchBarColumns &&
      searchBarColumns.length > 0
    ) {
      builder.where((b) => {
        b.where(searchBarColumns![0], "ilike", "%" + params?.searchText + "%");
        for (let i = 1; i < searchBarColumns!.length; i += 1) {
          b.orWhere(
            searchBarColumns![i],
            "ilike",
            "%" + params?.searchText + "%",
          );
        }
      });
    }

    if (!!sortedBy) {
      if (sortModify) {
        builder = sortModify({
          builder,
          sortDirection: sortDirection || "asc",
        });
      } else {
        builder.orderBy(sortedBy, sortDirection || "asc");
      }
    }

    selectedItems = []
    selectedIndexes = []

    return builder;
  }

  function handleSelectAll() {
    selectedAll = !selectedAll
    selectedItems = []
    selectedIndexes = []
  }

  function handleSelect(item: Item, shiftKeyPressed: boolean) {
    let index = selectedItems.findIndex((i) => i[uniqueKey] == item[uniqueKey]);
    // if item is not in the selectedItems array, add it
    if (index == -1) {
      if (selectionMode == "single") {
        selectedItems = [item];
        selectedIndexes = [items.findIndex(r => r[uniqueKey] == item[uniqueKey])]
      } else if (selectionMode == "multiple") {
        if(shiftKeyPressed && selectedIndexes.length > 0) {
          let lastSelectedIndex = selectedIndexes[selectedIndexes.length - 1],
            selectedIndex = items.findIndex(r => r[uniqueKey] == item[uniqueKey])
          if(selectedIndex != -1) {
            if(selectedIndex < lastSelectedIndex) {
              let x = lastSelectedIndex
              lastSelectedIndex = selectedIndex - 1
              selectedIndex = x
            }
            for (let i = lastSelectedIndex + 1; i <= selectedIndex; i++) {
              if(!selectedItems.find((selectedItem) => selectedItem[uniqueKey] == items[i][uniqueKey])) {
                selectedItems = [...selectedItems, items[i]]
              }
            }
          }
        }
        else {
          selectedItems = [...selectedItems, item];
          selectedIndexes.push(items.findIndex(r => r[uniqueKey] == item[uniqueKey]))
        }
      }
    } else {
      selectedItems = selectedItems.filter((i) => i[uniqueKey] != item[uniqueKey]);
      selectedIndexes = selectedIndexes.filter(r => r != items.findIndex(r => r[uniqueKey] == item[uniqueKey]))
    }
  }
</script>

<div class="paginated-table">
  <MediaQuery>
    {#snippet defaultSnippet({ mAndDown })}

      {#if !hideActions}
        <QuickActions
          selectedItems={selectedAll ? totalElements || items.length : selectedItems.length}
          {actionsForSelectedItems}
          {lang}
          onClose={() => {
            selectedAll = false
            selectedItems = []
          }}
        />
      {/if}

      <div>
        <div class="searchbar-and-filter-container {mAndDown ? 'mobile' : 'desktop'}">
          {#if searchBarVisible}
            {#if searchBarSnippet}
              {@render searchBarSnippet({ handleSearchChange })}
            {:else}
              <SearchBar
                placeholder={searchBarPlaceholder}
                bind:input={searchBarInput}
                bind:value={searchText}
                --search-bar-default-width={mAndDown ? "100%" : "450px"}
                --search-bar-default-height="36px"
                --search-bar-default-border-radius="4px"
                --search-bar-default-ring-color="rgb(var(--global-color-background-300),.6)"
                --search-bar-default-background-color="rgb(var(--global-color-background-300),.4)"
                oninput={() => handleSearchChange(searchText)}
              ></SearchBar>
            {/if}
          {/if}
          <Filters
            bind:filters
            onapplyFilter={handleFiltersChange}
            onremoveFilter={handleRemoveFilter}
            onremoveAllFilters={handleRemoveAllFilters}
            --filters-default-wrapper-width={!!searchBarVisible ? undefined : "100%"}
            {lang}
            {dateLocale}
            {editFilterMode}
            {showActiveFilters}
            appendSnippet={filterAppendSnippet}
            customChipSnippet={customFilterChipSnippet}
            customSnippet={customFilterSnippet}
          ></Filters>
        </div>
        {#if quickFiltersVisible}
          <div class="quick-filters-container">
            <QuickFilters
              bind:filters={quickFilters}
              {lang}
              onapply={handleFiltersChange}
            ></QuickFilters>
          </div>
        {/if}
      </div>
    {/snippet}
  </MediaQuery>

  {@render totalsSnippet?.()}

  <SimpleTable
    {...rest}
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
    prependSnippet={showSelection || prependSnippetInternal ? customPrependSnippet : undefined}
  >
  </SimpleTable>

  {#snippet customPrependSnippet({ index, item, }: Parameters<NonNullable<ComponentProps<typeof SimpleTable<Item, Data>>['prependSnippet']>>[0])}
    {#if showSelection}
      {#if index == -1}
        {#if selectionMode == 'multiple' && !hideSelectAll}
          <div
            style:display=flex
            style:align-items=middle
            style:padding="8px 0px"
          >
            <Checkbox
              id="select-all"
              value={selectedAll}
              onchange={handleSelectAll}
            />
          </div>
        {/if}
      {:else if item}
        <div
          style:padding-left=8px
        >
          <Checkbox
            id={item[uniqueKey]}
            value={
              selectedAll 
              || selectedItems.findIndex(
                (i) => i[uniqueKey] == item[uniqueKey]
              ) != -1
            }
            disabled={selectedAll}
            onclick={e => e.stopPropagation()}
            onchange={(e) => handleSelect(item, e.detail.shiftKeyPressed)}
          />
        </div>
      {/if}
    {/if}
    {@render prependSnippetInternal?.({ index, item, })} 
  {/snippet}

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
        handlePaginationChange,
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
          {@render rangeDescriptorSnippet({
            page,
            maxPage,
            rowsPerPage,
            totalElements,
          })}
        {:else}
          <div class="range-descriptor">
            viewing {((page || 1) - 1) * rowsPerPage} - {(page || 1) *
              rowsPerPage} of {totalElements}
          </div>
        {/if}
      {/if}
      <Paginator bind:page {maxPage} onchange={handlePaginationChange}
      ></Paginator>
    {/if}
  </div>
</div>

<style>
  .paginated-table {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .range-descriptor {
    font-size: 0.7rem;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .searchbar-and-filter-container {
    display: flex;
    gap: 12px;
  }

  .searchbar-and-filter-container.desktop {
    flex-direction: row;
  }

  .searchbar-and-filter-container.mobile {
    flex-direction: column;
  }

  .quick-filters-container {
    margin-top: 12px
  }

  @media only screen and (max-width: 768px) {
    .per-page-dropdown {
      display: none;
    }
  }
</style>
