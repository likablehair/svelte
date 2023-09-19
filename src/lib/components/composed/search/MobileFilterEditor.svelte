<script lang="ts">
  import type { Filter, NumberMode, SelectMode, StringMode } from "$lib/utils/filters/filters";
  import { GenericModes, SelectModes, StringModes } from '$lib/utils/filters/filters';
  import type { DateMode } from "$lib/utils/filters/filters";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DatePickerTextField from "$lib/components/simple/dates/DatePickerTextField.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import { createEventDispatcher } from "svelte";
  import Validator from "$lib/utils/filters/validator";
  import SelectableVerticalList, { type Element } from "$lib/components/simple/lists/SelectableVerticalList.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { fly } from "svelte/transition";
    import Autocomplete from "$lib/components/simple/forms/Autocomplete.svelte";
    import Checkbox from "$lib/components/simple/forms/Checkbox.svelte";

  export let filter: Filter | undefined = undefined,
    cancelFilterLabel : string = "Cancel",
    applyFilterLabel : string = "Apply Filter",
    backIcon: string = "mdi-arrow-left",
    betweenFromLabel: string = "From",
    betweenToLabel: string = "To"

  let dispatch = createEventDispatcher<{
    'apply': undefined,
    'backClick': undefined,
    'cancelClick': undefined
  }>()

  function handleApplyFilterClick() {
    if(!!filter && !!tmpFilter) {
      filter = structuredClone(tmpFilter)
      filter.active = true
      dispatch('apply')
    }
  }

  let step: 'advanced' | 'editor'

  let tmpFilter: Filter | undefined

  function initTmpFilter() {
    tmpFilter = structuredClone(filter)
    if(!!tmpFilter && tmpFilter.advanced) {
      step = 'advanced'
    } else {
      step = "editor"
    }
  }

  $: if(!!filter) {
    initTmpFilter()
  }


  let advancedModeOptions: Element[],
    advancedModeSelectedOption: string | undefined

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
          title: mode,
          name: mode
        }
      })
    }
  }

  $: if(!tmpFilter?.advanced) {
    advancedModeSelectedOption = undefined
  }

  let calendarOpened: boolean = false,
    calendarOpened2: boolean = false

  // TODO I don't like that there is a singlo dropdow to handle all filter advance mode.
  // In some case would be necessary to handle more than one selection and this code
  // could become non sense
  function handleAdvancedModeSelection() {
    if(!!advancedModeSelectedOption && !!tmpFilter) {
      if(tmpFilter.type == 'date') tmpFilter.mode = advancedModeSelectedOption as DateMode
      else if(tmpFilter.type == 'string') tmpFilter.mode = advancedModeSelectedOption as StringMode
      else if(tmpFilter.type == 'number') tmpFilter.mode = advancedModeSelectedOption as NumberMode
      else if(tmpFilter.type == 'select') tmpFilter.mode = advancedModeSelectedOption as SelectMode

      step = 'editor'
      canRenderOptions = false
    }
  }

  let canRenderOptions: boolean = true


  $: applyFilterDisabled = !Validator.isValid(tmpFilter)

  function handleModeBackClick() {
    dispatch('backClick')
  }

  function handleEditorBackCLick() {
    if(!!tmpFilter && !tmpFilter.advanced) {
      dispatch('backClick')
    } else {
      step = 'advanced'
      advancedModeSelectedOption = undefined
      setTimeout(() => {
        canRenderOptions = true
      }, 100)
    }
  }

  $: if(!!tmpFilter && tmpFilter.type == 'date' && tmpFilter.mode == 'between') {
    if(!tmpFilter.from) tmpFilter.from = new Date()
    if(!tmpFilter.to) tmpFilter.to = new Date()
  }

  function handleCancelClick() {
    dispatch('cancelClick')
  }


  $: if(!!tmpFilter && tmpFilter.type == 'bool') {
    if(tmpFilter.value === undefined) {
      tmpFilter.value = false
    }
  }

</script>

<div class="container">
  {#if !!filter && !!tmpFilter}
    <div class="header" on:click={step=="advanced" ? handleModeBackClick : handleEditorBackCLick} on:keypress>
      <div class="back-link">
        <Icon
        name={backIcon}
        ></Icon>
      </div>
      <div class="title">
        <slot name="title"></slot>
      </div>
    </div>
    <div class="filter-editor">
      {#if tmpFilter.advanced && step == 'advanced' && canRenderOptions}
        <div class="advanced-mode" in:fly={{delay: 100, x: 200, duration: 100}} out:fly={{x: -200, duration: 100}}>
          <div class="advanced-mode-selector" on:click|stopPropagation on:keypress>
            <SelectableVerticalList
              bind:selected={advancedModeSelectedOption}
              bind:elements={advancedModeOptions}
              --selectable-vertical-list-default-width="100%"
              --selectable-vertical-list-default-element-height="56px"
              --selectable-vertical-list-default-title-font-size="null"
              on:select={handleAdvancedModeSelection}
              centered
              bicolor
            ></SelectableVerticalList>
          </div>
        </div>
      {:else if step == 'editor' && (!tmpFilter.advanced || !!advancedModeSelectedOption)}
        <div class="editor" in:fly={{delay: 100, x: 200, duration: 100}} out:fly={{x: -200, duration: 100}}>
          <div class="fields-container">
            <div class="fields"
              on:click|stopPropagation
              on:keypress
            >
              {#if tmpFilter.type === "string" }
                <SimpleTextField
                  bind:value={tmpFilter.value}
                  type="text"
                  placeholder={tmpFilter?.label}
                  --simple-textfield-width="100%"
                ></SimpleTextField>
              {:else if tmpFilter.type === "date" && tmpFilter.mode !== 'between'}
                <div style:width="100%">
                  <div>
                    <DatePickerTextField
                      bind:selectedDate={tmpFilter.value}
                      openingId="advanced-filter"
                      bind:menuOpened={calendarOpened}
                      on:day-click={() => {calendarOpened = false}}
                      --simple-textfield-width="100%"
                    ></DatePickerTextField>
                  </div>
                </div>
              {:else if tmpFilter.type === "number" && tmpFilter.mode !== 'between'}
                <SimpleTextField
                  bind:value={tmpFilter.value}
                  type="number"
                  placeholder={betweenFromLabel}
                  --simple-textfield-width="100%"
                ></SimpleTextField>
              {:else if tmpFilter.type === "date" && tmpFilter.mode === 'between'}
                <div style:width="100%">
                  <div class="date" style:margin-bottom="10px">
                    <DatePickerTextField
                      bind:selectedDate={tmpFilter.from}
                      openingId="advanced-filter"
                      placeholder={betweenToLabel}
                      bind:menuOpened={calendarOpened}
                      on:day-click={() => {calendarOpened = false}}
                      --simple-textfield-width="100%"
                    ></DatePickerTextField>
                  </div>
                  <div class="date">
                    <DatePickerTextField
                      bind:selectedDate={tmpFilter.to}
                      openingId="advanced-filter"
                      placeholder="Alla data"
                      bind:menuOpened={calendarOpened2}
                      on:day-click={() => {calendarOpened2 = false}}
                      --simple-textfield-width="100%"
                    ></DatePickerTextField>
                  </div>
                </div>
              {:else if tmpFilter.type === "number" && tmpFilter.mode === "between"}
                <div style:width="100%">
                  <div style:margin-bottom="10px">
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
                </div>
              {:else if tmpFilter.type == 'select'}
                <div style:width="100%">
                  <Autocomplete
                    on:close
                    --drawer-margin="5px 5px -10px 5px"
                    mobileDrawer
                    bind:values={tmpFilter.values}
                    items={tmpFilter.items}
                    multiple
                    maxVisibleChips={4}
                    --simple-textfield-width="0px"
                    --simple-text-field-margin-left="0px"
                  ></Autocomplete>
                </div>
              {:else if tmpFilter.type == 'bool'}
                <div class="bool-filter">
                  <Checkbox
                    bind:value={tmpFilter.value}
                  ></Checkbox>
                  <span style:margin-left="10px">
                    {tmpFilter.desctiprion}
                  </span>
                </div>
              {/if}
            </div>
          </div>
          <div class="bottom-btn">
            <div class="btn">
              <Button
                --button-width="100%"
                --button-box-shadow="none"
                --button-height="30px"
                --button-padding="10px 0px 10px 0px"
                --button-border-radius="10px 10px 0px 0px"
                disabled={applyFilterDisabled}
                on:click={handleApplyFilterClick}
              >{applyFilterLabel}</Button>
            </div>
            <div class="btn">
              <Button
                --button-width="100%"
                --button-box-shadow="none"
                --button-padding="10px 0px 10px 0px"
                --button-background-color="rgb(var(--global-color-grey-50))"
                --button-color="rgb(var(--global-color-primary-500))"
                --button-border-radius="0px 0px 0px 0px"
                on:click={handleCancelClick}
              >{cancelFilterLabel}</Button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

  <style>
  .filter-editor {
    display: flex;
    flex-direction: column;
    gap:10px;
    height: 100%;
  }

  .advanced-mode {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .advanced-mode-selector {
    width: 100%;
  }

  .header {
    padding: 20px 0px 10px 20px;
    display: flex;
    gap: 10px
  }

  .title {
    font-size: 1.4rem;
    font-weight: 600;
  }

  .fields {
    display: flex;
    align-items: center;
    margin-left: 20px;
    margin-right: 20px;
  }


  .date {
    width: 100%;
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .bottom-btn {
    margin-top: auto;
  }

  .editor {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .header {
    margin-bottom: 20px;
  }

</style>