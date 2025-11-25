<script lang="ts" module>
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
  import { type ComponentProps, type Snippet } from 'svelte';
  import { ENGLISH_LABELS_MAPPER, isDateMode, isSelectMode, isStringMode, ITALIAN_LABELS_MAPPER, type DateMode, type Filter, type NumberMode, type SelectMode, type StringMode } from '$lib/utils/filters/filters';
  import SelectableVerticalList from '$lib/components/simple/lists/SelectableVerticalList.svelte';
  import Chip from '$lib/components/simple/navigation/Chip.svelte';
  import type { Locale } from '$lib/components/simple/dates/utils';
  import FilterEditor from './FilterEditor.svelte';
  import MobileFilterEditor from './MobileFilterEditor.svelte';
  import { fly } from 'svelte/transition';
  import Dialog from '$lib/components/simple/dialogs/Dialog.svelte';
  import Validator from '$lib/utils/filters/validator';
  import ToolTip from '../common/ToolTip.svelte';
  import { DateTime } from 'luxon';
  import type { KeyboardEventHandler, MouseEventHandler } from 'svelte/elements';
  import { TabSwitcher } from '$lib';

  interface Props {
    filters?: Filter[];
    lang?: 'it' | 'en';
    addFilterLabel?: string;
    cancelFilterLabel?: string;
    applyFilterLabel?: string;
    showActiveFilters?: boolean;
    filterTitleLabel?: string;
    dateLocale?: Locale;
    betweenSeparator?: string;
    trueString?: string;
    falseString?: string;
    editFilterMode?: 'one-edit' | 'multi-edit';
    labelsMapper?: LabelMapper;
    drawerSpace?: string
    multiEditTabs?: ComponentProps<typeof TabSwitcher>['tabs']
    onaddFilterClick?: () => void
    onapplyFilter?: () => void
    onremoveAllFilters?: () => void
    onremoveFilter?: (event: {
      detail: {
        filter: Filter
      }
    }) => void
    customSnippet?: Snippet<[{
      filter: Filter | undefined,
      updateFunction: typeof updateFunction,
      mAndDown: boolean
    }]>
    customChipSnippet?: Snippet<[{
      filter: Filter
    }]>
    appendSnippet?: Snippet<[]>
    contentSnippet?: Snippet<[{ 
      mAndDown: boolean,
      updateMultiFilterValues: typeof updateMultiFilterValues,
      handleRemoveAllFilters: typeof handleRemoveAllFilters,
      filters: Filter[]
    }]>
    onclick?: MouseEventHandler<HTMLDivElement>
    onkeydown?: KeyboardEventHandler<HTMLDivElement>
  }

  let {
    filters = $bindable([]),
    lang = 'en',
    addFilterLabel = lang === 'en' ? "Filters" : "Filtri",
    cancelFilterLabel = lang === 'en' ? "Cancel" : "Annulla",
    applyFilterLabel = lang === 'en' ? "Apply filters" : "Applica filtri",
    showActiveFilters = true,
    filterTitleLabel = lang === 'en' ? "Filter by" : "Filtra per",
    dateLocale = lang === 'en' ? 'en' : 'it',
    betweenSeparator = lang === 'en' ? "and" : "e",
    trueString = lang === 'en' ? "true" : "vero",
    falseString = lang === 'en' ? "false" : "falso",
    editFilterMode = 'one-edit',
    labelsMapper = lang === 'en'
      ? ENGLISH_LABELS_MAPPER
      : ITALIAN_LABELS_MAPPER,
    drawerSpace = '60vh',
    multiEditTabs,
    onaddFilterClick,
    onapplyFilter,
    onremoveAllFilters,
    onremoveFilter,
    customSnippet: customInternalSnippet,
    customChipSnippet,
    appendSnippet,
    contentSnippet,
    onclick: onclickInternal,
    onkeydown,
  }: Props = $props();

  let open: boolean = $state(false),
    mobileOpen: boolean = $state(false),
    activator: HTMLElement | undefined = $state(),
    localMultiEditTabs = $derived.by(() => {
      return filters.some(f => !multiEditTabs?.find(tab => tab.name == f.tabName)) 
        ? undefined 
        : multiEditTabs
    }),
    selectedTab: ComponentProps<typeof TabSwitcher>['selected'] = $state(),
    selectedTabFilters: Filter[] = $derived.by(() => {
      return selectedTab
        ? filters.filter(f => f.tabName == selectedTab)
        : filters
    })

  function handleAddFilterClick() {
    if(onaddFilterClick) {
      onaddFilterClick()
    }
    open = true
    mobileOpen = true
  }

  let filterOptions = $derived(filters.map((f) => {
    return {
      title: f.label,
      name: f.name
    }
  }))

  let deletableFilterOptions = $derived(filters.map((f) => {
    return {
      title: f.label,
      name: f.name,
      appendIcon: f.active ? 'mdi-delete' : undefined
    }
  }))

  let selected: ArrayElement<NonNullable<ComponentProps<typeof SelectableVerticalList>['elements']>>['name'] | undefined = $state()
  let focused: ArrayElement<NonNullable<ComponentProps<typeof SelectableVerticalList>['elements']>>['name'] | undefined = $state()
  $effect(() => {
    if(!!focused && !open) focused = undefined
  })

  let filterOpened: 'edit' | 'new' = $state('new')


  let filterOptionsListActivator: HTMLElement | undefined = $state()
  let singleFilterActivator:  HTMLElement | undefined = $state()
  let singleFilterMenuAnchor: 'right-center' | 'bottom-center' = $state('right-center')
  let singleFilterMenuOpened: boolean = $state(false)

  let selectedFilter : Filter | undefined = $state()
  let selectedFilterIndex = $derived(filters.findIndex((f) => { return f.name === selected }))
  $effect(() => {
    selectedFilter = selected === undefined ? undefined : filters[selectedFilterIndex]
  })


  function handleFilterSelection(e: Parameters<NonNullable<ComponentProps<typeof SelectableVerticalList>['onselect']>>[0], mobile: boolean = false) {
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
    selectedTmpFilter = undefined

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
      if(onapplyFilter) {
        onapplyFilter()
      }
    }
  }

  let activeFilters = $derived(filters.filter((f) => f.active))

  function handleRemoveFilter(filter: { name: string }) {
    let filterIndex = filters.findIndex((f) => f.name === filter.name)
    let filterName = filter.name
    filters[filterIndex].active = false
    if (tmpFilters[filterName]) {
      tmpFilters[filterName].active = false
    }
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
    filters = [...filters];
    if(onremoveFilter) {
      onremoveFilter({
        detail: {
          filter: filters[filterIndex]
        }
      })
    }
  }

  let activeFiltersActivators: Record<string, HTMLElement> = $state({})
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

  function handleDeleteIconClick(event: Parameters<NonNullable<ComponentProps<typeof SelectableVerticalList>['oniconClick']>>[0]) {
    let filterIndex = event.detail.index
    let name = filters[filterIndex].name
    handleRemoveFilter({name})
  }

  function handleRemoveAllFilters(event?: Parameters<NonNullable<ComponentProps<typeof Icon>['onclick']>>[0]) {
    if(!!event) event.stopPropagation()
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
    customToBeInitialized = true
    if(onremoveAllFilters) {
      onremoveAllFilters()
    }
  }

  function handleMultiEditApplyClick() {
    open = false
    mobileOpen = false
    if(onapplyFilter) {
      onapplyFilter()
    }
  }

  function handleMultiEditRemoveClick() {
    handleRemoveAllFilters()
    open = false
    mobileOpen = false
  }

  let selectedTmpFilter: Filter | undefined = $state()

  let tmpFilters: {[filterName: string]: Filter} = $state({})

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
      if(tmpFilter.type == 'date'){
        if(newValue.from){
          tmpFilter.from = DateTime.fromJSDate(newValue.from).setLocale('it-IT').startOf('day').toJSDate()
        }
        if(newValue.to){
          tmpFilter.to = DateTime.fromJSDate(newValue.to).setLocale('it-IT').endOf('day').toJSDate()
        }
      }
      else {
        tmpFilter.from = newValue.from
        tmpFilter.to = newValue.to
      }
    } else {
      tmpFilter.value = newValue
    }
    tmpFilter.active = newValid
  }

  let customToBeInitialized = true
  $effect(() => {
    if(customToBeInitialized && !!tmpFilters) initCustomTmpFilters()
  })

  function initCustomTmpFilters() {
    let customFilters = filters.filter(f => f.type === 'custom')
    for(const customFilter of customFilters) {
      if(!tmpFilters[customFilter.name]) {
        tmpFilters[customFilter.name] = { ...customFilter }
      }
    }
    customToBeInitialized = false
  }

  let customFilterApplyDisabled: boolean = $state(true)
  function updateFunction(filterName: string, newValue: any, newValid: boolean) {
    let tmpFilter = tmpFilters[filterName]
    if(!!tmpFilter && tmpFilter.type == 'custom') {
      tmpFilter.value = newValue
      tmpFilter.active = newValid
      selectedTmpFilter = {...tmpFilter}
      customFilterApplyDisabled = !newValid
    }
  }

  let moreItemsActivator: HTMLElement | undefined = $state()

  function onclick(event: MouseEvent & {
    currentTarget: EventTarget & HTMLDivElement;
  }, stopPropagation: boolean = false) {
    if(stopPropagation){
      event.stopPropagation()
    }
    if(onclickInternal) {
      onclickInternal(event)
    }
  }
</script>

<MediaQuery>
  {#snippet defaultSnippet({ mAndDown})}
    <div class="filters-wrapper" class:mobile={mAndDown} style:--filter-dot-size={activeFilters.length > 0 ? '16px' : '0px'} style:--filter-dot-content={activeFilters.length > 0 ? `"${activeFilters.length}"` : '""'}>
      <div class="filters-container" class:mobile={mAndDown} class:hidden={mAndDown && (!showActiveFilters || activeFilters.length == 0)}>
        {#if showActiveFilters}
          {#each activeFilters as filter}
            <div
              class="filter-slot"
              bind:this={activeFiltersActivators[filter.name]}
            >
              <Chip
                close
                --chip-border-radius="4px"
                --chip-default-gap="0px"
                onclose={() => handleRemoveFilter(filter)}
                onclick={() => handleActiveFilterClick(filter)}
              >
                {#if filter.type === 'custom'}
                  {@render customChipSnippet?.({ filter })}
                {:else}
                  <div class="chip-content">
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
                            <ul style:margin="0px">
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
                  </div>
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
              --button-border-radius='var(--filters-button-border-radius, var(--filters-default-button-border-radius))'
              --button-height="var(--filters-button-height, var(--filters-default-button-height))"
              onclick={handleAddFilterClick}
            >
              <div class="filter-button-content">
                <Icon name="mdi-filter"></Icon>
                {addFilterLabel}
                <div class="remove-filters" class:hidden={activeFilters.length <= 0}>
                  <Icon 
                    name="mdi-close-circle" 
                    onclick={handleRemoveAllFilters} 
                    --icon-hover-color="var(--chip-color, var(--chip-default-color))"
                  ></Icon>
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
            --button-hover-color="var(--chip-color, var(--chip-default-color))"
            --button-border-radius="var(--filters-button-border-radius, var(--filters-default-button-border-radius))"
            --button-height="var(--filters-button-height, var(--filters-default-button-height))"
            onclick={handleAddFilterClick}
          >
            <div class="filter-button-content">
              <Icon name="mdi-filter"></Icon>
              {addFilterLabel}
              <div class="remove-filters" class:hidden={activeFilters.length <= 0}>
                <Icon 
                  name="mdi-close-circle" 
                  onclick={handleRemoveAllFilters}
                  --icon-hover-color="var(--chip-color, var(--chip-default-color))"
                ></Icon>
              </div>
            </div>
          </Button>

        </div>
      {/if}
      {@render appendSnippet?.()}
    </div>
    {#if mAndDown}
      <Drawer
        bind:open={mobileOpen}
        position="bottom"
        onclose={() => {closeFilterMenu(200)}}
        _borderRadius="20px 20px 0px 0px"
        _space={drawerSpace}
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
                  onbackClick={handleMobileBackTap}
                  {lang}
                  {labelsMapper}
                  bind:tmpFilter={selectedTmpFilter}
                >
                  <!-- <div slot="title">
                    <div class="mobile-title">
                      {selectedFilter?.label}
                    </div>
                  </div> -->
                  {#snippet customSnippet({ filter })}
                    {@render customInternalSnippet?.({ filter, updateFunction, mAndDown})}
                  {/snippet}

                  {#snippet filterActionsSnippet({ applyFilterDisabled, filter })}
                    <div class="btn">
                      <Button
                        --button-width="100%"
                        --button-box-shadow="none"
                        --button-height="30px"
                        --button-padding="10px 0px 10px 0px"
                        --button-border-radius="10px 10px 0px 0px"
                        disabled={!filter || (filter.type === 'custom' ? customFilterApplyDisabled : applyFilterDisabled)}
                        onclick={handleApplyFilterClick}
                      >{applyFilterLabel}</Button>
                    </div>
                    <div class="btn">
                      <Button
                        --button-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                        --button-background-color="transparent"
                        --button-focus-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                        --button-active-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                        --button-hover-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                        --button-focus-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                        --button-active-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                        --button-hover-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                        --button-hover-box-shadow="none"
                        --button-box-shadow="none"
                        --button-width="100%"
                        --button-padding="10px 0px 10px 0px"      
                        --button-border-radius="0px 0px 0px 0px"
                        onclick={() => {mobileOpen = false; closeFilterMenu(200)}}
                      >{cancelFilterLabel}</Button>
                    </div>
                  {/snippet}
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
                  elements={deletableFilterOptions}
                  --selectable-vertical-list-default-width="100%"
                  --selectable-vertical-list-default-element-height="56px"
                  --selectable-vertical-list-default-title-font-size="null"
                  onselect={(e) => {handleFilterSelection(e, true)}}
                  centered
                  bicolor
                  appendIconSize="18pt"
                  oniconClick={handleDeleteIconClick}
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
                  <div>{addFilterLabel}</div>
                </div>
                <div class="drawer-body">
                  {#if contentSnippet}
                    {@render contentSnippet({ mAndDown, updateMultiFilterValues, filters, handleRemoveAllFilters })}
                  {:else}
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
                                filter={filters[i]}
                                {lang}
                                {labelsMapper}
                                editFilterMode="multi-edit"
                                bind:tmpFilter={tmpFilters[filter.name]}
                                mobile={mAndDown}
                                onchange={(e) => {
                                  if(!!e.detail.filter)
                                    filters[i] = e.detail.filter
                                }}
                              >
                                {#snippet customSnippet({ filter })}
                                  {@render customInternalSnippet?.({ filter, updateFunction, mAndDown })}
                                {/snippet}
                              </FilterEditor>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
                <div class="footer">
                  <div class="actions" style:padding-bottom={mAndDown ? '20px' : undefined}>
                    <Button
                      --button-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                      --button-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                      --button-hover-background-color="rgb(var(--global-color-primary-500))"
                      --button-hover-box-shadow="0 0 0.5rem rgba(0, 0, 0, 0.3)"
                      --button-box-shadow="none"
                      onclick={handleCancelFilterClick}
                    >
                      {cancelFilterLabel}
                    </Button>
                    <Button
                      --button-color="rgb(var(--global-color-primary-400))"
                      --button-background-color="transparent"
                      --button-hover-background-color="rgb(var(--global-color-primary-500))"
                      --button-hover-box-shadow="0 0 0.5rem rgba(0, 0, 0, 0.3)"
                      --button-box-shadow="none"
                      onclick={handleMultiEditRemoveClick}
                    >
                      {lang == 'en' ? "Remove filters" : "Rimuovi filtri"}
                    </Button>
                    <Button
                      --button-min-width="100px"
                      onclick={handleApplyMultiFilterClick}
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
          _maxHeight="var(--filters-one-edit-menu-max-height, var(--filters-default-one-edit-menu-max-height))"
          _borderRadius="5px"
          anchor="bottom"
          openingId="select-filter"
          flipOnOverflow
        >
          <div
            style:background-color="rgb(var(--global-color-background-200))"
            bind:this={filterOptionsListActivator}
            onclick={e => onclick(e, true)}
            {onkeydown}
            role="presentation"
            tabindex="-1"
          >
            <SelectableVerticalList
              bind:selected
              bind:focused
              elements={filterOptions}
              --selectable-vertical-list-default-width="100%"
              --selectable-vertical-list-default-element-height="56px"
              --selectable-vertical-list-default-title-font-size="null"
              onselect={handleFilterSelection}
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
            {onclick}
            {onkeydown}
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
                {#snippet customSnippet({ filter })}
                  {@render customInternalSnippet?.({ filter, updateFunction, mAndDown })}
                {/snippet}
                {#snippet filterActionsSnippet({ applyFilterDisabled, filter })}
                  <div class="sub-filter-button">
                    <Button
                      --button-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                      --button-background-color="transparent"
                      --button-focus-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                      --button-active-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                      --button-hover-background-color="var(--filters-button-cancel-background-color, var(--filters-button-cancel-default-background-color))"
                      --button-focus-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                      --button-active-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                      --button-hover-color="var(--filters-button-cancel-color, var(--filters-button-cancel-default-color))"
                      --button-hover-box-shadow="none"
                      --button-box-shadow="none"
                      --button-padding="12px 16px"
                      onclick={handleCancelFilterClick}
                    >
                      {cancelFilterLabel}
                    </Button>
                    <Button
                      --button-min-width="100px"
                      onclick={handleApplyFilterClick}
                      disabled={!filter || (filter.type === 'custom' ? customFilterApplyDisabled : applyFilterDisabled)}
                    >
                      {applyFilterLabel}

                    </Button>
                  </div>
                {/snippet}
              </FilterEditor>
            {/if}
          </div>
        </Menu>
      {:else if editFilterMode === 'multi-edit'}
        <Dialog
          bind:open={open}
          _overlayOpacity="50%"
          _overlayBackdropFilter="blur(4px)"
        >
          <div 
            class="form-container" 
            style:background-color={mAndDown ? 'transparent' : 'rgb(var(--global-color-background-100))'} 
            style:width={mAndDown ? '100%' : '800px'} 
            style:box-sizing="border-box"
          >
            <div class="header" class:no-border={localMultiEditTabs?.length}>
              <div>{addFilterLabel}</div>
            </div>
            <TabSwitcher
              tabs={localMultiEditTabs}
              bind:selected={selectedTab}
            ></TabSwitcher>
            <div class="dialog-body" class:shortened-body={localMultiEditTabs?.length}>
              {#if contentSnippet}
                {@render contentSnippet({ mAndDown, updateMultiFilterValues, filters, handleRemoveAllFilters })}
              {:else}
                <div class="multi-filters-container" style:grid-template-columns={mAndDown ? '1fr' : '1fr 1fr'}>
                  {#each selectedTabFilters as filter}
                    {@const i = filters.findIndex(f => f.name === filter.name)}
                    <div class="filter card" class:wide={filter.type === 'select' || filter.type === 'custom'}>
                      <div class="input">
                        {#if filter.type !== 'custom'}
                          <div class="card-title">
                            {#if filter.icon}
                            <span style:margin-right=2px>
                              <Icon name={filter.icon} --icon-color={filter.iconColor} --icon-size=15.5px />
                            </span>
                            {/if}
                            {filter.label}
                          </div>
                        {/if}
                        <div class="field">
                          <FilterEditor
                            filter={filters[i]}
                            {lang}
                            {labelsMapper}
                            editFilterMode="multi-edit"
                            bind:tmpFilter={tmpFilters[filter.name]}
                            mobile={mAndDown}
                            onchange={(e) => {
                              if(!!e.detail.filter)
                                filters[i] = e.detail.filter
                            }}
                          >
                            {#snippet customSnippet({ filter })}
                              {@render customInternalSnippet?.({ filter, updateFunction, mAndDown })}
                            {/snippet}
                          </FilterEditor>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
            <div class="dialog-footer">
              <div class="actions" style:padding-bottom={mAndDown ? '20px' : undefined}>
                <Button
                  --button-color="rgb(var(--global-color-contrast-900))"
                  --button-background-color="transparent"
                  --button-focus-background-color="rgb(var(--global-color-background-200, .5))"
                  --button-active-background-color="rgb(var(--global-color-background-200, .5))"
                  --button-hover-background-color="rgb(var(--global-color-background-200, .5))"
                  --button-focus-color="rgb(var(--global-color-contrast-900))"
                  --button-active-color="rgb(var(--global-color-contrast-900))"
                  --button-hover-color="rgb(var(--global-color-contrast-900))"
                  --button-hover-box-shadow="none"
                  --button-box-shadow="none"
                  --button-padding="12px 16px"
                  onclick={handleCancelFilterClick}
                >
                  {cancelFilterLabel}
                </Button>
                <Button
                  --button-color="rgb(var(--global-color-contrast-900))"
                  --button-background-color="transparent"
                  --button-focus-background-color="rgb(var(--global-color-background-200, .5))"
                  --button-active-background-color="rgb(var(--global-color-background-200, .5))"
                  --button-hover-background-color="rgb(var(--global-color-background-200, .5))"
                  --button-focus-color="rgb(var(--global-color-contrast-900))"
                  --button-active-color="rgb(var(--global-color-contrast-900))"
                  --button-hover-color="rgb(var(--global-color-contrast-900))"
                  --button-hover-box-shadow="none"
                  --button-box-shadow="none"
                  --button-padding="12px 16px"
                  onclick={handleMultiEditRemoveClick}
                >
                  {lang == 'en' ? "Remove filters" : "Rimuovi filtri"}
                </Button>
                <Button
                  --button-min-width="fit-content"
                  --button-padding="12px 16px"
                  onclick={handleApplyMultiFilterClick}
                >
                  {applyFilterLabel}
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      {/if}
    {/if}
  {/snippet}
</MediaQuery>


<style>
  * {
    box-sizing: border-box;
  }

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
    font-size: .5rem;
    background-color: rgb(var(--global-color-background-500));
    color: rgb(var(--global-color-contrast-700));
    position: absolute;
    box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
    top: -16%;
    right: -8%;
    border-radius: 100px;
    width: var(--filter-dot-size, 0px);
    line-height: 16px;
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
    gap: 8px;
    align-items: center;
  }

  .filters-container.mobile {
    flex-wrap: nowrap;
    overflow: scroll;
  }

  .filters-wrapper {
    display: flex;
    align-items: start;
    gap: 8px;
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
    line-height: var(--filters-button-height, var(--filters-default-button-height));
  }

  .drawer-content{
    height: 100%;
  }

  .more-items {
    position: relative;
    padding: 0px 4px;
    border-radius: 8px;
    margin-left: 2px;
    background-color: rgb(var(--global-color-grey-50));
    color: rgb(var(--global-color-primary-500));
    font-weight: 800;
    font-size: 11px;
    height: 20px;
    display: flex;
    align-items: center;
  }

  .more-tooltip-content {
    max-width: 300px;
    text-overflow: ellipsis;
    width: fit-content;
    border-radius: 6px;
    padding: 12px;
    text-align: middle;
    background-color: rgb(var(--global-color-background-200));
    color: rgb(var(--global-color-contrast-950), .7);
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
    box-shadow: 0 0 1px 1px rgb(var(--global-color-background-200));
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

  .card {
    background-color: var(--filters-card-background-color, var(--filters-default-card-background-color));
    border-radius: var(--filters-card-border-radius, var(--filters-default-card-border-radius));
    padding: var(--filters-card-padding, var(--filters-default-card-padding));
    box-shadow: var(--filters-card-box-shadow, var(--filters-default-card-box-shadow));
    border: var(--filters-card-border, var(--filters-default-card-border));
    display: flex;
    align-items: start;
  }

  .card:hover {
    box-shadow: var(--filters-card-hover-box-shadow, var(--filters-default-card-hover-box-shadow));
    transition: var(--filters-card-hover-transition, var(--filters-default-card-hover-transition));
  }
  .card-title {
    font-weight: var(--filters-card-title-font-weight, var(--filters-default-card-title-font-weight));
    font-size: var(--filters-card-title-font-size, var(--filters-default-card-title-font-size));
    color: var(--filters-card-title-color, var(--filters-default-card-title-color));
    margin-bottom: var(--filters-card-title-margin-bottom, var(--filters-default-card-title-margin-bottom));
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

  .header {
    font-weight: 600;
    font-size: 1.5rem;
    padding: 16px;
    height: 64px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgb(var(--global-color-background-200));
  }

  .no-border {
    border: none;
  }

  .drawer-body {
    padding: 16px;
  }

  .dialog-body {
    padding: 16px;
    height: calc(90vh - 164px);
    max-height: calc(90vh - 164px);
    overflow-y: auto;
  }

  .shortened-body {
    height: calc(90vh - 170px);
    max-height: calc(90vh - 170px);
  }

  .dialog-footer {
    height: 64px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-top: 1px solid rgb(var(--global-color-background-200));
  }

  .chip-content {
    display: flex;
    align-items: center;
    gap: 4px
  }
</style>