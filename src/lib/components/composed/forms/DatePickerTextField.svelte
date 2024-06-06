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

  let clazz: {
    activator?: string,
    textfield?: ComponentProps<SimpleTextField>['class']
  } = {};
	export { clazz as class };

  let dispatch = createEventDispatcher<{
    'day-click': {
      dateStat: DateStat
    },
    input: {
      datetime: Date | undefined
    }
  }>()

  export let menuOpened: boolean = false,
    openingId: string = 'date-picker-text-field',
    pattern: string = "dd/MM/yyyy",
    selectedMonth: number | undefined = undefined,
    selectedYear: number | undefined = undefined,
    visibleMonth: number | undefined = undefined,
    visibleYear: number | undefined = undefined,
    selectedDate: Date | undefined = undefined,
    placeholder: string | undefined = undefined,
    mobileDialog: boolean = true,
    maxYearInRange: number = 2100,
    minYearInRange: number = 1970,
    disabled: boolean = false,
    flipOnOverflow: boolean = true


  let activator: HTMLElement,
    refreshPosition = false,
    menuElement: HTMLElement,
    inputElement: HTMLElement,
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
        },
        MM: {
          mask: IMask.MaskedRange,
          from: 1,
          to: 12
        },
        dd: {
          mask: IMask.MaskedRange,
          from: 1,
          to: 31
        },
        HH: {
          mask: IMask.MaskedRange,
          from: 0,
          to: 23
        },
        mm: {
          mask: IMask.MaskedRange,
          from: 0,
          to: 59
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

    if(!!selectedDate) {
      mask.value = DateTime.fromJSDate(selectedDate).toFormat(pattern)
    }
  })

  $: if(!selectedDate) {
    mask.value = ""
  }

  function handleInputChange(event: any) {
    setTimeout(() => {
      const typedValue = mask.value

      if(typedValue !== undefined && typedValue !== null) {
        // find day of month
        const dayOfMonthIndex = pattern.indexOf('dd')
        const dayOfMonth = typedValue.substring(dayOfMonthIndex, dayOfMonthIndex + 2)

        // find month
        const monthIndex = pattern.indexOf('MM')
        const oneBasedMonth = typedValue.substring(monthIndex, monthIndex + 2)
        if(oneBasedMonth.length == 2) {
          selectedMonth = Number(oneBasedMonth) - 1
          visibleMonth = selectedMonth
        }

        // find year
        const yearIndex = pattern.indexOf('yyyy')
        const year = typedValue.substring(yearIndex, yearIndex + 4)
        if(year.length == 4) {
          selectedYear = Number(year)
          visibleYear = selectedYear
        }

        if(typedValue.length == pattern.length) {
          selectedDate = DateTime.fromObject({
            day: Number(dayOfMonth),
            month: Number(oneBasedMonth),
            year: Number(year)
          }).toJSDate()
        } else {
          selectedDate = undefined
        }

        dispatch('input', {
          datetime: selectedDate
        })
      }
    }, 30);
  }

  function handleDateSelect(ev: CustomEvent<{
    dateStat: DateStat
  }>) {
    if(!!selectedDate) {
      mask.value = DateTime.fromJSDate(selectedDate).toFormat(pattern)
    }

    dispatch('day-click', {
      dateStat: ev.detail.dateStat
    })
  }

  function handleYearSelect() {
    mask.value = ''
  }

  function handleMonthSelect() {
    mask.value = ''
  }

  $: if(!!selectedDate) {
    setTimeout(() => {
      if(!!selectedDate) {
        mask.value = DateTime.fromJSDate(selectedDate).toFormat(pattern)
      }
    }, 30);
  }
</script>

<MediaQuery let:mAndDown>
  <div
    bind:this={activator}
    class="date-picker-activator {clazz.activator || ''}"
    style:width="var(--simple-textfield-width)"
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
              tabindex={-1}
            ></Icon>
          </slot>
        </svelte:fragment>
        <svelte:fragment slot="append-inner" let:appendInnerIcon let:iconSize>
          <slot name="append-inner" {appendInnerIcon} {iconSize}>
          </slot>
        </svelte:fragment>
        <svelte:fragment slot="prepend" let:prependIcon let:iconSize>
          <slot name="prepend" {prependIcon} {iconSize}>
          </slot>
        </svelte:fragment>
        <svelte:fragment slot="append" let:appendIcon let:iconSize>
          <slot name="append" {appendIcon} {iconSize}>
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
        <DatePicker
          bind:selectedDate={selectedDate}
          bind:selectedMonth={selectedMonth}
          bind:selectedYear={selectedYear}
          bind:visibleMonth
          bind:visibleYear
          on:day-click={handleDateSelect}
          on:year-click={handleYearSelect}
          on:month-click={handleMonthSelect}
          skipTabs
          {disabled}
        ></DatePicker>
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
      flipOnOverflow={flipOnOverflow}
    >
      <div
        style:background-color="rgb(var(--global-color-background-100))"
      >
        <DatePicker
          bind:selectedDate={selectedDate}
          bind:selectedMonth={selectedMonth}
          bind:selectedYear={selectedYear}
          bind:visibleMonth
          bind:visibleYear
          on:day-click={handleDateSelect}
          on:year-click={handleYearSelect}
          on:month-click={handleMonthSelect}
          skipTabs
          {disabled}
        ></DatePicker>
      </div>
    </Menu>
  {/if}
</MediaQuery>

<style>
  .date-picker-activator {
    width: fit-content;
  }
</style>

