<script lang="ts" context="module">
  export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
</script>

<script lang="ts">
  import './Filters.css'
  import '../../../css/main.css'
  import Drawer from '$lib/components/simple/navigation/Drawer.svelte';
  import Menu from '$lib/components/simple/common/Menu.svelte';
  import MediaQuery from '$lib/components/simple/common/MediaQuery.svelte';
  import Button from '$lib/components/simple/buttons/Button.svelte';
  import Icon from '$lib/components/simple/media/Icon.svelte';
  import { createEventDispatcher, type ComponentProps } from 'svelte';
  import type { DateMode, Filter, StringMode } from '$lib/utils/filters/filters';
  import SelectableVerticalList from '$lib/components/simple/lists/SelectableVerticalList.svelte';
  import Chip from '$lib/components/simple/navigation/Chip.svelte';
  import Converter, { DateModes, StringModes } from '$lib/utils/filters/filters';
  import type { Locale } from '$lib/components/simple/dates/utils';
  import Validator from '$lib/utils/filters/validator';
  import FilterEditor from './FilterEditor.svelte';

  export let
    addFilterLabel: string = "Filters",
    filters: Filter[] = [],
    cancelFilterLabel : string = "Cancel",
    applyFilterLabel : string = "Apply Filter",
    showActiveFilters: boolean = true,
    filterTitleLabel: string = "Filtra per ",
    dateLocale: Locale = 'it',
    betweenSeparator: string = "e"

  let calendarOpened: boolean = false,
    calendarOpened2: boolean = false,
    selectOpened: boolean = false

  let dispatch = createEventDispatcher<{
    'addFilterClick': undefined,
    'selectFilterClick': undefined,
    'removeFilterClick': {
      filter: Filter
    }
  }>()

  let open: boolean = false,
    activator: HTMLElement

  function handleAddFilterClick() {
    dispatch('addFilterClick')
    open = true
  }

  $: filterOptions = filters.map((f) => {
    return {
      title: f.label,
      name: f.name,
    }
  })


  let selected: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  let focused: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  $: if(!!focused && !open) focused = undefined


  let filterOptionsListActivator: HTMLElement | undefined
  let singleFilterActivator:  HTMLElement | undefined
  let singleFilterMenuAnchor: 'right-center' | 'bottom-center' = 'right-center'
  let singleFilterMenuOpened: boolean = false

  let selectedFilter : Filter | undefined = undefined
  $: selectedFilterIndex = filters.findIndex((f) => { return f.name === selected })
  $: selectedFilter = selected === undefined ? undefined : filters[selectedFilterIndex]

  function handleFilterSelection(e: CustomEvent) {
    singleFilterActivator = filterOptionsListActivator
    singleFilterMenuAnchor = 'right-center'
    singleFilterMenuOpened = true;
    selected = e.detail.element.name
  }

  function handleCancelFilterClick() {
    open = false
    singleFilterMenuOpened = false;
  }

  function handleApplyFilterClick() {
    if(!!selectedFilter) {
      open = false
      singleFilterMenuOpened = false;
    }
  }

  $: activeFilters = filters.filter((f) => f.active)

  function handleRemoveFilter(filter: { name: string }) {
    let filterIndex = filters.findIndex((f) => f.name === filter.name)
    filters[filterIndex].active = false
    dispatch('removeFilterClick', { filter: filters[filterIndex] })
  }

  let activeFiltersActivators: Record<string, HTMLElement> = {}
  function handleActiveFilterClick(filter: { name: string }) {
    singleFilterActivator = activeFiltersActivators[filter.name]
    singleFilterMenuAnchor = 'bottom-center'
    singleFilterMenuOpened = true;
    selected = filter.name
  }
</script>

<div class="filters-container">
  {#if showActiveFilters}
    <div class="active-filters-container">
      {#each activeFilters as filter}
        <div
          class="filter-slot"
          bind:this={activeFiltersActivators[filter.name]}
        >
          <Chip
            label
            close
            on:close={() => handleRemoveFilter(filter)}
            on:click={() => handleActiveFilterClick(filter)}
          >
            {#if filter.type === "string" }
            <b>{filter.label}</b> {filter.mode}  <b>{filter.value}</b>
            {:else if filter.type === "date"}
              <b>{filter.label}</b>
              {#if filter.mode == 'between'}
                {filter.mode}  <b>{filter.from?.toLocaleDateString(dateLocale)}</b>
                {betweenSeparator} <b>{filter.to?.toLocaleDateString(dateLocale)}</b>
              {:else}
                {filter.mode}  <b>{filter.value?.toLocaleDateString(dateLocale)}</b>
              {/if}
            {:else}
              {filter.label}
            {/if}
          </Chip>
        </div>
      {/each}
    </div>
  {/if}

  <div
    class="filter-button"
    bind:this={activator}
  >
    <Button
      --button-color="var(--chip-color, var(--chip-default-color))"
      on:click={handleAddFilterClick}
    >
      <Icon name="mdi-filter"></Icon>
      {addFilterLabel}
      {#if activeFilters.length > 0 }
        ({activeFilters.length})
      {/if}
    </Button>

  </div>
</div>

<MediaQuery let:mAndDown>
  {#if mAndDown}
    <Drawer
      bind:open={open}
      position="bottom"
      on:item-click
    >
      <SelectableVerticalList
        bind:selected
        bind:focused
        bind:elements={filterOptions}
        --selectable-vertical-list-default-width="100%"
        --selectable-vertical-list-default-element-height="56px"
        --selectable-vertical-list-default-title-font-size="null"
        on:select={handleFilterSelection}
      ></SelectableVerticalList>
    </Drawer>
  {:else}
    <Menu
      bind:activator={activator}
      bind:open={open}
      closeOnClickOutside
      _boxShadow="rgb(var(--global-color-grey-900), .5) 0px 2px 4px"
      _height="fit-content"
      _maxHeight="300px"
      _minWidth="10vw"
      _borderRadius="5px"
      anchor="bottom"
    >
      <div
        style:background-color="rgb(var(--global-color-background-200))"
        bind:this={filterOptionsListActivator}
        on:click|stopPropagation
        on:keydown
      >
        <SelectableVerticalList
          bind:selected
          bind:focused
          bind:elements={filterOptions}
          --selectable-vertical-list-default-width="100%"
          --selectable-vertical-list-default-element-height="56px"
          --selectable-vertical-list-default-title-font-size="null"
          on:select={handleFilterSelection}
        ></SelectableVerticalList>
      </div>
    </Menu>

    <Menu
      _width="350px"
      _borderRadius="10px"
      _boxShadow="rgb(var(--global-color-grey-900), .5) 0px 2px 4px"
      _overflow="unset"
      activator={singleFilterActivator}
      bind:open={singleFilterMenuOpened}
      anchor={singleFilterMenuAnchor}
      closeOnClickOutside
      openingId="second-menu"
      flipOnOverflow
    >
      <div
        style:min-height="160px"
        on:click
        on:keydown
        style:border-radius="10px"
        style:overflow="auto"
        style:height="100%"
        style:background-color="rgb(var(--global-color-background-200))"
      >
        <div class="filter-title">
          {filterTitleLabel} {selectedFilter?.label}
        </div>

        {#if !!selectedFilter}
          <FilterEditor
            bind:filter={selectedFilter}
            bind:applyFilterLabel
            bind:cancelFilterLabel
            on:cancel={handleCancelFilterClick}
            on:apply={handleApplyFilterClick}
          ></FilterEditor>
        {/if}
      </div>
    </Menu>
  {/if}
</MediaQuery>



<style>
  .filter-button {
    display: flex;
    column-gap: 10px;
  }

  .filter-title{
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  .active-filters-container {
    display: flex;
    align-items: flex-start;
    column-gap: 10px;
  }

  .filters-container {
    display: flex;
    gap: 10px;
    align-items: stretch;
  }

</style>