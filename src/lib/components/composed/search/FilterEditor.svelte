<script lang="ts">
  import type { Filter, NumberMode, SelectMode, StringMode } from "$lib/utils/filters/filters";
  import Dropdown, { type Item } from "../forms/Dropdown.svelte";
  import { GenericModes, SelectModes, StringModes } from '$lib/utils/filters/filters';
  import type { DateMode } from "$lib/utils/filters/filters";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DatePickerTextField from "$lib/components/composed/forms/DatePickerTextField.svelte";
  import Validator from "$lib/utils/filters/validator";
  import Autocomplete from "$lib/components/simple/forms/Autocomplete.svelte";
  import Checkbox from "$lib/components/simple/forms/Checkbox.svelte";
  import type { LabelMapper } from "./Filters.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import ToggleList from "$lib/components/composed/forms/ToggleList.svelte";
  import { createEventDispatcher } from "svelte";

  export let filter: Filter | undefined = undefined,
    lang: 'en' | 'it' = 'en',
    betweenFromLabel: string = lang == 'en' ? "From" : "Da",
    betweenToLabel: string = lang == 'en' ? "To" : "A",
    labelsMapper: LabelMapper,
    forceApplyValid: boolean = false,
    editFilterMode: 'one-edit' | 'multi-edit' = 'one-edit',
    tmpFilter: Filter | undefined = undefined,
    mobile: boolean = false;

  let advancedModeOptions: Item[],
    advancedModeSelectedOptions: Item[] | undefined

  function initTmpFilter() {
    tmpFilter = filter === undefined ? undefined : {...filter}
    if(!!tmpFilter && ['string', 'number', 'date', 'select'].includes(tmpFilter.type) && Object.keys(tmpFilter).includes('mode')) {
      //@ts-ignore
      if((tmpFilter.mode == 'between' && tmpFilter.from !== undefined && tmpFilter.to !== undefined) || tmpFilter.value !== undefined || (tmpFilter.type == 'select' && tmpFilter.values !== undefined && tmpFilter.values.length > 0)) {
        advancedModeSelectedOptions = [{
          //@ts-ignore
          value: tmpFilter.mode, label: labelsMapper[tmpFilter.mode].short || tmpFilter.mode
        }]
      }
    }
  }


  function closeDropDown() {
    dropdownOpened = false
  }

  $: if(!!filter) {
    initTmpFilter()
    closeDropDown()
  }

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
    } else if(tmpFilter.type == 'bool') {
      modes = undefined
    }

    if(!!modes) {
      advancedModeOptions = modes.map(mode => {
        return {
          value: mode,
          label: labelsMapper[mode].short || mode
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
    handleChangeValue()
  }

  $: applyFilterDisabled = !Validator.isValid(tmpFilter) && !forceApplyValid

  $: if(!!tmpFilter && tmpFilter.type == 'bool') {
    if(tmpFilter.value === undefined) {
      tmpFilter.value = false
    }
  }

  $: if(!!tmpFilter && tmpFilter.type == 'select') {
    if(tmpFilter.values === undefined) {
      tmpFilter.values = []
    }
  }

  const dispatch = createEventDispatcher<{
		change: Filter | undefined
	}>()
  
  function handleChangeValue() {       
   dispatch('change', tmpFilter)  
  }


</script>


{#if !!filter && !!tmpFilter}
  <div class="filter-editor" style:margin={editFilterMode === 'one-edit' ? '5%' : '0'}>
    {#if filter.advanced}
      <div class="advanced-mode">
        <div class="label">
          {filter.label[0].toUpperCase() + filter.label.slice(1)}
        </div>
        <div class="advaced-mode-selector" on:click|stopPropagation on:keypress role="presentation" tabindex="-1">
          <Dropdown
            items={advancedModeOptions}
            bind:values={advancedModeSelectedOptions}
            on:change={handleAdvancedModeSelection}
            bind:menuOpened={dropdownOpened}
            openingId="advanced-filter"
            mobileDrawer={mobile}
          ></Dropdown>
        </div>
      </div>
    {/if}

    <div class="fields" style:width="100%" on:click|stopPropagation on:keypress role="presentation" tabindex="-1">
      {#if !tmpFilter.advanced || (!!advancedModeSelectedOptions && advancedModeSelectedOptions.length > 0)}
        {#if tmpFilter.type === "string" }
          <SimpleTextField
            bind:value={tmpFilter.value}
            type="text"
            placeholder={editFilterMode == 'one-edit' ? tmpFilter?.label : undefined}
            --simple-textfield-width="100%"
            on:change={handleChangeValue}
          ></SimpleTextField>
        {:else if tmpFilter.type === "date" && tmpFilter.mode !== 'between'}
          <div>
            <DatePickerTextField
              bind:selectedDate={tmpFilter.value}
              openingId="advanced-filter"
              bind:menuOpened={calendarOpened}
              on:day-click={() => {calendarOpened = false}}
              --simple-textfield-width="100%"
              flipOnOverflow
              on:change={handleChangeValue}
            >
              <svelte:fragment slot="append-inner">
                <Icon
                  name="mdi-close-circle"
                  click
                  on:click={() => {
                    if(!!tmpFilter && tmpFilter.type === 'date' && tmpFilter.mode !== 'between') {
                      tmpFilter.value = undefined
                    }
                  }}
                ></Icon>
              </svelte:fragment>
            </DatePickerTextField>
          </div>
        {:else if tmpFilter.type === "number" && tmpFilter.mode !== 'between'}
          <div>
            <SimpleTextField
              bind:value={tmpFilter.value}
              type="number"
              placeholder={editFilterMode == 'one-edit' ? tmpFilter?.label : undefined}
              --simple-textfield-width="100%"
              on:change={handleChangeValue}
            ></SimpleTextField>
          </div>
        {:else if tmpFilter.type === "select" && (tmpFilter.view === undefined || tmpFilter.view === 'autocomplete')}
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
              mobileDrawer={mobile}
              on:change={handleChangeValue}
            ></Autocomplete>
          </div>
        {:else if tmpFilter.type === "select" && (tmpFilter.view === 'toggle')}
          <div
            style:width="100%"
          >
            <ToggleList
              bind:values={tmpFilter.values}
              items={tmpFilter.items}
              multiple
            ></ToggleList>
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
              on:change={handleChangeValue}
            >
              <svelte:fragment slot="append-inner">
                <Icon
                  name="mdi-close-circle"
                  click
                  on:click={() => {
                    if(!!tmpFilter && tmpFilter.type === 'date' && tmpFilter.mode === 'between') {
                      tmpFilter.from = undefined
                    }
                  }}
                ></Icon>
              </svelte:fragment>
            </DatePickerTextField>
          </div>
          <div>
            <DatePickerTextField
              bind:selectedDate={tmpFilter.to}
              openingId="advanced-filter"
              placeholder={betweenToLabel}
              bind:menuOpened={calendarOpened2}
              on:day-click={() => {calendarOpened2 = false}}
              --simple-textfield-width="100%"
              flipOnOverflow
              on:change={handleChangeValue}
            >
              <svelte:fragment slot="append-inner">
                <Icon
                  name="mdi-close-circle"
                  click
                  on:click={() => {
                    if(!!tmpFilter && tmpFilter.type === 'date' && tmpFilter.mode === 'between') {
                      tmpFilter.to = undefined
                    }
                  }}
                ></Icon>
              </svelte:fragment>
            </DatePickerTextField>
          </div>
        {:else if tmpFilter.type === "number" && tmpFilter.mode === 'between'}
          <div>
            <SimpleTextField
              bind:value={tmpFilter.from}
              type="number"
              placeholder={betweenFromLabel}
              --simple-textfield-width="100%"
              on:change={handleChangeValue}
            ></SimpleTextField>
          </div>
          <div>
            <SimpleTextField
              bind:value={tmpFilter.to}
              type="number"
              placeholder={betweenToLabel}
              --simple-textfield-width="100%"
              on:change={handleChangeValue}
            ></SimpleTextField>
          </div>
        {:else if tmpFilter.type == 'bool'}
          <div class="bool-filter">
            <Checkbox
              bind:value={tmpFilter.value}
              on:change={handleChangeValue}
            ></Checkbox>
            <span style:margin-left="10px">
              {tmpFilter.description}
            </span>
          </div>
        {:else if tmpFilter.type == 'custom'}
          <slot name="custom" filter={tmpFilter}></slot>
        {/if}
      {/if}
    </div>
    <slot name="filter-actions" {applyFilterDisabled} filter={tmpFilter}></slot>
  </div>
{/if}

<style>
  .filter-editor {
    display: flex;
    flex-direction: column;
    align-items: left;
    gap:10px;
  }

  .advanced-mode {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .label {
    max-width: 200px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

</style>