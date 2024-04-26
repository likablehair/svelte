<script lang="ts">
  import IMask, { InputMask, type FactoryArg } from 'imask';
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DatePicker from "$lib/components/simple/dates/DatePicker.svelte";
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { onMount, type ComponentProps } from 'svelte';
  import { DateTime } from 'luxon'
  import { createEventDispatcher } from 'svelte';
  import type { DateStat } from '../../simple/dates/utils';
  import MediaQuery from '../../simple/common/MediaQuery.svelte';
  import Dialog from '../../simple/dialogs/Dialog.svelte';
    import YearSelector from '$lib/components/simple/dates/YearSelector.svelte';

  let clazz: {
    activator?: string,
    textfield?: ComponentProps<SimpleTextField>['class']
  } = {};
	export { clazz as class };

  let dispatch = createEventDispatcher<{
    'year-click': {
      year: number
    },
    input: {
      year: number | undefined
    }
  }>()

  export let menuOpened: boolean = false,
    openingId: string = 'year-picker-text-field',
    selectedYear: number | undefined = undefined,
    placeholder: string | undefined = undefined,
    mobileDialog: boolean = true,
    maxYearInRange: number = 2100,
    minYearInRange: number = 1900,
    disabled: boolean = false

  let activator: HTMLElement,
    refreshPosition = false,
    menuElement: HTMLElement,
    inputElement: HTMLElement,
    pattern: string = "yyyy",
    mask: InputMask<typeof maskFactoryArgs> | { value: string | undefined } = {
      value: undefined
    },
    maskFactoryArgs = {
      mask: Date,
      pattern: pattern,
      format: function (date: any): string {
        return DateTime.fromJSDate(date).toFormat(pattern)
      },
      parse: function (str: string): Date {
        return DateTime.fromFormat(str, pattern).toJSDate()
      },
      blocks: {
        yyyy: {
          mask: IMask.MaskedRange,
          from: minYearInRange,
          to: maxYearInRange
        }
      }
    }

  function handleTextFieldFocus(mobile: boolean) {
    if(!mobile || !mobileDialog) {
      menuOpened = true
    }
  }

  onMount(() => {
    mask = IMask(
      inputElement, maskFactoryArgs
    )

    if(selectedYear !== undefined && selectedYear !== null) {
      mask.value = selectedYear.toString()
    }
  })

  function handleInputChange(event: any) {
    setTimeout(() => {
      const typedValue = mask.value

      if(typedValue !== undefined && typedValue !== null) {
        // find year
        const yearIndex = pattern.indexOf('yyyy')
        const year = typedValue.substring(yearIndex, yearIndex + 4)
        if(year.length == 4) {
          selectedYear = Number(year)
        }

        dispatch('input', {
          year: selectedYear
        })
      }
    }, 30);
  }

  function handleYearSelect(ev: CustomEvent<{
    year: number
  }>) {
    if(!!selectedYear) {
      mask.value = selectedYear.toString()
    }

    dispatch('year-click', {
      year: ev.detail.year
    })
  }

  $: if(!!selectedYear) {
    setTimeout(() => {
      if(!!selectedYear) {
        mask.value = selectedYear.toString()
      }
    }, 30);
  }
</script>

<MediaQuery let:mAndDown>
  <div
    bind:this={activator}
    class="year-picker-activator {clazz.activator || ''}"
  >
    <slot 
      name="activator"
      {mask}
      {handleTextFieldFocus}
      {handleInputChange}
      {inputElement}
      {placeholder}
      {disabled}
    >
      <SimpleTextField
        bind:value={mask.value}
        on:focus={() => handleTextFieldFocus(mAndDown)}
        on:keydown={handleInputChange}
        bind:input={inputElement}
        bind:placeholder
        class={clazz.textfield}
        {disabled}
      >
        <svelte:fragment slot="prepend-inner" let:prependInnerIcon let:iconSize>
          <slot name="prepend-inner" {prependInnerIcon} {iconSize}>
            <Icon
              name="mdi-calendar"
              click
              on:click={() => menuOpened = !menuOpened}
            ></Icon>
          </slot>
        </svelte:fragment>
        <svelte:fragment slot="append-inner" let:appendInnerIcon let:iconSize>
          <slot name="append-inner" {appendInnerIcon} {iconSize}>
          </slot>
        </svelte:fragment>
        <svelte:fragment slot="prepend" let:prependIcon let:iconSize>
          <slot name="append-inner" {prependIcon} {iconSize}>
          </slot>
        </svelte:fragment>
        <svelte:fragment slot="append" let:appendIcon let:iconSize>
          <slot name="append-inner" {appendIcon} {iconSize}>
          </slot>
        </svelte:fragment>
      </SimpleTextField>
    </slot>
  </div>

  {#if mAndDown && mobileDialog}
    <Dialog
      bind:open={menuOpened}
    >
      <div
        style:background-color="rgb(var(--global-color-background-100))"
        style:width="300px"
        style:border-radius="10px"
      >
        <YearSelector
          bind:selectedYear={selectedYear}
          on:click={handleYearSelect}
          {disabled}
        ></YearSelector>
      </div>
    </Dialog>
  {:else}
    <Menu
      {activator}
      _width={"300px"}
      _boxShadow={"rgb(var(--global-color-background-300), .5) 0px 2px 4px"}
      _borderRadius={"5px"}
      bind:open={menuOpened}
      anchor="bottom-center"
      closeOnClickOutside
      bind:refreshPosition
      bind:menuElement
      bind:openingId={openingId}
    >
      <div
        style:background-color="rgb(var(--global-color-background-100))"
      >
        <YearSelector
          bind:selectedYear={selectedYear}
          on:click={handleYearSelect}
          {disabled}
        ></YearSelector>
      </div>
    </Menu>
  {/if}
</MediaQuery>

<style>
  .year-picker-activator {
    width: fit-content;
  }
</style>

