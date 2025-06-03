<script lang="ts" context="module">
  import SimpleTable, { type CalculateRowClasses, type CalculateRowStyles } from "$lib/components/simple/lists/SimpleTable.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import Paginator from "$lib/components/simple/lists/Paginator.svelte";
  import Dropdown from "$lib/components/composed/forms/Dropdown.svelte";
  import { createEventDispatcher, type ComponentEvents, type ComponentProps } from "svelte";
  import './PaginatedTable.css'

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
  import CircularLoader from "$lib/components/simple/loaders/CircularLoader.svelte";
  import type { QuickFilter } from "$lib/utils/filters/quickFilters";
  import { DateTime } from "luxon";
  import { FilterBuilder } from "$lib";
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import LabelAndTextField from "../forms/LabelAndTextField.svelte";
  import Autocomplete from "$lib/components/simple/forms/Autocomplete.svelte";
  import Chip from "$lib/components/simple/navigation/Chip.svelte";
  import FlagIcon from "$lib/components/simple/media/FlagIcon.svelte";
  import CountriesAutocomplete from "../forms/CountriesAutocomplete.svelte";
  import DatePickerTextField from "../forms/DatePickerTextField.svelte";
  import ConfirmOrCancelButtons from "../forms/ConfirmOrCancelButtons.svelte";
  import Divider from "$lib/components/simple/common/Divider.svelte";

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
    editFilterMode: 'one-edit' | 'multi-edit' = 'one-edit',
    showActiveFilters: boolean = true,
    resizableColumns: boolean = false,
    resizedColumnSizeWithPadding: { [value: string]: number } = {},
    pointerOnRowHover: boolean | undefined = undefined,
    doubleClickActive: ComponentProps<SimpleTable>['doubleClickActive'] = false,
    doubleClickDelay: ComponentProps<SimpleTable>['doubleClickDelay'] = 250,
    quickFilters: QuickFilter[] = [],
    customResultsText: string | undefined = undefined;

  export let calculateRowStyles: CalculateRowStyles | undefined = undefined;
  export let calculateRowClasses: CalculateRowClasses | undefined = undefined;

  let searchBarInput: HTMLElement,
    searchText: string | undefined = undefined,
    sortModify: Header['sortModify'],
    menuElementQuickFilters: HTMLElement,
    saveEditDisabled: boolean = false,
    calendarOpened: boolean = false,
    calendarOpened2: boolean = false,
    loading: boolean = false ,
    quickFilterActive: QuickFilter,
    openQuickFilter: boolean = false,
    quickFiltersVisible: boolean = true,
    quickFilterActivator: HTMLElement | undefined = undefined,
    globalBuilder: FilterBuilder = new FilterBuilder();



  let dispatch = createEventDispatcher<{
    paginationChange: {
      rowsPerPage: number,
      page: number,
      builder: Builder
    },
    filtersChange: {
      builder: Builder
    },
    removeCustomQuickFilter: {
      quickFilter: QuickFilter
    },
    applyCustomQuickFilter: { 
      quickFilter: QuickFilter
      setQuickFilterValue: (quickFilter: QuickFilter, value?: any) => void
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
    let builder = buildFilters()

    dispatch('paginationChange', {
      rowsPerPage, page, builder
    })
  }

  function handleSearchChange(searchText: string | undefined) {
    let builder = buildFilters({searchText})

    dispatch('filtersChange', {
      builder
    })
  }

  $: handleSearchChange(searchText)

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

  function handleCancelClick() {
    quickFilterActivator = undefined;
    openQuickFilter = false;
  }

  function handleQuickFilterClick(
    mouseEvent: MouseEvent & {
      currentTarget: EventTarget & HTMLButtonElement;
    },
    quickFilter?: QuickFilter
  ) {
    handleCancelClick();
    setTimeout(() => {
      if (quickFilter) {
        if (!quickFilterActivator) {
          let target = mouseEvent.target as unknown as HTMLElement;
          quickFilterActivator = target;
          quickFilterActive = quickFilter;
          openQuickFilter = !openQuickFilter;
        }
      }
    }, 300);
  }

  function setQuickFilterMissingValue(quickFilter: QuickFilter) {
    if (quickFilter.type.key == 'custom') {
      quickFilter.type.missingValue = true;
      quickFilter.type.value = undefined;
    }
    else if (quickFilter.type.key == "multi-select") {
      quickFilter.type.missingValue = true;
      quickFilter.type.values = [];
    } else if (quickFilter.type.key == "string") {
      quickFilter.type.missingValue = true;
      quickFilter.type.value = undefined;
    } else if (quickFilter.type.key == "country") {
      quickFilter.type.missingValue = true;
      quickFilter.type.selected = undefined;
    } else if (quickFilter.type.key == "number") {
      quickFilter.type.missingValue = true;
      quickFilter.type.value = undefined;
    }

    handleApplyClick(quickFilter);
  }

  function setQuickFilterValue(quickFilter: QuickFilter, value?: any) {
    if (quickFilter.type.key == "custom") {
      quickFilter.type.value = value;
    } 
    else if (quickFilter.type.key == "boolean") {
      quickFilter.type.value = value;
    } 

    handleApplyClick(quickFilter);
  }

  function handleApplyClick(quickFilter: QuickFilter, dispatchCustomFilterClick: boolean = false) {
    if(quickFilter.type.key == 'custom' && dispatchCustomFilterClick) {
      dispatch('applyCustomQuickFilter', { quickFilter, setQuickFilterValue})
    }
    else {
      quickFilter.active = true;
      quickFilters = quickFilters;
      globalBuilder = quickFilterBuilder(globalBuilder, quickFilter);
  
      handleFiltersChange();
  
      quickFilterActivator = undefined;
      openQuickFilter = false;
    }
  }

  function quickFilterBuilder(
    builder: FilterBuilder,
    quickFilter: QuickFilter,
    clearPreaviousValue: boolean = true
  ) {
    if (quickFilter.type.key == 'custom') {
      let value = quickFilter.type.value,
        missingValue = quickFilter.type.missingValue;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.value = value;
      quickFilter.type.missingValue = missingValue;

      builder = quickFilter.type.modify({
        builder,
        value: { value, missingValue },
      });
    }
    else if (quickFilter.type.key == "string") {
      let value = quickFilter.type.value,
        missingValue = quickFilter.type.missingValue;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.value = value;
      quickFilter.type.missingValue = missingValue;

      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value: { value, missingValue },
        });
      }

      if (!!quickFilter.column) {
        if (missingValue) {
          builder.whereNull(quickFilter.column);
        } else if (!!value) {
          builder.where(
            quickFilter.column,
            quickFilter.type.mode ?? "equal",
            value
          );
        }
      }
    } else if (quickFilter.type.key == "boolean") {
      let value = quickFilter.type.value;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.value = value;

      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value,
        });
      }

      if (!!quickFilter.column && value != undefined) {
        builder.where(quickFilter.column, value);
      }
    } else if (quickFilter.type.key == "country") {
      let value = quickFilter.type.selected,
        missingValue = quickFilter.type.missingValue;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.selected = value;
      quickFilter.type.missingValue = missingValue;

      const values = value?.map((item) => item.value);
      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value: { values, missingValue },
        });
      }

      if (!!quickFilter.column) {
        if (missingValue) {
          builder.whereNull(quickFilter.column);
        } else if (!!values && values.length > 0) {
          builder.whereIn(quickFilter.column, values);
        }
      }
    } else if (quickFilter.type.key == "date") {
      let from = quickFilter.type.from,
        to = quickFilter.type.to;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.from = from;
      quickFilter.type.to = to;

      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value: { from, to },
        });
      } else if (!!quickFilter.column) {
        if (!!from) {
          builder.where(
            quickFilter.column,
            ">=",
            DateTime.fromJSDate(from).setLocale('it-IT').startOf('day').toString()
          );
        }
        if (!!to) {
          builder.where(
            quickFilter.column,
            "<=",
            DateTime.fromJSDate(to).setLocale('it-IT').endOf('day').toString()          );
        }
      }
    } else if (quickFilter.type.key == "multi-select") {
      let value = quickFilter.type.values,
        missingValue = quickFilter.type.missingValue;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.values = value;
      quickFilter.type.missingValue = missingValue;

      const values = value.map(item => item.value);

      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value: { values: values, missingValue },
        });
      } else if (quickFilter.column) {
        if (missingValue) {
          builder.whereNull(quickFilter.column);
        } else if (values.length > 0) {
          builder.whereIn(quickFilter.column, values);
        }
      }
    } else if (quickFilter.type.key == "number") {
      let value = quickFilter.type.value,
        missingValue = quickFilter.type.missingValue;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.value = value;
      quickFilter.type.missingValue = missingValue;

      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value: { value, missingValue },
        });
      }

      if (quickFilter.column) {
        if (missingValue) {
          builder.whereNull(quickFilter.column);
        } else if (!!value) {
          builder.where(quickFilter.column, value);
        }
      }
    }

    return builder;
  }

  
  function handleClearQuickFilter(
    quickFilter: QuickFilter,
    dispatchFiltersChange: boolean = true
  ) {
    if (quickFilter.type.key == 'custom') {
      quickFilter.type.value = undefined;
      quickFilter.type.missingValue = undefined;
      if(dispatchFiltersChange) {
        dispatch('removeCustomQuickFilter', { quickFilter })
      }
    }
    else if (quickFilter.type.key == "string") {
      quickFilter.type.value = undefined;
      quickFilter.type.missingValue = undefined;
    } else if (quickFilter.type.key == "number") {
      quickFilter.type.value = undefined;
      quickFilter.type.missingValue = undefined;
    } else if (quickFilter.type.key == "boolean") {
      quickFilter.type.value = undefined;
    } else if (quickFilter.type.key == "country") {
      quickFilter.type.selected = undefined;
      quickFilter.type.missingValue = undefined;
    } else if (quickFilter.type.key == "date") {
      quickFilter.type.from = undefined;
      quickFilter.type.to = undefined;
    } else if (quickFilter.type.key == "multi-select") {
      quickFilter.type.values = [];
      quickFilter.type.missingValue = false;
      quickFilter.type.missingValue = undefined;
    }

    if (dispatchFiltersChange) {
      quickFilter.active = false;
    }

    globalBuilder = searchTextBuilder(searchText);

    for (let i = 0; i < quickFilters.length; i++) {
      if (quickFilters[i].active) {
        globalBuilder = quickFilterBuilder(
          globalBuilder,
          quickFilters[i],
          false
        );
      }
    }

    if (dispatchFiltersChange) {
      quickFilters = quickFilters;
      handleFiltersChange();
    }

    return globalBuilder;
  }

  function searchTextBuilder(searchText?: string) {
    let builder: FilterBuilder;

    let converter = new Converter();
    builder = converter.createBuilder({
      filters: filters || [],
    });

    if (!!searchText && !!searchBarColumns && searchBarColumns.length > 0) {
      builder.where((b) => {
        b.where(searchBarColumns![0], "ilike", "%" + searchText + "%");
        for (let i = 1; i < searchBarColumns!.length; i += 1) {
          b.orWhere(searchBarColumns![i], "ilike", "%" + searchText + "%");
        }
      });
    }

    return builder;
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
  <div class="quick-filters-results-container">
    <div class="quick-filters">
      {#if !!quickFilters && quickFilters.length > 0 && quickFiltersVisible}
        {#each quickFilters as quickFilter}
          <div
            class={quickFilter.active ? "active-quick-filters" : "non-active-quick-filters"}
          >
            <button
              on:click={(e) => {
                handleQuickFilterClick(e, quickFilter);
              }}
            >
              <div class="quick-filter-icon">
                <Icon name={quickFilter.icon} --icon-size="20px" />
                {quickFilter.title}
              </div>
            </button>
            {#if quickFilter.active}
              <div style:padding-top="1px" style:padding-right="3px">
                <Icon
                  name="mdi-close-circle"
                  click
                  --icon-size="14px"
                  on:click={() => {
                    handleClearQuickFilter(quickFilter);
                  }}
                />
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
    {#if totalElements}
      <div class='results-number'>
         {#if customResultsText}
          {customResultsText}
        {:else}
          {lang == 'en' ? 'Results: ' : 'Risultati: '}
        {/if}
        {#if !loading && !!items}
          {totalElements || items.length}
        {:else}
          <CircularLoader
            {loading}
            --circular-loader-height='10px'
          ></CircularLoader>
        {/if}
      </div>
      {/if}
  </div>
  
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


<Menu
  bind:open={openQuickFilter}
  activator={quickFilterActivator}
  bind:menuElement={menuElementQuickFilters}
  anchor="bottom"
  openingId="quick-filter"
  closeOnClickOutside
>
  <div
    class="quick-filter-container"
  >
    <div style:grid-column="1 / 3">
      {#if quickFilterActive.type.key == 'custom'}
        <slot name="custom-quick-filter" quickFilter={quickFilterActive} {setQuickFilterMissingValue}>
        </slot>
      {:else if quickFilterActive.type.key === "string"}
        <div class="space-between" style="font-weight: 500;">
          {quickFilterActive.title}
          {#if !!quickFilterActive.type.missingLabel}
            <button
              on:click={() =>
                setQuickFilterMissingValue(quickFilterActive)}
              >{quickFilterActive.type.missingLabel}</button
            >
          {/if}
        </div>
        <LabelAndTextField
          description={quickFilterActive.description}
          name={quickFilterActive.title}
          info={quickFilterActive.info}
          type="text"
          bind:value={quickFilterActive.type.value}          
          --simple-textfield-border-radius= 0.5rem
          --simple-textfield-background-color= transparent
          --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
          --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
        />
      {:else if quickFilterActive.type.key === "number"}
        <div class="space-between" style="font-weight: 500; margin-bottom: 8px;">
          {quickFilterActive.title}
          {#if !!quickFilterActive.type.missingLabel}
            <button
              on:click={() =>
                setQuickFilterMissingValue(quickFilterActive)}
              >{quickFilterActive.type.missingLabel}</button
            >
          {/if}
        </div>
        <LabelAndTextField
          description={quickFilterActive.description}
          name={quickFilterActive.title}
          info={quickFilterActive.info}
          type="number"
          error={saveEditDisabled}
          bind:value={quickFilterActive.type.value}          
          --simple-textfield-border-radius= 0.5rem
          --simple-textfield-background-color= transparent
          --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
          --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
        />
      {:else if quickFilterActive.type.key === "multi-select"}
        <div class="space-between" style="font-weight: 500; margin-bottom: 8px;">
          {quickFilterActive.title}
          {#if !!quickFilterActive.type.missingLabel}
            <button
              on:click={() =>
                setQuickFilterMissingValue(quickFilterActive)}
              >{quickFilterActive.type.missingLabel}</button
            >
          {/if}
        </div>
        <div on:click|stopPropagation role="presentation" tabindex="-1">
          <Autocomplete
            multiple
            items={quickFilterActive.type.items}
            bind:values={quickFilterActive.type.values}
            --autocomplete-border-radius= 0.5rem
            --autocomplete-border="1px solid rgb(var(--global-color-background-500))"
            --autocomplete-focus-box-shadow="0 0 0 2px rgb(var(--global-color-primary-500))"
          >
            <svelte:fragment slot="selection" let:selection let:unselect>
              <slot name="selection" {selection} {unselect}>
                <div tabindex="-1">
                  <Chip
                    close={true}
                    on:close={() => unselect(selection)}
                    --chip-default-border-radius="var(--autocomplete-border-radius, var(--autocomplete-default-border-radius))"
                    buttonTabIndex={-1}
                    truncateText
                  >
                    <slot name="chip-label" {selection}>
                      {#if !!quickFilterActive.type.countriesAlpha2 && quickFilterActive.type.countriesAlpha2.find((c) => c.value == selection.value)}
                        <div>
                          <FlagIcon
                            alpha2={quickFilterActive.type.countriesAlpha2
                              .find((c) => c.value == selection.value)
                              ?.label?.toString()
                              .toLowerCase() ?? ""}
                            --flag-icon-size="16px"
                          />
                        </div>
                      {/if}
                      {selection.label}
                    </slot>
                  </Chip>
                </div>
              </slot>
            </svelte:fragment>
            <svelte:fragment slot="item-label" let:item>
              <slot name="item-label" {item}>
                {#if !!quickFilterActive.type.countriesAlpha2 && quickFilterActive.type.countriesAlpha2.find((c) => c.value == item.value)}
                  <FlagIcon
                    alpha2={quickFilterActive.type.countriesAlpha2
                      .find((c) => c.value == item.value)
                      ?.label?.toString()
                      .toLowerCase() ?? ""}
                  />
                {/if}
                {item.label}
              </slot>
            </svelte:fragment>
          </Autocomplete>
        </div>
      {:else if quickFilterActive.type.key === "boolean"}
        {#if quickFilterActive.type.params}
          <div class="vertical-quick-filters">
            <button
              on:click={() => setQuickFilterValue(quickFilterActive, true)}
            >
              {quickFilterActive.type.params.labelTrue}
            </button>
            <button
              on:click={() => setQuickFilterValue(quickFilterActive, false)}
            >
              {quickFilterActive.type.params.labelFalse}
            </button>
            <button
              on:click={() => setQuickFilterValue(quickFilterActive, undefined)}
            >
              {lang == 'en' ? 'All' : 'Tutti'}
            </button>
          </div>
        {/if}
      {:else if quickFilterActive.type.key === "country"}
        <div class="space-between" style="font-weight: 500; margin-bottom: 8px;">
          {quickFilterActive.title}
          {#if !!quickFilterActive.type.missingLabel}
            <button
              on:click={() =>
                setQuickFilterMissingValue(quickFilterActive)}
              >{quickFilterActive.type.missingLabel}</button
            >
          {/if}
        </div>
        <div on:click|stopPropagation role="presentation" tabindex="-1">
          <CountriesAutocomplete
            bind:selected={quickFilterActive.type.selected}
            {...((!!quickFilterActive.type.countriesOptions && quickFilterActive.type.countriesOptions.length > 0) && {
              items: quickFilterActive.type.countriesOptions,
            })}
            autocompleteProps={{
              placeholder: !!quickFilterActive.type.selected
                ? quickFilterActive.type.selected.length > 0
                  ? ""
                  : quickFilterActive.description
                : quickFilterActive.description,
              multiple: true,
            }}
            --autocomplete-border-radius= 0.5rem
            --autocomplete-border="1px solid rgb(var(--global-color-background-500))"
            --autocomplete-focus-box-shadow="0 0 0 2px rgb(var(--global-color-primary-500))"
          />
        </div>
      {:else if quickFilterActive.type.key === "date"}
        <div on:click|stopPropagation role="presentation" tabindex="-1">
          <div>
            <DatePickerTextField
              bind:selectedDate={quickFilterActive.type.from}
              placeholder={lang == 'en' ? "From" : 'Da'}
              --simple-textfield-width="100%"
              --simple-textfield-border-radius= 0.5rem
              --simple-textfield-background-color= transparent
              --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
              --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
              flipOnOverflow
              bind:menuOpened={calendarOpened}
              on:day-click={() => (calendarOpened = false)}
            >
              <svelte:fragment slot="append-inner">
                <Icon
                  name="mdi-close-circle"
                  click
                  on:click={() => {
                    if (
                      !!quickFilterActive &&
                      quickFilterActive.type.key === "date"
                    ) {
                      quickFilterActive.type.from = undefined;
                    }
                  }}
                />
              </svelte:fragment>
            </DatePickerTextField>
          </div>
          <div>
            <DatePickerTextField
              bind:selectedDate={quickFilterActive.type.to}
              placeholder={lang == 'en' ? "To" : 'A'}
              --simple-textfield-width="100%"
              --simple-textfield-border-radius= 0.5rem
              --simple-textfield-background-color= transparent
              --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
              --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
              flipOnOverflow
              bind:menuOpened={calendarOpened2}
              on:day-click={() => (calendarOpened2 = false)}
            >
              <svelte:fragment slot="append-inner">
                <Icon
                  name="mdi-close-circle"
                  click
                  on:click={() => {
                    if (
                      !!quickFilterActive &&
                      quickFilterActive.type.key === "date"
                    ) {
                      quickFilterActive.type.to = undefined;
                    }
                  }}
                />
              </svelte:fragment>
            </DatePickerTextField>
          </div>
        </div>
      {/if}
    </div>

    {#if quickFilterActive.type.key != "boolean"}
      <div style:margin-top="10px" style:grid-row="2" style:grid-column="1 / 3">
        <Divider --divider-color=rgb(var(--global-color-contrast-100)) />
      </div>
      <div style:grid-row="3" style:grid-column="2" style:margin-top="-15px">
        <ConfirmOrCancelButtons
          confirmDisable={saveEditDisabled}
          confirmText={lang == 'en' ? "Apply" : 'Applica'}
          cancelText={lang == 'en' ? "Cancel" : 'Annulla'}
          on:cancel-click={handleCancelClick}
          on:confirm-click={() => handleApplyClick(quickFilterActive, quickFilterActive.type.key == 'custom')}
        />
      </div>
    {/if}
  </div>
</Menu>

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

  .quick-filter-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    justify-content: center;
    align-items: center;
    box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.2);
    position: fixed;
    padding: 10px;
    border-radius: 10px;
    background-color: var(
      --paginated-table-quick-filter-background-color,
      var(--paginated-table-default-quick-filter-background-color)
    );
  }

  .quick-filters {
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
  }

  .quick-filters-results-container {
    display: flex;
    justify-content: space-between;
  }

  .vertical-quick-filters {
    display: flex;
    flex-direction: column;
    align-items: start;
    width: 130px;
  }

  
  .active-quick-filters {
    display: flex;
    margin-right: 15px;
    background-color: rgb(var(--global-color-primary-500));
    border-radius: 5px;
    width: fit-content;
  }

  .non-active-quick-filters {
    display: flex;
    margin-right: 16px;
  }

  .quick-filter-icon {
    display: flex;
    gap: 4px;
    margin: 0 8px;
  }

  .space-between {
    display: flex;
    justify-content: space-between;
  }

  @media only screen and (max-width: 768px) {
    .per-page-dropdown {
      display: none;
    }
  }

   .results-number {
    margin: 0px 0px 4px 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

</style>