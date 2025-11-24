<script lang="ts">
  import '../../../css/main.css'
  import './Calendar.css'
  import { fly } from "svelte/transition";
  import { dateToDateStat, getDateRowsStats, getDaysNames } from "./utils";
  import type { DateStat, Locale } from "./utils";
  import type { Snippet } from 'svelte';

  interface Props {
    selectedDate?: Date;
    selectedDateTo?: Date;
    visibleMonth?: number;
    visibleYear?: number;
    locale?: Locale;
    showExtraMonthDays?: boolean;
    showHeader?: boolean;
    animationDuration?: number;
    disabled?: boolean;
    type?: 'singleDate' | 'dateRange'
    class?: {
      container?: string,
      weekHeader?: string,
      day?: string
    }
    ondayClick?: (event: {
      detail: {
        dateStat: DateStat;
        selected: boolean;
        extraMonth: boolean;
      }
    }) => void
    weekHeaderSnippet?: Snippet<[{
      header: string,
      index: number
    }]>
    daySnippet?: Snippet<[{
      dayStat: DateStat,
      extraMonth: boolean
      selected: boolean
    }]>
  }

  let {
    selectedDate = $bindable(undefined),
    selectedDateTo = $bindable(undefined),
    visibleMonth = $bindable(new Date().getMonth()),
    visibleYear = $bindable(new Date().getFullYear()),
    locale = "it",
    showExtraMonthDays = true,
    showHeader = true,
    animationDuration = 200,
    disabled = false,
    type = 'singleDate',
    class: clazz = {},
    ondayClick,
    weekHeaderSnippet,
    daySnippet,
  }: Props = $props();

  const today = new Date()
  let hoveredDateStat: DateStat | undefined = $state()

  function handleDayClick(dateStat: DateStat, extraMonth: boolean) {
    if(disabled) return

    const clickedDate = new Date(
      dateStat.year,
      dateStat.month,
      dateStat.dayOfMonth,
      0,
      0,
      0,
      0
    );

    if (!extraMonth) {
      if(type == 'dateRange') {
        if(!selectedDate) {
          selectedDate = clickedDate
        } else {
          if (!!selectedDateTo) {
            selectedDate = clickedDate
            selectedDateTo = undefined
          } else if(selectedDate < clickedDate) {
            selectedDateTo = clickedDate
          } else if (selectedDate > clickedDate) {
            selectedDateTo = selectedDate
            selectedDate = clickedDate
          }
        }
      } else {
        selectedDate = clickedDate
      }
    }

    if(ondayClick){
      ondayClick({
        detail: {
          dateStat,
          selected: !extraMonth,
          extraMonth,
        }
      })
    }
  }

  function hoverDateStat(dateStat?: DateStat) {
    hoveredDateStat = dateStat
  }

  function isBetweenRange(dateStat: DateStat): boolean {
  if (type == 'dateRange') {
    let rangeDate: DateStat |undefined = !!selectedDateTo
      ? dateToDateStat(selectedDateTo)
      : hoveredDateStat
    if (!!rangeDate && !!selectedDate) {
      const date = new Date(dateStat.year, dateStat.month, dateStat.dayOfMonth);
      const selected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const hovered = new Date(rangeDate.year, rangeDate.month, rangeDate.dayOfMonth);
      
      const minDate = selected < hovered ? selected : hovered;
      const maxDate = selected < hovered ? hovered : selected;
      
      return date > minDate && date < maxDate;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
</script>

<div class="calendar-container {clazz.container || ''}">
  {#key visibleMonth}
    <div
      in:fly={{ delay: animationDuration, duration: animationDuration, y: 30 }}
      out:fly|local={{ duration: animationDuration, y: -30 }}
      class="grid-layout"
    >
      {#if showHeader}
        {#each getDaysNames(locale).map((name) => name[0]) as weekHeader, index}
          {#if weekHeaderSnippet}
            {@render weekHeaderSnippet({ header: weekHeader, index})}
          {:else}
            <div class="week-header-slot {clazz.weekHeader || ''}">{weekHeader}</div>
          {/if}
        {/each}
      {/if}
      {#each getDateRowsStats(visibleMonth, visibleYear, locale) as day}
        {@const firstDaySelected =
          !!selectedDate &&
          selectedDate.getDate() == day.dayOfMonth &&
          selectedDate.getMonth() == day.month &&
          selectedDate.getFullYear() == day.year}
        {@const lastDaySelected =
          !!selectedDateTo &&
          selectedDateTo.getDate() == day.dayOfMonth &&
          selectedDateTo.getMonth() == day.month &&
          selectedDateTo.getFullYear() == day.year}
        {@const extraMonth = day.month != visibleMonth}
        {@const isToday = 
          day.dayOfMonth == today.getDate() &&
          day.month == today.getMonth() &&
          day.year == today.getFullYear()}
        <div 
          onmouseenter={() => hoverDateStat(day)}
          onmouseleave={() => hoverDateStat()}
          role='presentation'
          class="day-slot {clazz.day || ''}"
          class:extra-month={extraMonth}
          class:today={isToday}
          class:selected={firstDaySelected || lastDaySelected}
          class:between-range={isBetweenRange(day)}
          class:not-selected={!(firstDaySelected || lastDaySelected)}
          class:range-start={type == 'dateRange' && firstDaySelected}
          class:range-end={type == 'dateRange' && lastDaySelected}
          onclick={() => handleDayClick(day, extraMonth)}
          onkeydown={() => handleDayClick(day, extraMonth)}
          >
          {#if daySnippet}
            {@render daySnippet({ dayStat: day, extraMonth, selected: firstDaySelected || lastDaySelected })}
          {:else}
            {#if (!showExtraMonthDays && day.month == visibleMonth) || showExtraMonthDays}
              {day.dayOfMonth}
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  {/key}
</div>

<style>
  .calendar-container {
    height: var(
      --calendar-height,
      var(--calendar-default-height)
    );
    width: var(
      --calendar-width,
      var(--calendar-default-width)
    );
  }

  .grid-layout {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    height: 100%;
    gap: var(
      --calendar-grid-gap,
      var(--calendar-default-grid-gap)
    );
  }

  .day-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    justify-self: center;
    align-self: center;
    transition: background-color 0.1s ease-in;
    height: var(
      --calendar-day-height,
      var(--calendar-default-day-height)
    );
    border-radius: var(
      --calendar-day-border-radius,
      var(--calendar-default-day-border-radius)
    );
    width: var(
      --calendar-day-width,
      var(--calendar-default-day-width)
    );
    background-color: var(
      --calendar-day-background-color,
      var(--calendar-default-day-background-color)
    );
  }

  .day-slot:not(.extra-month) {
    cursor: pointer;
  }

  .extra-month {
    opacity: 30%;
  }

  .today {
    background-color: var(
      --calendar-today-background-color,
      var(--calendar-default-today-background-color)
    );
    color: var(
      --calendar-today-color,
      var(--calendar-default-today-color)
    );
    height: var(
      --calendar-today-height,
      var(--calendar-default-today-height)
    );
    border-radius: var(
      --calendar-today-border-radius,
      var(--calendar-default-today-border-radius)
    );
    width: var(
      --calendar-today-width,
      var(--calendar-default-today-width)
    );
  }

  .between-range {
    background-color: var(
      --calendar-between-range-background-color,
      var(--calendar-default-between-range-background-color)
    );
    color: var(
      --calendar-between-range-color,
      var(--calendar-default-between-range-color)
    );
    height: var(
      --calendar-day-height,
      var(--calendar-default-day-height)
    );
    border-radius: var(
      --calendar-day-border-radius,
      var(--calendar-default-day-border-radius)
    );
    width: var(
      --calendar-day-width,
      var(--calendar-default-day-width)
    );
  }

  .selected {
    background-color: var(
      --calendar-selected-day-background-color,
      var(--calendar-default-selected-day-background-color)
    );
    color: var(
      --calendar-selected-day-color,
      var(--calendar-default-selected-day-color)
    );
    border-radius: var(
      --calendar-selected-day-border-radius,
      var(--calendar-default-selected-day-border-radius)
    );
  }

  .range-start {
    border-radius: var(
      --calendar-range-start-border-radius,
      var(--calendar-default-range-start-border-radius)
    );
  }

  .range-end {
    border-radius: var(
      --calendar-range-end-border-radius,
      var(--calendar-default-range-end-border-radius)
    );
  }

  .day-slot.not-selected:hover:not(.extra-month) {
    background-color: var(
      --calendar-day-hover-background-color,
      var(--calendar-default-day-hover-background-color)
    );
  }

  .week-header-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    justify-self: center;
    align-self: center;
    font-weight: 800;
    margin-bottom: 10px;
  }
</style>
