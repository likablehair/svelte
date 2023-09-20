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
  import type { Locale } from '$lib/components/simple/dates/utils';
  import Validator from '$lib/utils/filters/validator';
  import FilterEditor from './FilterEditor.svelte';
  import MobileFilterEditor from './MobileFilterEditor.svelte';
  import { fly } from 'svelte/transition';

  export let
    addFilterLabel: string = "Filters",
    filters: Filter[] = [],
    cancelFilterLabel : string = "Cancel",
    applyFilterLabel : string = "Apply Filter",
    showActiveFilters: boolean = true,
    filterTitleLabel: string = "Filtra per ",
    dateLocale: Locale = 'it',
    betweenSeparator: string = "e",
    trueString: string = "vero",
    falseString: string = "falso"

  let dispatch = createEventDispatcher<{
    'addFilterClick': undefined,
    'selectFilterClick': undefined,
    'removeFilterClick': {
      filter: Filter
    }
  }>()

  let open: boolean = false,
    mobileOpen: boolean = false,
    activator: HTMLElement

  function handleAddFilterClick() {
    dispatch('addFilterClick')
    open = true
    mobileOpen = true
  }

  $: filterOptions = filters.map((f) => {
    return {
      title: f.label,
      name: f.name
    }
  })

  $: deletableFilterOptions = filters.map((f) => {
    return {
      title: f.label,
      name: f.name,
      appendIcon: f.active ? 'mdi-delete' : undefined
    }
  })

  let selected: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  let focused: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  $: if(!!focused && !open) focused = undefined

  let filterOpened: 'edit' | 'new' = 'new'


  let filterOptionsListActivator: HTMLElement | undefined
  let singleFilterActivator:  HTMLElement | undefined
  let singleFilterMenuAnchor: 'right-center' | 'bottom-center' = 'right-center'
  let singleFilterMenuOpened: boolean = false

  let selectedFilter : Filter | undefined = undefined
  $: selectedFilterIndex = filters.findIndex((f) => { return f.name === selected })
  $: selectedFilter = selected === undefined ? undefined : filters[selectedFilterIndex]


  function handleFilterSelection(e: CustomEvent, mobile: boolean = false) {
    if(mobile) {
      selected = e.detail.element.name
      singleFilterMenuOpened = true;
    } else {
      singleFilterActivator = filterOptionsListActivator
      singleFilterMenuAnchor = 'right-center'
      singleFilterMenuOpened = true;
      selected = e.detail.element.name
      filterOpened = 'new'
    }
  }

  function handleCancelFilterClick() {
    open = false
    mobileOpen = false
    singleFilterMenuOpened = false;
  }

  function handleApplyFilterClick() {
    if(!!selectedFilter) {
      filters[selectedFilterIndex] = selectedFilter
      open = false
      mobileOpen = false
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
    mobileOpen=true
    selected = filter.name
    filterOpened = 'edit'
  }

  function handleMobileBackTap() {
    closeFilterMenu(0)
  }

  function closeFilterMenu(delay: number) {
    setTimeout(() => {
      singleFilterMenuOpened = false
    }, delay)
  }

  function handleDeleteIconClick(e: CustomEvent) {
    let filterIndex = e.detail.index
    filters[filterIndex].active = false
    dispatch('removeFilterClick', { filter: filters[filterIndex] })
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
            <span class="truncate-text inline-truncated" style:max-width="160px">
              <b>{filter.label}</b>
            </span>
            {#if filter.type === "string" && filter.value != undefined}
              {filter.mode}
              <span class="truncate-text inline-truncated">
                <b>{filter.value}</b>
              </span>
            {:else if filter.type === "date"}
              {#if filter.mode == 'between' && filter.from != undefined && filter.to != undefined}
                {filter.mode}
                <span class="truncate-text inline-truncated"><b>{filter.from?.toLocaleDateString(dateLocale)}</b></span>
                {betweenSeparator}
                <span class="truncate-text inline-truncated"><b>{filter.to?.toLocaleDateString(dateLocale)}</b></span>
              {:else if filter.mode != 'between' && filter.value != undefined}
                {filter.mode}
                <span class="truncate-text inline-truncated"><b>{filter.value?.toLocaleDateString(dateLocale)}</b></span>
              {/if}
            {:else if filter.type == "number"}
              {#if filter.mode == 'between' && filter.from != undefined && filter.to != undefined}
                {filter.mode}
                <span class="truncate-text inline-truncated"><b>{filter.from}</b></span>
                {betweenSeparator}
                <span class="truncate-text inline-truncated"><b>{filter.to}</b></span>
              {:else if filter.mode != 'between' && filter.value != undefined}
                {filter.mode}
                <span class="truncate-text inline-truncated"><b>{filter.value}</b></span>
              {/if}
            {:else if filter.type == 'select' && !!filter.values && filter.values.length > 0}
              {filter.mode} <span class="truncate-text inline-truncated"><b>{filter.values[0].label}</b></span>
              {#if filter.values.length >= 2}
                <span class="more-items">+{filter.values.length - 1}
                  <span class="more-tooltip">
                    <ul>
                      {#each filter.values as value}
                        <li><div class="truncate-text">{value.label}</div></li>
                      {/each}
                    </ul>
                  </span>
                </span>
              {/if}
            {:else if filter.type == 'bool' && filter.value !== undefined}
                <b>{filter.value ? trueString : falseString}</b>
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
      bind:open={mobileOpen}
      position="bottom"
      on:close={() => {closeFilterMenu(200)}}
      --drawer-border-radius="20px 20px 0px 0px"
      --drawer-margin="5px 5px 0px 5px"
    >
      <div class="drawer-content">
        {#if !!selectedFilter && singleFilterMenuOpened}
          <div class="drawer-filter-detail" style:height="100%" in:fly={{delay: 100, duration: 100, x: 200}} out:fly={{duration: 100, x: -200}}>
            <MobileFilterEditor
              bind:filter={selectedFilter}
              bind:applyFilterLabel
              bind:cancelFilterLabel
              on:apply={handleApplyFilterClick}
              on:backClick={handleMobileBackTap}
              on:cancelClick={() => {mobileOpen = false; closeFilterMenu(200)}}
            >
              <div slot="title">
                <div class="mobile-title">
                  {selectedFilter?.label}
                </div>
              </div>
            </MobileFilterEditor>
          </div>
        {:else}
          <div class="drawer-filter-list" style:margin-top="20px" style:height="100%" out:fly={{duration: 100, x: -200}} in:fly={{duration: 100, x: 200, delay: 100}}>
            <SelectableVerticalList
              bind:selected
              bind:focused
              bind:elements={deletableFilterOptions}
              --selectable-vertical-list-default-width="100%"
              --selectable-vertical-list-default-element-height="56px"
              --selectable-vertical-list-default-title-font-size="null"
              on:select={(e) => {handleFilterSelection(e, true)}}
              centered
              bicolor
              appendIconSize="18pt"
              on:iconClick={handleDeleteIconClick}
              --icon-color="rgb(var(--global-color-error-400))"
            ></SelectableVerticalList>
          </div>
        {/if}
      </div>
    </Drawer>
  {:else}
    <Menu
      bind:activator={activator}
      bind:open={open}
      closeOnClickOutside
      _boxShadow="rgb(var(--global-color-grey-900), .5) 0px 2px 4px"
      _height="fit-content"
      _minWidth="10vw"
      _borderRadius="5px"
      anchor="bottom"
      openingId="select-filter"
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
      flipOnOverflow
      openingId={ filterOpened == 'edit' ? "select-filter" : ""}
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

  .filter-title{
    display: flex;
    justify-content: center;
    margin-top: 10px;
    margin-left: 10px;
  }

  .active-filters-container {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 5px
  }

  .filters-container {
    display: flex;
    gap: 10px;
    align-items: stretch;
  }

  .drawer-content{
    height: 100%;
  }

  .more-items {
    position: relative;
    padding: 2px 8px 2px 8px;
    border-radius: 20px;
    margin-left: 5px;
    background-color: rgb(var(--global-color-grey-50));
    color: rgb(var(--global-color-primary-500));
    font-weight: 800;
    font-size: .7rem;
  }

  .more-tooltip {
    visibility: hidden;
    min-width: 120px;
    max-width: 300px;
    width: fit-content;
    border-radius: 6px;
    padding: 5px 0;
    position: absolute;
    text-align: left;
    bottom: 125%;
    left: 50%;
    margin-left: -60px;
    opacity: 0;
    transition: opacity 0.3s;
    position: absolute;
    background-color: rgb(var(--global-color-background-200));
    color: rgb(var(--global-color-background-950));
    z-index: 100;
  }

  .more-tooltip ul {
    list-style-type: none;
    padding-left: 0px;
    margin-left: 20px;
    margin-right: 20px
  }


  .more-items:hover .more-tooltip {
    visibility: visible;
    opacity: 1;
  }

  .truncate-text {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .inline-truncated {
    display: inline-block;
    vertical-align: middle;
    max-width: 240px;
  }

</style>