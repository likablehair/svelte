<script lang="ts">
  import type { Filter } from "$lib/utils/filters/filters";
  import Dropdown, { type Item } from "../forms/Dropdown.svelte";
  import { DateModes, StringModes } from '$lib/utils/filters/filters';
  import type { DateMode } from "$lib/utils/filters/filters";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DatePickerTextField from "$lib/components/simple/dates/DatePickerTextField.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import { createEventDispatcher } from "svelte";
  import Validator from "$lib/utils/filters/validator";

  export let filter: Filter | undefined = undefined,
    cancelFilterLabel : string = "Cancel",
    applyFilterLabel : string = "Apply Filter"

  let dispatch = createEventDispatcher<{
    'apply': undefined,
    'cancel': undefined
  }>()

  function handleCancelFilterClick(e: CustomEvent) {
    dispatch('cancel')
  }

  function handleApplyFilterClick() {
    if(!!filter) {
      filter.active = true
      dispatch('apply')
    }
  }


  let advancedModeOptions: Item[],
    advancedModeSelectedOptions: Item[] | undefined

  $: if(!!filter) {
    let modes
    if(filter.type == 'string') {
      modes = StringModes
    } else if(filter.type == 'date') {
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

  $: if(!filter?.advanced) {
    advancedModeSelectedOptions = undefined
  }

  let dropdownOpened: boolean = false,
    calendarOpened: boolean = false,
    calendarOpened2: boolean = false

  // TODO I don't like that there is a singlo dropdow to handle all filter advance mode.
  // In some case would be necessary to handle more than one selection and this code
  // could become non sense
  function handleAdvancedModeSelection() {
    if(!!advancedModeSelectedOptions && advancedModeSelectedOptions.length > 0 && !!filter) {
      if(filter.type == 'date') filter.mode = advancedModeSelectedOptions[0].value as DateMode
    }

    dropdownOpened = false;
  }

  $: applyFilterDisabled = !Validator.isValid(filter)
</script>


{#if !!filter}
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

    <div class="fields" style:width="fit-content" on:click|stopPropagation on:keypress>
      {#if !filter.advanced || (!!advancedModeSelectedOptions && advancedModeSelectedOptions.length > 0)}
        {#if filter.type === "string" }
          <SimpleTextField
            bind:value={filter.value}
            type="text"
            placeholder={filter?.label}
            --simple-textfield-width="100%"
          ></SimpleTextField>
        {:else if filter.type === "date" && filter.mode !== 'between'}
          <div
            style:width="fit-content"
          >
            <DatePickerTextField
              bind:selectedDate={filter.value}
              openingId="advanced-filter"
              bind:menuOpened={calendarOpened}
              on:day-click={() => {calendarOpened = false}}
            ></DatePickerTextField>
          </div>
        {:else if filter.type === "date" && filter.mode === 'between'}
          <div
            style:width="fit-content"
          >
            <DatePickerTextField
              bind:selectedDate={filter.from}
              openingId="advanced-filter"
              placeholder="Dalla data"
              bind:menuOpened={calendarOpened}
              on:day-click={() => {calendarOpened = false}}
            ></DatePickerTextField>
          </div>
          <div style:width="fit-content">
            <DatePickerTextField
              bind:selectedDate={filter.to}
              openingId="advanced-filter"
              placeholder="Alla data"
              bind:menuOpened={calendarOpened2}
              on:day-click={() => {calendarOpened2 = false}}
            ></DatePickerTextField>
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