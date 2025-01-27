<script lang="ts" context="module">
  export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

  export type LabelMapper = {
    [label: string]: {extended?: string, short: string}
  }
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
  import { isDateMode, isSelectMode, isStringMode, type DateMode, type Filter, type NumberMode, type SelectMode, type StringMode } from '$lib/utils/filters/filters';
  import SelectableVerticalList from '$lib/components/simple/lists/SelectableVerticalList.svelte';
  import Chip from '$lib/components/simple/navigation/Chip.svelte';
  import type { Locale } from '$lib/components/simple/dates/utils';
  import FilterEditor from './FilterEditor.svelte';
  import MobileFilterEditor from './MobileFilterEditor.svelte';
  import { fly } from 'svelte/transition';
  import Dialog from '$lib/components/simple/dialogs/Dialog.svelte';
  import Validator from '$lib/utils/filters/validator';
    import ToolTip from '../common/ToolTip.svelte';

  export let
    filters: Filter[] = [],
    lang: 'it' | 'en' = 'en',
    addFilterLabel: string = lang == 'en' ? "Filters" : "Filtri",
    cancelFilterLabel : string = lang == 'en' ? "Cancel" : "Annulla",
    applyFilterLabel : string = lang == 'en' ? "Apply filter" : "Applica filtro",
    showActiveFilters: boolean = true,
    filterTitleLabel: string = lang == 'en' ? "Filter by" : "Filtra per",
    dateLocale: Locale = lang == 'en' ? 'en' : 'it',
    betweenSeparator: string = lang == 'en' ? "and" : "e",
    trueString: string = lang == 'en' ? "true" : "vero",
    falseString: string = lang == 'en' ? "false" : "falso",
    editFilterMode: 'one-edit' | 'multi-edit' = 'one-edit',
    // TODO create global translation mechanism
    labelsMapper: LabelMapper = lang == 'en' ? {
      'equal': {
        extended: 'equal to',
        short: 'equal'
      },
      'like': {
        short: 'includes'
      },
      'ilike': {
        short: 'includes'
      },
      'contains': {
        short: 'contains'
      },
      'greater': {
        short: 'greater',
        extended: 'greater than'
      },
      'lower': {
        short: 'lower',
        extended: 'lower than'
      },
      'between': {
        short: 'between',
        extended: 'is between'
      },
      'different': {
        short: 'different',
        extended: 'different from'
      }
    } : {
      'equal': {
        extended: 'uguale a',
        short: 'uguale'
      },
      'like': {
        short: 'include'
      },
      'ilike': {
        short: 'include'
      },
      'contains': {
        short: 'contiene'
      },
      'greater': {
        short: 'maggiore',
        extended: 'maggiore di'
      },
      'lower': {
        short: 'minore',
        extended: 'minore di'
      },
      'between': {
        short: 'compreso',
        extended: 'è compreso'
      },
      'different': {
        short: 'diverso',
        extended: 'diverso da'
      }
    }


  let dispatch = createEventDispatcher<{
    'addFilterClick': undefined,
    'applyFilter': undefined,
    'removeFilter': {
      filter: Filter
    },
    'removeAllFilters': undefined
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

    let filter = filters.find(f => f.name === e.detail.element.name)
    if(!!filter) {
      if(filter.type === 'custom') {
        customFilterApplyDisabled = filter.active === undefined || filter.active === false
      }
    }
  }

  function handleCancelFilterClick() {
    open = false
    mobileOpen = false
    singleFilterMenuOpened = false;
  }

  function handleApplyFilterClick() {
    if(!!selectedFilter && !!selectedTmpFilter) {
      selectedFilter = {...selectedTmpFilter}
      selectedFilter.active = true
      filters[selectedFilterIndex] = selectedFilter
      open = false
      mobileOpen = false
      singleFilterMenuOpened = false;
      dispatch('applyFilter')
    }
  }

  $: activeFilters = filters.filter((f) => f.active)

  function handleRemoveFilter(filter: { name: string }) {
    let filterIndex = filters.findIndex((f) => f.name === filter.name)
    filters[filterIndex].active = false
    let filterName = filter.name
    if(Object.keys(filters[filterIndex]).includes('value')) {
      //@ts-ignore
      filters[filterIndex].value = undefined
      if(!!tmpFilters[filterName] && Object.keys(tmpFilters[filterName]).includes('value')) {
        //@ts-ignore
        tmpFilters[filterName].value = undefined
      }
    }
    if(Object.keys(filters[filterIndex]).includes('from')) {
      //@ts-ignore
      filters[filterIndex].from = undefined
      if(!!tmpFilters[filterName] && Object.keys(tmpFilters[filterName]).includes('from')) {
        //@ts-ignore
        tmpFilters[filterName].from = undefined
      }
    }
    if(Object.keys(filters[filterIndex]).includes('to')) {
      //@ts-ignore
      filters[filterIndex].to = undefined
      if(!!tmpFilters[filterName] && Object.keys(tmpFilters[filterName]).includes('to')) {
        //@ts-ignore
        tmpFilters[filterName].to = undefined
      }
    }
    if(Object.keys(filters[filterIndex]).includes('values')) {
      //@ts-ignore
      filters[filterIndex].values = undefined
      if(!!tmpFilters[filterName] && Object.keys(tmpFilters[filterName]).includes('values')) {
        //@ts-ignore
        tmpFilters[filterName].values = undefined
      }
    }
    singleFilterMenuOpened = false
    dispatch('removeFilter', { filter: filters[filterIndex] })
  }

  let activeFiltersActivators: Record<string, HTMLElement> = {}
  function handleActiveFilterClick(filter: { name: string, type: 'custom' | string }) {
    singleFilterActivator = activeFiltersActivators[filter.name]
    singleFilterMenuAnchor = 'bottom-center'
    singleFilterMenuOpened = true;
    mobileOpen=true
    selected = filter.name
    filterOpened = 'edit'

    if(filter.type === 'custom') {
      customFilterApplyDisabled = false
    }
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
    let name = filters[filterIndex].name
    handleRemoveFilter({name})
  }

  function handleRemoveAllFilters(e?: MouseEvent) {
    if(!!e) e.stopPropagation()
    for(let i = 0; i < filters.length; i += 1) {
      filters[i].active = false
      if(Object.keys(filters[i]).includes('value')) {
        //@ts-ignore
        filters[i].value = undefined
      }
      if(Object.keys(filters[i]).includes('from')) {
        //@ts-ignore
        filters[i].from = undefined
      }
      if(Object.keys(filters[i]).includes('to')) {
        //@ts-ignore
        filters[i].to = undefined
      }
      if(Object.keys(filters[i]).includes('values')) {
        //@ts-ignore
        filters[i].values = undefined
      }
      singleFilterMenuOpened = false
    }
    filters = filters
    tmpFilters = {}
    customToBeInitialized = false
    dispatch('removeAllFilters')
  }

  function handleMultiEditApplyClick() {
    open = false
    mobileOpen = false
    dispatch('applyFilter')
  }

  function handleMultiEditRemoveClick() {
    handleRemoveAllFilters()
    open = false
    mobileOpen = false
  }

  let selectedTmpFilter: Filter | undefined = undefined

  let tmpFilters: {[filterName: string]: Filter} = {}

  function handleApplyMultiFilterClick() {
    for(let i = 0; i < filters.length; i += 1) {
      if(!!filters[i] && !!tmpFilters[filters[i].name]) {
        filters[i] = {...tmpFilters[filters[i].name]}
        filters[i].active = filters[i].type !== 'custom' ? Validator.isValid(tmpFilters[filters[i].name]) : tmpFilters[filters[i].name].active
      }
    }
    filters = filters
    handleMultiEditApplyClick()
  }

  function updateMultiFilterValues(filterName: string, newValue: any, newValid: boolean, mode?: NumberMode | StringMode | SelectMode | DateMode) {
    let filter = filters.find(f => f.name === filterName)
    if(!filter) throw new Error('cannot find filter with name ' + filterName)
    if(!tmpFilters[filterName]) tmpFilters[filterName] = {...filter}
    let tmpFilter = tmpFilters[filterName]
    if('mode' in tmpFilter && !!mode) {
      if(tmpFilter.type == 'date' && isDateMode(mode)){
        tmpFilter.mode = mode
      }
      else if(tmpFilter.type == 'number' && isDateMode(mode)){
        tmpFilter.mode = mode
      }
      else if(tmpFilter.type == 'string' && isStringMode(mode)){
        tmpFilter.mode = mode
      }
      else if(tmpFilter.type == 'select' && isSelectMode(mode)){
        tmpFilter.mode = mode
      }
    }
    if(tmpFilter.type == 'select') {
      tmpFilter.values = newValue
    } else if('mode' in tmpFilter && tmpFilter.mode == 'between') {
      tmpFilter.to = newValue.to
      tmpFilter.from = newValue.from
    } else {
      tmpFilter.value = newValue
    }
    tmpFilter.active = newValid
  }

  let customToBeInitialized = true
  $: if(customToBeInitialized && !!tmpFilters) initCustomTmpFilters()

  function initCustomTmpFilters() {
    let customFilters = filters.filter(f => f.type === 'custom')
    for(const customFilter of customFilters) {
      if(!tmpFilters[customFilter.name]) {
        tmpFilters[customFilter.name] = { ...customFilter }
      }
    }
    customToBeInitialized = false
  }

  let customFilterApplyDisabled: boolean = true
  function updateFunction(filterName: string, newValue: any, newValid: boolean) {
    let tmpFilter = tmpFilters[filterName]
    if(!!tmpFilter && tmpFilter.type == 'custom') {
      tmpFilter.value = newValue
      tmpFilter.active = newValid
      selectedTmpFilter = {...tmpFilter}
      customFilterApplyDisabled = !newValid
    }
  }

  let moreItemsActivator: HTMLElement

</script>

<MediaQuery let:mAndDown>
  <div class="filters-wrapper" class:mobile={mAndDown} style:--filter-dot-size={activeFilters.length > 0 ? '22px' : '0px'} style:--filter-dot-content={activeFilters.length > 0 ? `"${activeFilters.length}"` : '""'}>
    <div class="filters-container" class:mobile={mAndDown} class:hidden={mAndDown && (!showActiveFilters || activeFilters.length == 0)}>
      {#if showActiveFilters}
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
              {#if filter.type === 'custom'}
                <slot name="custom-chip" {filter}></slot>
              {:else}
                <span class="truncate-text inline-truncated" style:max-width="160px">
                  <b>{filter.label}</b>
                </span>
                {#if filter.type === "string" && filter.value != undefined}
                  {labelsMapper[filter.mode || ""].extended || labelsMapper[filter.mode || ""].short || filter.mode}
                  <span class="truncate-text inline-truncated">
                    <b>{filter.value}</b>
                  </span>
                {:else if filter.type === "date"}
                  {#if filter.mode == 'between' && filter.from != undefined && filter.to != undefined}
                    {labelsMapper[filter.mode || ""].extended || labelsMapper[filter.mode || ""].short || filter.mode}
                    <span class="truncate-text inline-truncated"><b>{filter.from?.toLocaleDateString(dateLocale)}</b></span>
                    {betweenSeparator}
                    <span class="truncate-text inline-truncated"><b>{filter.to?.toLocaleDateString(dateLocale)}</b></span>
                  {:else if filter.mode == 'between' && filter.from != undefined}
                    {labelsMapper['greater'].extended || labelsMapper['greater'].short}
                    <span class="truncate-text inline-truncated"><b>{filter.from?.toLocaleDateString(dateLocale)}</b></span>
                  {:else if filter.mode == 'between' && filter.to != undefined}
                    {labelsMapper['lower'].extended || labelsMapper['lower'].short}
                    <span class="truncate-text inline-truncated"><b>{filter.to?.toLocaleDateString(dateLocale)}</b></span>
                  {:else if filter.mode != 'between' && filter.value != undefined}
                    {labelsMapper[filter.mode || ""].extended || labelsMapper[filter.mode || ""].short || filter.mode}
                    <span class="truncate-text inline-truncated"><b>{filter.value?.toLocaleDateString(dateLocale)}</b></span>
                  {/if}
                {:else if filter.type == "number"}
                  {#if filter.mode == 'between' && filter.from != undefined && filter.to != undefined}
                    {labelsMapper[filter.mode || ""].extended || labelsMapper[filter.mode || ""].short || filter.mode}
                    <span class="truncate-text inline-truncated"><b>{filter.from}</b></span>
                    {betweenSeparator}
                    <span class="truncate-text inline-truncated"><b>{filter.to}</b></span>
                  {:else if filter.mode == 'between' && filter.from != undefined}
                    {labelsMapper['greater'].extended || labelsMapper['greater'].short}
                    <span class="truncate-text inline-truncated"><b>{filter.from}</b></span>
                  {:else if filter.mode == 'between' && filter.to != undefined}
                    {labelsMapper['lower'].extended || labelsMapper['lower'].short}
                    <span class="truncate-text inline-truncated"><b>{filter.to}</b></span>
                  {:else if filter.mode != 'between' && filter.value != undefined}
                    {labelsMapper[filter.mode || ""].extended || labelsMapper[filter.mode || ""].short || filter.mode}
                    <span class="truncate-text inline-truncated"><b>{filter.value}</b></span>
                  {/if}
                {:else if filter.type == 'select' && !!filter.values && filter.values.length > 0}
                  {labelsMapper[filter.mode || ""].extended || labelsMapper[filter.mode || ""].short || filter.mode}
                  <span class="truncate-text inline-truncated"><b>{filter.values[0].label}</b></span>
                  {#if filter.values.length >= 2}
                    <span class="more-items" bind:this={moreItemsActivator}>+{filter.values.length - 1}</span>
                    <ToolTip activator={moreItemsActivator}>
                      <div class="more-tooltip-content">
                        <ul>
                          {#each filter.values as value}
                            <li><div class="truncate-text">{value.label}</div></li>
                          {/each}
                        </ul>
                      </div>
                    </ToolTip>
                  {/if}
                {:else if filter.type == 'bool' && filter.value !== undefined}
                    <b>{filter.value ? trueString : falseString}</b>
                {/if}
              {/if}
            </Chip>
          </div>
        {/each}
      {/if}
      {#if !mAndDown}
        <div
          class="filter-button"
          bind:this={activator}
        >
          <Button
            --button-color="var(--chip-color, var(--chip-default-color))"
            on:click={handleAddFilterClick}
          >
            <div class="filter-button-content">
              <Icon name="mdi-filter"></Icon>
              {addFilterLabel}
              <div class="remove-filters" class:hidden={activeFilters.length <= 0}>
                <Icon name="mdi-close-circle" click on:click={handleRemoveAllFilters}></Icon>
              </div>
            </div>
          </Button>

        </div>
      {/if}
    </div>
    {#if mAndDown}
      <div
        class="filter-button"
        bind:this={activator}
      >
        <Button
          --button-color="var(--chip-color, var(--chip-default-color))"
          on:click={handleAddFilterClick}
        >
          <div class="filter-button-content">
            <Icon name="mdi-filter"></Icon>
            {addFilterLabel}
            <div class="remove-filters" class:hidden={activeFilters.length <= 0}>
              <Icon name="mdi-close-circle" click on:click={handleRemoveAllFilters}></Icon>
            </div>
          </div>
        </Button>

      </div>
    {/if}
    <slot name="append"></slot>
  </div>
  {#if mAndDown}
    <Drawer
      bind:open={mobileOpen}
      position="bottom"
      on:close={() => {closeFilterMenu(200)}}
      _borderRadius="20px 20px 0px 0px"
      _margin="5px 5px 0px 5px"
    >
      <div class="drawer-content">
        {#if editFilterMode === 'one-edit'}
          {#if !!selectedFilter && singleFilterMenuOpened}
            <div
              class="drawer-filter-detail"
              style:height="100%"
              in:fly|local={{delay: 100, duration: 100, x: 200}}
              out:fly|local={{duration: 100, x: -200}}
            >
              <MobileFilterEditor
                bind:filter={selectedFilter}
                on:backClick={handleMobileBackTap}
                {lang}
                {labelsMapper}
                bind:tmpFilter={selectedTmpFilter}
              >
                <div slot="title">
                  <div class="mobile-title">
                    {selectedFilter?.label}
                  </div>
                </div>
                <svelte:fragment slot="custom" let:filter>
                  <slot name="custom" {filter} {updateFunction} {mAndDown}></slot>
                </svelte:fragment>

                <svelte:fragment slot="filter-actions" let:applyFilterDisabled let:filter>
                  <div class="btn">
                    <Button
                      --button-width="100%"
                      --button-box-shadow="none"
                      --button-height="30px"
                      --button-padding="10px 0px 10px 0px"
                      --button-border-radius="10px 10px 0px 0px"
                      disabled={!filter || (filter.type === 'custom' ? customFilterApplyDisabled : applyFilterDisabled)}
                      on:click={handleApplyFilterClick}
                    >{applyFilterLabel}</Button>
                  </div>
                  <div class="btn">
                    <Button
                      --button-width="100%"
                      --button-box-shadow="none"
                      --button-padding="10px 0px 10px 0px"
                      --button-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                      --button-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                      --button-border-radius="0px 0px 0px 0px"
                      on:click={() => {mobileOpen = false; closeFilterMenu(200)}}
                    >{cancelFilterLabel}</Button>
                  </div>
                </svelte:fragment>

              </MobileFilterEditor>
            </div>
          {:else}
            <div
              class="drawer-filter-list"
              style:margin-top="20px"
              style:height="100%"
              out:fly|local={{duration: 100, x: -200}}
              in:fly|local={{duration: 100, x: 200, delay: 100}}
            >
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
        {:else if editFilterMode === 'multi-edit'}
          <div
            class="drawer-multi-filter"
            style:height="100%"
          >
            <div class="form-container" style:background-color={mAndDown ? 'transparent' : 'rgb(var(--global-color-background-100))'} style:width={mAndDown ? '100%' : '50vw'} style:box-sizing="border-box">
              <div class="header">
                <h1>{addFilterLabel}</h1>
              </div>
              <div class="body">
                <slot name="content" {mAndDown} {updateMultiFilterValues} {handleRemoveAllFilters} {filters}>
                  <div class="multi-filters-container" style:grid-template-columns={mAndDown ? '1fr' : '1fr 1fr'}>
                    {#each filters as filter, i}
                      <div class="filter">
                        <div class="input">
                          {#if !filter.advanced && filter.type !== 'custom'}
                            <div class="label">
                              {filter.label}
                            </div>
                          {/if}
                          <div class="field">
                            <FilterEditor
                              bind:filter={filter}
                              {lang}
                              {labelsMapper}
                              editFilterMode="multi-edit"
                              bind:tmpFilter={tmpFilters[filter.name]}
                              mobile={mAndDown}
                            >
                              <slot name="custom" slot="custom" {updateFunction} {mAndDown} {filter}></slot>
                            </FilterEditor>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </slot>
              </div>
              <div class="footer">
                <div class="actions" style:padding-bottom={mAndDown ? '20px' : undefined}>
                  <Button
                    --button-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                    --button-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                    --button-hover-background-color="rgb(var(--global-color-primary-500))"
                    --button-hover-box-shadow="0 0 0.5rem rgba(0, 0, 0, 0.3)"
                    --button-box-shadow="none"
                    on:click={handleCancelFilterClick}
                  >
                    {cancelFilterLabel}
                  </Button>
                  <Button
                    --button-color="rgb(var(--global-color-primary-400))"
                    --button-background-color="transparent"
                    --button-hover-background-color="rgb(var(--global-color-primary-500))"
                    --button-hover-box-shadow="0 0 0.5rem rgba(0, 0, 0, 0.3)"
                    --button-box-shadow="none"
                    on:click={handleMultiEditRemoveClick}
                  >
                    {lang == 'en' ? "Remove filters" : "Rimuovi filtri"}
                  </Button>
                  <Button
                    --button-min-width="100px"
                    on:click={handleApplyMultiFilterClick}
                  >
                    {applyFilterLabel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </Drawer>
  {:else}
    {#if editFilterMode === 'one-edit'}
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
        flipOnOverflow
      >
        <div
          style:background-color="rgb(var(--global-color-background-200))"
          bind:this={filterOptionsListActivator}
          on:click|stopPropagation
          on:keydown
          role="presentation"
          tabindex="-1"
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
          role="presentation"
        >
          <div class="filter-title">
            {filterTitleLabel} {selectedFilter?.label}
          </div>

          {#if !!selectedFilter}
            <FilterEditor
              bind:filter={selectedFilter}
              {lang}
              {labelsMapper}
              bind:tmpFilter={selectedTmpFilter}
            >
              <svelte:fragment slot="custom" let:filter>
                <slot name="custom" {filter} {updateFunction} {mAndDown}></slot>
              </svelte:fragment>
              <svelte:fragment slot="filter-actions" let:applyFilterDisabled let:filter>
                <div class="sub-filter-button">
                  <Button
                    --button-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                    --button-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                    --button-hover-background-color="rgb(var(--global-color-primary-500))"
                    --button-hover-box-shadow="0 0 0.5rem rgba(0, 0, 0, 0.3)"
                    --button-box-shadow="none"
                    on:click={handleCancelFilterClick}
                  >
                    {cancelFilterLabel}
                  </Button>
                  <Button
                    --button-min-width="100px"
                    on:click={handleApplyFilterClick}
                    disabled={!filter || (filter.type === 'custom' ? customFilterApplyDisabled : applyFilterDisabled)}
                  >
                    {applyFilterLabel}

                  </Button>
                </div>
              </svelte:fragment>
            </FilterEditor>
          {/if}
        </div>
      </Menu>
    {:else if editFilterMode === 'multi-edit'}
      <Dialog
        bind:open={open}
      >
        <div class="form-container" style:background-color={mAndDown ? 'transparent' : 'rgb(var(--global-color-background-100))'} style:width={mAndDown ? '100%' : '50vw'} style:box-sizing="border-box">
          <div class="header">
            <h1>{addFilterLabel}</h1>
          </div>
          <div class="body">
            <slot name="content" {mAndDown} {updateMultiFilterValues} {handleRemoveAllFilters} {filters}>
              <div class="multi-filters-container" style:grid-template-columns={mAndDown ? '1fr' : '1fr 1fr'}>
                {#each filters as filter, i}
                  <div class="filter" class:wide={filter.type === 'select' || filter.type === 'custom'}>
                    <div class="input">
                      {#if !filter.advanced && filter.type !== 'custom'}
                        <div class="label">
                          {filter.label}
                        </div>
                      {/if}
                      <div class="field">
                        <FilterEditor
                          bind:filter={filter}
                          {lang}
                          {labelsMapper}
                          editFilterMode="multi-edit"
                          bind:tmpFilter={tmpFilters[filter.name]}
                          mobile={mAndDown}
                        >
                          <slot name="custom" slot="custom" {updateFunction} {mAndDown} {filter}></slot>
                        </FilterEditor>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </slot>
          </div>
          <div class="footer">
            <div class="actions" style:padding-bottom={mAndDown ? '20px' : undefined}>
              <Button
                --button-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                --button-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                --button-hover-background-color="rgb(var(--global-color-primary-500))"
                --button-hover-box-shadow="0 0 0.5rem rgba(0, 0, 0, 0.3)"
                --button-box-shadow="none"
                on:click={handleCancelFilterClick}
              >
                {cancelFilterLabel}
              </Button>
              <Button
                --button-color="rgb(var(--global-color-primary-400))"
                --button-background-color="transparent"
                --button-hover-background-color="rgb(var(--global-color-primary-500))"
                --button-hover-box-shadow="0 0 0.5rem rgba(0, 0, 0, 0.3)"
                --button-box-shadow="none"
                on:click={handleMultiEditRemoveClick}
              >
                {lang == 'en' ? "Remove filters" : "Rimuovi filtri"}
              </Button>
              <Button
                --button-min-width="100px"
                on:click={handleApplyMultiFilterClick}
              >
                {applyFilterLabel}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    {/if}
  {/if}
</MediaQuery>


<style>

  .sub-filter-button {
    display: flex;
    column-gap: 10px;
    flex-direction: row;
    align-items: start;
    margin-top: 10px;
  }

  .filter-button-content {
    display: flex;
    gap: 10px
  }

  .filter-button-content .remove-filters {
    margin: 0px 8px 0px 8px;
    color: rgb(var(--global-color-primary-100));
  }

  .filter-button-content .remove-filters:hover {
    color: white;
  }

  .filter-button-content .remove-filters.hidden {
    display: none;
  }

  .filter-button::before {
    content: var(--filter-dot-content, '0');
    text-align: center;
    font-size: .6rem;
    background-color: rgb(var(--global-color-background-500));
    color: rgb(var(--global-color-contrast-700));
    position: absolute;
    box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
    top: -40%;
    left: calc(100% - 10px);
    border-radius: 100px;
    width: var(--filter-dot-size, 0px);
    height: var(--filter-dot-size, 0px);
  }

  .filter-title{
    display: flex;
    justify-content: center;
    margin-top: 10px;
    margin-left: 10px;
  }

  .filter-slot {
    flex-shrink: 0;
    flex-grow: 0;
  }

  .filters-container {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-items: center;
  }

  .filters-container.mobile {
    flex-wrap: nowrap;
    overflow: scroll;
  }

  .filters-wrapper {
    display: flex;
    align-items: center;
    gap: 20px;
    max-width: 100%;
    width: var(
      --filters-wrapper-width,
      var(--filters-default-wrapper-width)
    )
  }

  .filter-button {
    flex-shrink: 0;
    flex-grow: 0;
    height: fit-content;
    position: relative;
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

  .more-tooltip-content {
    max-width: 300px;
    text-overflow: ellipsis;
    width: fit-content;
    border-radius: 6px;
    padding: 10px 20px 10px 20px;
    text-align: left;
    background-color: rgb(var(--global-color-background-200));
    color: rgb(var(--global-color-background-950));
  }

  .more-tooltip-content ul {
    list-style: none;
    padding: 0;
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


  .form-container {
    border-radius: 10px;
    padding: 20px;
    height: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .multi-filters-container {
    display: grid;
    gap: 20px
  }

  .filter {
    display: flex;
    align-items: center;
  }

  .input {
    width: 100%;
  }

  .input .label {
    margin-bottom: 5px;
  }

  .footer {
    margin-top: 40px;
  }

  .footer .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-right: 20px;
  }

  .multi-filters-container .filter {
    grid-column: auto;
  }

  .multi-filters-container .filter.wide {
    grid-column: span 2;
  }

  .hidden {
    display: none;
  }

</style>