<script lang="ts">
  import type { Filter, NumberMode, SelectMode, StringMode } from "$lib/utils/filters/filters";
  import Dropdown from "../forms/Dropdown.svelte";
  import { GENERIC_MODES, SELECT_MODES, STRING_MODES } from '$lib/utils/filters/filters';
  import type { DateMode } from "$lib/utils/filters/filters";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DatePickerTextField from "$lib/components/composed/forms/DatePickerTextField.svelte";
  import Validator from "$lib/utils/filters/validator";
  import Autocomplete, { type Item } from "$lib/components/simple/forms/Autocomplete.svelte";
  import Checkbox from "$lib/components/simple/forms/Checkbox.svelte";
  import type { LabelMapper } from "./Filters.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import ToggleList from "$lib/components/composed/forms/ToggleList.svelte";
  import type { KeyboardEventHandler, MouseEventHandler } from "svelte/elements";
  import { tick, type Snippet } from "svelte";

  interface Props {
    filter?: Filter;
    lang?: 'en' | 'it';
    betweenFromLabel?: string;
    betweenToLabel?: string;
    labelsMapper: LabelMapper;
    forceApplyValid?: boolean;
    editFilterMode?: 'one-edit' | 'multi-edit';
    tmpFilter?: Filter;
    mobile?: boolean;
    onchange?: (event:{
      detail: {
        filter: Filter | undefined,
        tmpFilter: Filter | undefined
      }
    }) => void
    onclick?: MouseEventHandler<HTMLDivElement>
    onkeypress?: KeyboardEventHandler<HTMLDivElement>
    customSnippet?: Snippet<[{
      filter: typeof tmpFilter
    }]>
    filterActionsSnippet?: Snippet<[{
      applyFilterDisabled: typeof applyFilterDisabled,
      filter: typeof tmpFilter
    }]>
  }

  let {
    filter = $bindable(),
    lang = 'en',
    betweenFromLabel = lang === 'en' ? "From" : "Da",
    betweenToLabel = lang === 'en' ? "To" : "A",
    labelsMapper,
    forceApplyValid = false,
    editFilterMode = 'one-edit',
    tmpFilter = $bindable(),
    mobile = false,
    onchange,
    onclick: onclickInternal,
    onkeypress,
    customSnippet,
    filterActionsSnippet,
  }: Props = $props();

  let advancedModeOptions: Item[] | undefined = $state(),
    advancedModeSelectedOptions: Item[] = $state([])

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

  $effect(() => {
    if(!!filter && !tmpFilter) {
      tick().then(() => {
        initTmpFilter();
        closeDropDown();
      });
    }
  }) 

  $effect(() => {
    if(!!tmpFilter) {
      let modes
      if(tmpFilter.type == 'string') {
        modes = STRING_MODES
      } else if(tmpFilter.type == 'date') {
        modes = GENERIC_MODES
      } else if(tmpFilter.type == 'number') {
        modes = GENERIC_MODES
      } else if(tmpFilter.type == 'select') {
        modes = SELECT_MODES
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
  }) 

  $effect(() => {
    if(!tmpFilter?.advanced) {
      advancedModeSelectedOptions = []
    }
  }) 

  let dropdownOpened: boolean = $state(false),
    calendarOpened: boolean = $state(false),
    calendarOpened2: boolean = $state(false)

  // TODO I don't like that there is a singlo dropdow to handle all filter advance mode.
  // In some case would be necessary to handle more than one selection and this code
  // could become non sense
  function handleAdvancedModeSelection() {
    if(advancedModeSelectedOptions.length > 0 && !!tmpFilter) {
      if(tmpFilter.type == 'date') tmpFilter.mode = advancedModeSelectedOptions[0].value as DateMode
      else if(tmpFilter.type == 'number') tmpFilter.mode = advancedModeSelectedOptions[0].value as NumberMode
      else if(tmpFilter.type == 'string') tmpFilter.mode = advancedModeSelectedOptions[0].value as StringMode
      else if(tmpFilter.type == 'select') tmpFilter.mode = advancedModeSelectedOptions[0].value as SelectMode
    }

    dropdownOpened = false;
    handleChangeValue()
  }

  let applyFilterDisabled = $derived(!Validator.isValid(tmpFilter) && !forceApplyValid)

  $effect.pre(() => {
    if(!!tmpFilter && tmpFilter.type == 'bool') {
      if(tmpFilter.value === undefined) {
        tmpFilter.value = false
      }
    }
  })

  $effect.pre(() => {
    if(!!tmpFilter && tmpFilter.type == 'select') {
      if(tmpFilter.values === undefined) {
        tmpFilter.values = []
      }
    }
  })
  
  function handleChangeValue() {  
    calendarOpened = false   
    if(onchange) {
      onchange({
        detail: {
          filter,
          tmpFilter
        }
      })
    }
  }

  function onclick(event: MouseEvent & {
    currentTarget: EventTarget & HTMLDivElement;
  }) {
    event.stopPropagation()
    if(onclickInternal) {
      onclickInternal(event)
    }
  }
</script>


{#if !!filter && !!tmpFilter}
  <div class="filter-editor" style:margin={editFilterMode === 'one-edit' ? '5%' : '0'}>
    {#if filter.advanced}
      <div class="advanced-mode">
        <div class="label">
          {filter.label[0].toUpperCase() + filter.label.slice(1)}
        </div>
        <div class="advaced-mode-selector" {onclick} {onkeypress} role="presentation" tabindex="-1">
          <Dropdown
            items={advancedModeOptions}
            bind:values={advancedModeSelectedOptions}
            onchange={handleAdvancedModeSelection}
            bind:menuOpened={dropdownOpened}
            openingId="advanced-filter"
            mobileDrawer={mobile}
            {lang}
          ></Dropdown>
        </div>
      </div>
    {/if}

    <div class="fields" style:width="100%" {onclick} {onkeypress} role="presentation" tabindex="-1">
      {#if !tmpFilter.advanced || (advancedModeSelectedOptions.length > 0)}
        {#if tmpFilter.type === "string" }
          <SimpleTextField
            bind:value={tmpFilter.value}
            type="text"
            placeholder={editFilterMode == 'one-edit' ? tmpFilter?.label : undefined}
            --simple-textfield-width="100%"
            oninput={handleChangeValue}
          ></SimpleTextField>
        {:else if tmpFilter.type === "date" && tmpFilter.mode !== 'between'}
          <div>
            <DatePickerTextField
              bind:selectedDate={tmpFilter.value}
              openingId="advanced-filter"
              bind:menuOpened={calendarOpened}
              --simple-textfield-width="100%"
              flipOnOverflow
              oninput={handleChangeValue}
              ondayClick={handleChangeValue}
            >
              {#snippet appendInnerSnippet()}
                <Icon
                  name="mdi-close-circle"
                  onclick={() => {
                    if(!!tmpFilter && tmpFilter.type === 'date' && tmpFilter.mode !== 'between') {
                      tmpFilter.value = undefined
                    }
                  }}
                ></Icon>
              {/snippet}
            </DatePickerTextField>
          </div>
        {:else if tmpFilter.type === "number" && tmpFilter.mode !== 'between'}
          <div>
            <SimpleTextField
              bind:value={tmpFilter.value}
              type="number"
              placeholder={editFilterMode == 'one-edit' ? tmpFilter?.label : undefined}
              --simple-textfield-width="100%"
              onchange={handleChangeValue}
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
              --autocomplete-default-border-radius='4px'
              --autocomplete-min-height="0px"
              --chip-min-height="12px"
              mobileDrawer={mobile}
              onchange={handleChangeValue}
              placeholder={editFilterMode == 'one-edit' ? tmpFilter?.label : undefined}
              minWidth={''}
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
              onchange={handleChangeValue}
            ></ToggleList>
          </div>
        {:else if tmpFilter.type === "date" && tmpFilter.mode === 'between'}
          <div>
            <DatePickerTextField
              bind:selectedDate={tmpFilter.from}
              openingId="advanced-filter"
              placeholder={betweenFromLabel}
              bind:menuOpened={calendarOpened}
              --simple-textfield-width="100%"
              oninput={handleChangeValue}
              ondayClick={handleChangeValue}
            >
              {#snippet appendInnerSnippet()}
                <Icon
                  name="mdi-close-circle"
                  onclick={() => {
                    if(!!tmpFilter && tmpFilter.type === 'date' && tmpFilter.mode === 'between') {
                      tmpFilter.from = undefined
                    }
                  }}
                ></Icon>
              {/snippet}
            </DatePickerTextField>
          </div>
          <div>
            <DatePickerTextField
              bind:selectedDate={tmpFilter.to}
              openingId="advanced-filter"
              placeholder={betweenToLabel}
              bind:menuOpened={calendarOpened2}
              --simple-textfield-width="100%"
              flipOnOverflow
              oninput={handleChangeValue}
              ondayClick={handleChangeValue}
            >
              {#snippet appendInnerSnippet()}
                <Icon
                  name="mdi-close-circle"
                  onclick={() => {
                    if(!!tmpFilter && tmpFilter.type === 'date' && tmpFilter.mode === 'between') {
                      tmpFilter.to = undefined
                    }
                  }}
                ></Icon>
              {/snippet}
            </DatePickerTextField>
          </div>
        {:else if tmpFilter.type === "number" && tmpFilter.mode === 'between'}
          <div>
            <SimpleTextField
              bind:value={tmpFilter.from}
              type="number"
              placeholder={betweenFromLabel}
              --simple-textfield-width="100%"
              onchange={handleChangeValue}
            ></SimpleTextField>
          </div>
          <div>
            <SimpleTextField
              bind:value={tmpFilter.to}
              type="number"
              placeholder={betweenToLabel}
              --simple-textfield-width="100%"
              onchange={handleChangeValue}
            ></SimpleTextField>
          </div>
        {:else if tmpFilter.type == 'bool'}
          <div class="bool-filter">
            <Checkbox
              bind:value={tmpFilter.value}
              onchange={handleChangeValue}
            ></Checkbox>
            <span style:margin-left="10px">
              {tmpFilter.description}
            </span>
          </div>
        {:else if tmpFilter.type == 'custom'}
          {@render customSnippet?.({ filter: tmpFilter })}
        {/if}
      {/if}
    </div>
    {@render filterActionsSnippet?.({ applyFilterDisabled, filter: tmpFilter })}
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