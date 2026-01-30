<script lang="ts">
  import IMask, { type InputMask } from 'imask';
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DatePicker from "$lib/components/simple/dates/DatePicker.svelte";
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { onMount, tick, type ComponentProps, type Snippet } from 'svelte';
  import { DateTime } from 'luxon'
  import type { DateStat } from '../../simple/dates/utils';
  import MediaQuery from '../../simple/common/MediaQuery.svelte';
  import Dialog from '../../simple/dialogs/Dialog.svelte';

  interface Props {
    menuOpened?: boolean;
    openingId?: string;
    pattern?: string;
    selectedMonth?: number;
    selectedYear?: number;
    visibleMonth?: number;
    visibleYear?: number;
    selectedDate?: Date;
    selectedDateTo?: Date;
    type?: ComponentProps<typeof DatePicker>['type']
    placeholder?: string;
    placeholderTo?: string;
    mobileDialog?: boolean;
    maxYearInRange?: number;
    minYearInRange?: number;
    disabled?: boolean;
    flipOnOverflow?: boolean;
    class?: {
      activator?: string,
      textfield?: ComponentProps<typeof SimpleTextField>['class']
    }
    ondayClick?: (event: {
      detail: {
        dateStat: DateStat
      }
    }) => void
    oninput?: (event: {
      detail: {
        datetime: Date | undefined,
        type: 'from' | 'to'
      }
    }) => void
    activatorSnippet?: Snippet<[{
      mask: typeof mask
      handleTextFieldFocus: typeof handleTextFieldFocus
      handleInputChange: typeof handleInputChange
      inputElement: HTMLElement | undefined
      placeholder: string | undefined
      disabled: boolean
    }]>
    appendSnippet?: ComponentProps<typeof SimpleTextField>['appendSnippet']
    appendInnerSnippet?: ComponentProps<typeof SimpleTextField>['appendInnerSnippet']
    prependSnippet?: ComponentProps<typeof SimpleTextField>['prependSnippet']
    prependInnerSnippet?: ComponentProps<typeof SimpleTextField>['prependInnerSnippet']
  }

  let {
    menuOpened = $bindable(),
    openingId = $bindable(),
    pattern = "dd/MM/yyyy",
    selectedYear = $bindable(new Date().getFullYear()),
    selectedMonth = $bindable(new Date().getMonth()),
    selectedDate = $bindable(),
    selectedDateTo = $bindable(),
    type,
    visibleMonth = $bindable(selectedMonth),
    visibleYear = $bindable(selectedYear),
    placeholder,
    placeholderTo,
    mobileDialog = true,
    maxYearInRange = 2100,
    minYearInRange = 1970,
    disabled = false,
    flipOnOverflow = true,
    class: clazz = {},
    ondayClick,
    oninput,
    activatorSnippet,
    appendInnerSnippet,
    appendSnippet,
    prependInnerSnippet: prependInnerInternalSnippet,
    prependSnippet,
  }: Props = $props();


  let activator: HTMLElement | undefined = $state(),
    refreshPosition = $state(false),
    menuElement: HTMLElement | undefined = $state(),
    inputElement: HTMLElement | undefined = $state(),
    inputElementTo: HTMLElement | undefined = $state(),
    mask: InputMask<typeof maskFactoryArgs> | { value: string | undefined } = $state({
      value: undefined
    }),
    maskTo: InputMask<typeof maskFactoryArgs> | { value: string | undefined } = $state({
      value: undefined
    }),
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
    if(inputElement){
      mask = IMask(
        inputElement, maskFactoryArgs
      )
    }

    if(inputElementTo){
      maskTo = IMask(
        inputElementTo, maskFactoryArgs
      )
    }

    if(!!selectedDate) {
      mask.value = DateTime.fromJSDate(selectedDate).toFormat(pattern)
    }

    if(!!selectedDateTo) {
      maskTo.value = DateTime.fromJSDate(selectedDateTo).toFormat(pattern)
    }
  })

  $effect(() => {
    if(!selectedDate) {
      mask.value = ""
    }
  })

  $effect(() => {
    if(!selectedDateTo) {
      maskTo.value = ""
    }
  })

  function handleInputChange(e: Parameters<NonNullable<ComponentProps<typeof SimpleTextField>['onkeydown']>>[0]) {
    // @ts-ignore
    const id = e.target?.id as string
    setTimeout(() => {
      // @ts-ignore
      const typedValue = e.target?.value as string

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
          if(id == 'from') {
            selectedDate = DateTime.fromObject({
              day: Number(dayOfMonth),
              month: Number(oneBasedMonth),
              year: Number(year)
            }).toJSDate()
          } else if (id == 'to') {
            selectedDateTo = DateTime.fromObject({
              day: Number(dayOfMonth),
              month: Number(oneBasedMonth),
              year: Number(year)
            }).toJSDate()
          }
        } else {
          if(id == 'from') {
            if(selectedDate) selectedDate = undefined
          } else if (id == 'to') {
            if(selectedDateTo) selectedDateTo = undefined
          }
        }

        if(oninput && (id == 'to' || id == 'from')) {
          oninput({
            detail: {
              datetime: id == "to" ? selectedDateTo : selectedDate,
              type: id,
            }
          })
        }
      }
    }, 30);
  }

  function handleDateSelect(event: Parameters<NonNullable<ComponentProps<typeof DatePicker>['ondayClick']>>[0]) {
    if(!!selectedDate) {
      mask.value = DateTime.fromJSDate(selectedDate).toFormat(pattern)
    }

    if(!!selectedDateTo) {
      maskTo.value = DateTime.fromJSDate(selectedDateTo).toFormat(pattern)
    }

    if(ondayClick) {
      ondayClick({
        detail: {
          dateStat: event.detail.dateStat
        }
      })
    }
  }

  function handleYearSelect() {
    mask.value = ''
    maskTo.value = ''
  }

  function handleMonthSelect() {
    mask.value = ''
    maskTo.value = ''
  }

  $effect(() => {
    if(!!selectedDate) {
      setTimeout(async () => {
        if(!!selectedDate) {
          mask.value = DateTime.fromJSDate(selectedDate).toFormat(pattern)
        }
        await tick()
      }, 30);
    }
  })

  $effect(() => {
    if(!!selectedDateTo) {
      setTimeout(async () => {
        if(!!selectedDateTo) {
          maskTo.value = DateTime.fromJSDate(selectedDateTo).toFormat(pattern)
        }
        await tick()
      }, 30);
    }
  })
</script>

<MediaQuery>
  {#snippet defaultSnippet({ mAndDown})}
    <div
      bind:this={activator}
      class="date-picker-activator {clazz.activator || ''}"
      style:width="var(--simple-textfield-width)"
    >
      {#if activatorSnippet}
        {@render activatorSnippet({ mask, handleTextFieldFocus, handleInputChange, inputElement, placeholder, disabled })}
      {:else}
        <SimpleTextField
          value={mask.value}
          valueTo={maskTo.value}
          onfocus={() => handleTextFieldFocus(mAndDown)}
          onkeydown={handleInputChange}
          bind:input={inputElement}
          bind:inputTo={inputElementTo}
          id='from'
          idTo='to'
          {placeholder}
          {placeholderTo}
          range={type == 'dateRange'}
          class={clazz.textfield}
          {disabled}
          {appendInnerSnippet}
          {prependSnippet}
          {appendSnippet}
          autocomplete='off'
          --simple-textfield-default-padding='0.65rem 0.8rem'
          --simple-textfield-default-inner-gap='4px'
        >
          {#snippet prependInnerSnippet({ iconSize, prependInnerIcon })}
            {#if prependInnerInternalSnippet}
              {@render prependInnerInternalSnippet({ prependInnerIcon, iconSize })}
            {:else}
              <Icon
                name="mdi-calendar"
                onclick={() => menuOpened = !menuOpened}
                tabindex={-1}
              ></Icon>
            {/if}
          {/snippet}
        </SimpleTextField>
      {/if}
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
            bind:selectedDateTo={selectedDateTo}
            bind:selectedMonth={selectedMonth}
            bind:selectedYear={selectedYear}
            bind:visibleMonth
            bind:visibleYear
            ondayClick={handleDateSelect}
            onyearClick={handleYearSelect}
            onmonthClick={handleMonthSelect}
            skipTabs
            {disabled}
            {type}
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
            bind:selectedDateTo={selectedDateTo}
            bind:selectedMonth={selectedMonth}
            bind:selectedYear={selectedYear}
            bind:visibleMonth
            bind:visibleYear
            ondayClick={handleDateSelect}
            onyearClick={handleYearSelect}
            onmonthClick={handleMonthSelect}
            skipTabs
            {disabled}
            {type}
          ></DatePicker>
        </div>
      </Menu>
    {/if}
  {/snippet}
</MediaQuery>

<style>
  .date-picker-activator {
    width: fit-content;
  }
</style>

