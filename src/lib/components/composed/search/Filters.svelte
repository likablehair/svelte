<script lang="ts" context="module">
  export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
  export type Column ={
    label: string,
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
  import type { DateMode, Filter, StringMode } from '$lib/utils/filters/filters';
  import SelectableVerticalList from '$lib/components/simple/lists/SelectableVerticalList.svelte';
  import SimpleTextField from '$lib/components/simple/forms/SimpleTextField.svelte';
  import Chip from '$lib/components/simple/navigation/Chip.svelte';
  import Checkbox from '$lib/components/simple/forms/Checkbox.svelte';
  import Converter, { DateModes, StringModes } from '$lib/utils/filters/filters';
  import DatePicker from '$lib/components/simple/dates/DatePicker.svelte';
  import type { Locale } from '$lib/components/simple/dates/utils';
  import DatePickerTextField from '$lib/components/simple/dates/DatePickerTextField.svelte';
    import Dropdown, { type Item } from '../forms/Dropdown.svelte';

  export let
    addFilterLabel: string = "Filters",
    counterFilterLabel: number = 0,
    filters: Filter[] = [{
      name:"customerName",
      label:"Customer Name",
      active:true,
      type:"string",
      column:"customerName",
      value: "",
      mode: 'ilike',
      advanced: false
    }, {
      name:"date",
      label:"Date",
      active:true,
      type:"date",
      column:"date",
      value: new Date(),
      secondValue: new Date(),
      mode: 'equal',
      advanced: true
    }],
    cancelFilterLabel : string = "Cancel",
    applyFilterLabel : string = "Apply Filter",
    openExtendAppliedFilterLabel: string= "Mostra filtri applicati",
    closeExtendAppliedFilterLabel: string = "Nascondi filtri applicati",
    extendAppliedFilterLabel: string = closeExtendAppliedFilterLabel,
    filterTitleLabel: string = "Filtra per ",
    dateLocale: Locale = 'it',
    betweenSeparator: string = "e"

  let calendarOpened: boolean = false,
    calendarOpened2: boolean = false,
    selectOpened: boolean = false

  let dispatch = createEventDispatcher<{
    'addFilterClick': undefined,
    'selectFilterClick': undefined,
  }>()

  let open: boolean = false,
    activator: HTMLElement,
    filterSlots: Filter  [] = [],
    showAppliedFilter : boolean = true


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


  let singleFilterActivator:  HTMLElement | undefined
  let singleFilterMenuOpened: boolean = false

  let selectedFilter : Filter | undefined = undefined
  $: selectedFilter = selected === undefined ? undefined : filters.find((f) => {return f.name === selected})

  function handleFilterSelection(e: CustomEvent) {
    singleFilterMenuOpened = true;
    selected = e.detail.element.name
  }

  function handleCancelFilterClick(e: CustomEvent) {
    open = false
    singleFilterMenuOpened = false;
  }

  function handleApplyFilterClick() {
    if(!!selectedFilter) {
      counterFilterLabel++;

      let newFilter: Filter = {...selectedFilter}

      if(!!advancedModeSelectedOptions) {
        if(newFilter.type == 'string') {
          newFilter.mode = advancedModeSelectedOptions[0].value as StringMode
        } else if(newFilter.type == 'date') {
          newFilter.mode = advancedModeSelectedOptions[0].value as DateMode
        }
      }

      filterSlots = [...filterSlots, newFilter]

      let filterConverter = new Converter()

      let builder = filterConverter.createBuilder({
        filters: filterSlots
      })

      open = false
      singleFilterMenuOpened = false;
    }
  }


  function handleAppliedFilterClick(){
    showAppliedFilter = !showAppliedFilter
    extendAppliedFilterLabel = !!showAppliedFilter ? closeExtendAppliedFilterLabel : openExtendAppliedFilterLabel
  }

  function handleRemoveFilter (index: number){
    filterSlots.splice(index, 1)
    filterSlots = filterSlots
  }


  let advancedModeOptions: Item[],
    advancedModeSelectedOptions: Item[] | undefined

  $: if(!!selectedFilter) {
    let modes
    if(selectedFilter.type == 'string') {
      modes = StringModes
    } else if(selectedFilter.type == 'date') {
      modes = DateModes
    }

    if(!!modes) {
      advancedModeOptions = modes.map(mode => {
        return {
          value: mode,
          label: mode
        }
      })
    }
  }

  $: if(!selectedFilter?.advanced) {
    advancedModeSelectedOptions = undefined
  }


  $: applyFilterDisabled = !selectedFilter || !selectedFilter.value || (selectedFilter.advanced && (!advancedModeSelectedOptions || advancedModeSelectedOptions.length === 0)) || (selectedFilter.type == 'date' && selectedFilter.advanced && selectedFilter.mode == 'between' && !selectedFilter.secondValue)

</script>

{#if filterSlots.length > 0}
  <div
    class="extend-filter-applyed"
    on:keypress={handleAppliedFilterClick}
    on:click={handleAppliedFilterClick}>
    {extendAppliedFilterLabel}
  </div>
{/if}
{#if showAppliedFilter}
<div class="filter-slots-container">
  {#each filterSlots as filterSlot, i}
      <div class="filter-slot">
        {#if !!filterSlot && filterSlot.type === "string" }
          <Chip label close on:close={() => handleRemoveFilter(i)}>
            <b> {filterSlot.label} </b>
            {filterSlot.mode}  <b>{filterSlot.value}</b>
          </Chip>
        {:else if !!filterSlot && filterSlot.type === "date"}
          <Chip label close on:close={() => handleRemoveFilter(i)}>
            <b> {filterSlot.label} </b>
            {filterSlot.mode}  <b>{filterSlot.value?.toLocaleDateString(dateLocale)}</b>
            {#if filterSlot.advanced && filterSlot.mode=="between"}
              {betweenSeparator} <b>{filterSlot.secondValue?.toLocaleDateString(dateLocale)}</b>
            {/if}
          </Chip>
        {/if}
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
    {addFilterLabel}  {#if filterSlots.length> 0 } ({counterFilterLabel}) {/if}
  </Button>

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
      bind:this={singleFilterActivator} >
      <SelectableVerticalList
        bind:selected
        bind:focused
        bind:elements={filterOptions}
        --selectable-vertical-list-default-width="100%"
        --selectable-vertical-list-default-element-height="56px"
        --selectable-vertical-list-default-title-font-size="null"
        on:select={handleFilterSelection}
      >
      </SelectableVerticalList>
    </div>
    </Menu>
    <Menu
      _width="350px"
      _borderRadius="10px"
      _boxShadow="rgb(var(--global-color-grey-900), .5) 0px 2px 4px"
      _overflow="unset"
      activator={singleFilterActivator}
      bind:open={singleFilterMenuOpened}
      anchor="right-center"
      closeOnClickOutside
      openingId="second-menu"
      flipOnOverflow
    >
      <div style:min-height="160px" on:click={() => { calendarOpened = false; calendarOpened2 = false; selectOpened = false }} on:keydown style:border-radius="10px" style:overflow="auto" style:height="100%" style:background-color="rgb(var(--global-color-background-200))" >
        <div class="filter-title">
            {filterTitleLabel} {selectedFilter?.label}
        </div>

        <div class="sub-filter-container">
          {#if !!selectedFilter && selectedFilter.advanced}
            <div class="advanced-mode">
              <div class="label">
                {selectedFilter.name[0].toUpperCase() + selectedFilter.name.slice(1)}
              </div>
              <div class="advaced-mode-selector" on:click|stopPropagation={() => {calendarOpened = false; calendarOpened2 = false}} on:keydown>
                <Dropdown
                  items={advancedModeOptions}
                  bind:values={advancedModeSelectedOptions}
                  bind:menuOpened={selectOpened}
                  on:change={() => { selectOpened = false }}
                ></Dropdown>
              </div>
            </div>
          {/if}

          {#if !!selectedFilter && (!selectedFilter.advanced || (!!advancedModeSelectedOptions && advancedModeSelectedOptions.length > 0))}
            {#if !!selectedFilter && selectedFilter.type === "string"}
              <SimpleTextField
                bind:value={selectedFilter.value}
                class={{ }}
                type="text"
                placeholder={selectedFilter?.label}
                appendInnerIcon="mdi-check"
              ></SimpleTextField>
            {:else if !!selectedFilter && selectedFilter.type === "date"}
              <div on:click|stopPropagation={() => {selectOpened = false}} on:keydown style:width="fit-content">
                <DatePickerTextField
                bind:selectedDate={selectedFilter.value}
                bind:menuOpened={calendarOpened}
                on:day-click={() => { calendarOpened = false }}
                ></DatePickerTextField>
              </div>
            {/if}
          {/if}

          {#if !!selectedFilter && selectedFilter.advanced && selectedFilter.type=='date' && (!!advancedModeSelectedOptions && advancedModeSelectedOptions.length > 0) && advancedModeSelectedOptions[0].value == 'between'}
            <div on:click|stopPropagation={() => {selectOpened = false}} on:keydown style:width="fit-content">
              <DatePickerTextField
              bind:selectedDate={selectedFilter.secondValue}
              bind:menuOpened={calendarOpened2}
              on:day-click={() => { calendarOpened2 = false }}
              ></DatePickerTextField>
            </div>
          {/if}
<!--
          {#if !!selectedFilter && selectedFilter.type === "choice"}
            {#each selectedFilter.options as option }
              <Checkbox /> {option}
            {/each}
          {/if} -->

          <div class="sub-filter-button">
            <Button
              --button-background-color="rgb(var(--global-color-background-200))"
              --button-color="rgb(var(--global-color-contrast-900))"
              on:click={handleCancelFilterClick}
            >
              {cancelFilterLabel}
            </Button>

            <Button
              --button-min-width="100px"
              on:click={handleApplyFilterClick}
              disabled={applyFilterDisabled}
            >
              {applyFilterLabel}

            </Button>
          </div>
        </div>
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

  .sub-filter-container {
    display: flex;
    flex-direction: column;
    align-items: left;
    gap:10px;
    margin: 5%;
  }

  .sub-filter-button {
    display: flex;
    column-gap: 10px;
    flex-direction: row;
    align-items: start;
    margin: 10px;
  }

  .filter-slots-container {
    display: flex;
    align-items: flex-start;
    column-gap: 10px;
  }

  .filter-slot {
    font-size: 0.70rem;
    font-weight: 0;
  }

  .extend-filter-applyed{
    left: 0;
    top:0;
    font-size: 0.7em;
  }
  .extend-filter-applyed:hover{
      cursor: pointer;
  }

  .advanced-mode {
    display: flex;
    gap: 10px;
    align-items: center;
  }

</style>