<script lang="ts">
  import IMask, { InputMask, type FactoryArg } from 'imask';
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DatePicker from "$lib/components/simple/dates/DatePicker.svelte";
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { onMount } from 'svelte';
  import { DateTime } from 'luxon'
  import { createEventDispatcher } from 'svelte';
  import type { DateStat } from './utils';

  let dispatch = createEventDispatcher<{
    'day-click': {
      dateStat: DateStat
    }
  }>()

  export let menuOpened: boolean = false,
    openingId: string = 'date-picker-text-field',
    pattern: string = "dd/MM/yyyy",
    selectedMonth: number | undefined = undefined,
    selectedYear: number | undefined = undefined,
    visibleMonth: number | undefined = undefined,
    visibleYear: number | undefined = undefined,
    selectedDate: Date | undefined = undefined

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
          from: 1970,
          to: 2030
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

  function handleTextFieldFocus() {
    menuOpened = true
  }

  onMount(() => {
    mask = IMask(
      inputElement, maskFactoryArgs
    )
  })

  function handleInputChange() {
    setTimeout(() => {
      const typedValue = mask.value
  
      if(!!typedValue) {
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
        }
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
</script>

<div 
  bind:this={activator}
>
  <SimpleTextField
    bind:value={mask.value}
    on:focus={handleTextFieldFocus}
    on:keypress={handleInputChange}
    bind:input={inputElement}
  >
    <svelte:fragment slot="prepend-inner">
      <Icon 
        name="mdi-calendar"
        click
        on:click={() => menuOpened = !menuOpened}
      ></Icon>
    </svelte:fragment>
  </SimpleTextField>
</div>

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
    <DatePicker
      bind:selectedDate={selectedDate}
      bind:selectedMonth={selectedMonth}
      bind:selectedYear={selectedYear}
      bind:visibleMonth
      bind:visibleYear
      on:day-click={handleDateSelect}
      on:year-click={handleYearSelect}
      on:month-click={handleMonthSelect}
    ></DatePicker>
  </div>
</Menu>