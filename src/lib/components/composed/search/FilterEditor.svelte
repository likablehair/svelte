<script lang="ts">
  import type { Filter, NumberMode, SelectMode, StringMode } from "$lib/utils/filters/filters";
  import Dropdown, { type Item } from "../forms/Dropdown.svelte";
  import { GenericModes, SelectModes, StringModes } from '$lib/utils/filters/filters';
  import type { DateMode } from "$lib/utils/filters/filters";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DatePickerTextField from "$lib/components/simple/dates/DatePickerTextField.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import { createEventDispatcher } from "svelte";
  import Validator from "$lib/utils/filters/validator";
    import Autocomplete from "$lib/components/simple/forms/Autocomplete.svelte";

  export let filter: Filter | undefined = undefined,
    cancelFilterLabel : string = "Cancel",
    applyFilterLabel : string = "Apply Filter",
    betweenFromLabel: string = "From",
    betweenToLabel: string = "To"


  let tmpFilter: Filter | undefined

  function initTmpFilter() {
    tmpFilter = structuredClone(filter)
  }

  function closeDropDown() {
    dropdownOpened = false
  }

  $: if(!!filter) {
    initTmpFilter()
    closeDropDown()
  }

  let dispatch = createEventDispatcher<{
    'apply': undefined,
    'cancel': undefined
  }>()

  function handleCancelFilterClick(e: CustomEvent) {
    dispatch('cancel')
  }

  function handleApplyFilterClick() {
    if(!!filter && !!tmpFilter) {
      filter = structuredClone(tmpFilter)
      filter.active = true
      dispatch('apply')
    }
  }


  let advancedModeOptions: Item[],
    advancedModeSelectedOptions: Item[] | undefined

  $: if(!!tmpFilter) {
    let modes
    if(tmpFilter.type == 'string') {
      modes = StringModes
    } else if(tmpFilter.type == 'date') {
      modes = GenericModes
    } else if(tmpFilter.type == 'number') {
      modes = GenericModes
    } else if(tmpFilter.type == 'select') {
      modes = SelectModes
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

  $: if(!tmpFilter?.advanced) {
    advancedModeSelectedOptions = undefined
  }

  let dropdownOpened: boolean = false,
    calendarOpened: boolean = false,
    calendarOpened2: boolean = false

  // TODO I don't like that there is a singlo dropdow to handle all filter advance mode.
  // In some case would be necessary to handle more than one selection and this code
  // could become non sense
  function handleAdvancedModeSelection() {
    if(!!advancedModeSelectedOptions && advancedModeSelectedOptions.length > 0 && !!tmpFilter) {
      if(tmpFilter.type == 'date') tmpFilter.mode = advancedModeSelectedOptions[0].value as DateMode
      else if(tmpFilter.type == 'number') tmpFilter.mode = advancedModeSelectedOptions[0].value as NumberMode
      else if(tmpFilter.type == 'string') tmpFilter.mode = advancedModeSelectedOptions[0].value as StringMode
      else if(tmpFilter.type == 'select') tmpFilter.mode = advancedModeSelectedOptions[0].value as SelectMode
    }

    dropdownOpened = false;
  }

  $: applyFilterDisabled = !Validator.isValid(tmpFilter)



</script>


{#if !!filter && !!tmpFilter}
  <div class="filter-editor">
    {#if filter.advanced}
      <div class="advanced-mode">
        <div class="label">
          {filter.name[0].toUpperCase() + filter.name.slice(1)}
        </div>
        <div class="advaced-mode-selector" on:click|stopPropagation on:keypress>
          <Dropdown
            items={advancedModeOptions}
            bind:values={advancedModeSelectedOptions}
            on:change={handleAdvancedModeSelection}
            bind:menuOpened={dropdownOpened}
            openingId="advanced-filter"
          ></Dropdown>
        </div>
      </div>
    {/if}

    <div class="fields" style:width="100%" on:click|stopPropagation on:keypress>
      {#if !tmpFilter.advanced || (!!advancedModeSelectedOptions && advancedModeSelectedOptions.length > 0)}
        {#if tmpFilter.type === "string" }
          <SimpleTextField
            bind:value={tmpFilter.value}
            type="text"
            placeholder={tmpFilter?.label}
            --simple-textfield-width="100%"
          ></SimpleTextField>
        {:else if tmpFilter.type === "date" && tmpFilter.mode !== 'between'}
          <div>
            <DatePickerTextField
              bind:selectedDate={tmpFilter.value}
              openingId="advanced-filter"
              bind:menuOpened={calendarOpened}
              on:day-click={() => {calendarOpened = false}}
              --simple-textfield-width="100%"
            ></DatePickerTextField>
          </div>
        {:else if tmpFilter.type === "number" && tmpFilter.mode !== 'between'}
          <div>
            <SimpleTextField
              bind:value={tmpFilter.value}
              type="number"
              placeholder={tmpFilter?.label}
              --simple-textfield-width="100%"
            ></SimpleTextField>
          </div>
        {:else if tmpFilter.type === "select"}
          <div
            style:width="100%"
          >
            <Autocomplete
              bind:values={tmpFilter.values}
              items={tmpFilter.items}
              multiple
              maxVisibleChips={2}
              --simple-textfield-width="0px"
              --simple-text-field-margin-left="0px"
            ></Autocomplete>
          </div>
        {:else if tmpFilter.type === "date" && tmpFilter.mode === 'between'}
          <div>
            <DatePickerTextField
              bind:selectedDate={tmpFilter.from}
              openingId="advanced-filter"
              placeholder={betweenFromLabel}
              bind:menuOpened={calendarOpened}
              on:day-click={() => {calendarOpened = false}}
              --simple-textfield-width="100%"
            ></DatePickerTextField>
          </div>
          <div>
            <DatePickerTextField
              bind:selectedDate={tmpFilter.to}
              openingId="advanced-filter"
              placeholder={betweenToLabel}
              bind:menuOpened={calendarOpened2}
              on:day-click={() => {calendarOpened2 = false}}
              --simple-textfield-width="100%"
            ></DatePickerTextField>
          </div>
        {:else if tmpFilter.type === "number" && tmpFilter.mode === 'between'}
          <div>
            <SimpleTextField
              bind:value={tmpFilter.from}
              type="number"
              placeholder={betweenFromLabel}
              --simple-textfield-width="100%"
            ></SimpleTextField>
          </div>
          <div>
            <SimpleTextField
              bind:value={tmpFilter.to}
              type="number"
              placeholder={betweenToLabel}
              --simple-textfield-width="100%"
            ></SimpleTextField>
          </div>
        {/if}
      {/if}
    </div>

    <div class="sub-filter-button">
      <Button
        --button-background-color="transparent"
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
        disabled={applyFilterDisabled}
      >
        {applyFilterLabel}

      </Button>
    </div>
  </div>
{/if}

<style>
  .filter-editor {
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
    margin-top: 10px;
  }

  .advanced-mode {
    display: flex;
    gap: 10px;
    align-items: center;
  }
</style>