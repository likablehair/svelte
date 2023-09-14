<script lang="ts">
  import type { Filter, StringMode } from "$lib/utils/filters/filters";
  import { DateModes, StringModes } from '$lib/utils/filters/filters';
  import type { DateMode } from "$lib/utils/filters/filters";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DatePickerTextField from "$lib/components/simple/dates/DatePickerTextField.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import { createEventDispatcher } from "svelte";
  import Validator from "$lib/utils/filters/validator";
  import SelectableVerticalList, { type Element } from "$lib/components/simple/lists/SelectableVerticalList.svelte";
    import Icon from "$lib/components/simple/media/Icon.svelte";
    import { fly } from "svelte/transition";

  export let filter: Filter | undefined = undefined,
    cancelFilterLabel : string = "Cancel",
    applyFilterLabel : string = "Apply Filter",
    backIcon: string = "mdi-arrow-left"

  let dispatch = createEventDispatcher<{
    'apply': undefined,
    'backClick': undefined,
    'cancelClick': undefined
  }>()

  function handleApplyFilterClick() {
    if(!!filter) {
      filter.active = true
      dispatch('apply')
    }
  }


  let advancedModeOptions: Element[],
    advancedModeSelectedOption: string | undefined

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
          title: mode,
          name: mode
        }
      })
    }
  }

  $: if(!filter?.advanced) {
    advancedModeSelectedOption = undefined
  }

  let calendarOpened: boolean = false,
    calendarOpened2: boolean = false

  // TODO I don't like that there is a singlo dropdow to handle all filter advance mode.
  // In some case would be necessary to handle more than one selection and this code
  // could become non sense
  function handleAdvancedModeSelection() {
    if(!!advancedModeSelectedOption && !!filter) {
      if(filter.type == 'date') filter.mode = advancedModeSelectedOption as DateMode
      else if(filter.type == 'string') filter.mode = advancedModeSelectedOption as StringMode

      step = 'editor'
      canRenderOptions = false
    }
  }

  let canRenderOptions: boolean = true

  let step: 'advanced' | 'editor' = (!!filter && filter.advanced) ? 'advanced' : 'editor'

  $: applyFilterDisabled = !Validator.isValid(filter)

  function handleModeBackClick() {
    dispatch('backClick')
  }

  function handleEditorBackCLick() {
    if(!!filter && !filter.advanced) {
      dispatch('backClick')
    } else {
      step = 'advanced'
      advancedModeSelectedOption = undefined
      setTimeout(() => {
        canRenderOptions = true
      }, 100)
    }
  }

  $: if(!!filter && filter.type == 'date' && filter.mode == 'between') {
    if(!filter.from) filter.from = new Date()
    if(!filter.to) filter.to = new Date()
  }

  function handleCancelClick() {
    dispatch('cancelClick')
  }


</script>

<div class="container">
  {#if !!filter}
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
      {#if filter.advanced && step == 'advanced' && canRenderOptions}
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
      {:else if step == 'editor' && (!filter.advanced || !!advancedModeSelectedOption)}
        <div class="editor" in:fly={{delay: 100, x: 200, duration: 100}} out:fly={{x: -200, duration: 100}}>
          <div class="fields-container">
            <div class="fields"
              on:click|stopPropagation
              on:keypress
            >
              {#if filter.type === "string" }
                <SimpleTextField
                  bind:value={filter.value}
                  type="text"
                  placeholder={filter?.label}
                  --simple-textfield-width="100%"
                ></SimpleTextField>
              {:else if filter.type === "date" && filter.mode !== 'between'}
                <div class="dates-container">
                  <div>
                    <DatePickerTextField
                      bind:selectedDate={filter.value}
                      openingId="advanced-filter"
                      bind:menuOpened={calendarOpened}
                      on:day-click={() => {calendarOpened = false}}
                      --simple-textfield-width="100%"
                    ></DatePickerTextField>
                  </div>
                </div>
              {:else if filter.type === "date" && filter.mode === 'between'}
                <div class="dates-container">
                  <div class="date" style:margin-bottom="10px">
                    <DatePickerTextField
                      bind:selectedDate={filter.from}
                      openingId="advanced-filter"
                      placeholder="Dalla data"
                      bind:menuOpened={calendarOpened}
                      on:day-click={() => {calendarOpened = false}}
                      --simple-textfield-width="100%"
                    ></DatePickerTextField>
                  </div>
                  <div class="date">
                    <DatePickerTextField
                      bind:selectedDate={filter.to}
                      openingId="advanced-filter"
                      placeholder="Alla data"
                      bind:menuOpened={calendarOpened2}
                      on:day-click={() => {calendarOpened2 = false}}
                      --simple-textfield-width="100%"
                    ></DatePickerTextField>
                  </div>
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
                --button-border-radius="0px 0px 10px 10px"
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

  .dates-container {
    width: 100%;
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

</style>