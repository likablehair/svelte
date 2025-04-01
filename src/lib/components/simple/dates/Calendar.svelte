<script lang="ts">
  import '../../../css/main.css'
  import './Calendar.css'
  import { fly } from "svelte/transition";
  import { getDateRowsStats, getDaysNames } from "./utils";
  import type { DateStat, Locale } from "./utils";
  import type { Snippet } from 'svelte';

  interface Props {
    selectedDate?: Date | null;
    visibleMonth?: number;
    visibleYear?: number;
    locale?: Locale;
    showExtraMonthDays?: boolean;
    showHeader?: boolean;
    animationDuration?: number;
    disabled?: boolean;
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
    visibleMonth = $bindable(new Date().getMonth()),
    visibleYear = $bindable(new Date().getFullYear()),
    locale = "it",
    showExtraMonthDays = true,
    showHeader = true,
    animationDuration = 200,
    disabled = false,
    class: clazz = {},
    ondayClick,
    weekHeaderSnippet,
    daySnippet,
  }: Props = $props();

  function handleDayClick(dateStat: DateStat, extraMonth: boolean) {
    if(disabled) return

    if (!extraMonth) {
      selectedDate = new Date(
        dateStat.year,
        dateStat.month,
        dateStat.dayOfMonth,
        0,
        0,
        0,
        0
      );
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
</script>

<div class="container {clazz.container || ''}">
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
        {@const selected =
          !!selectedDate &&
          selectedDate.getDate() == day.dayOfMonth &&
          selectedDate.getMonth() == day.month &&
          selectedDate.getFullYear() == day.year}
        {@const extraMonth = day.month != visibleMonth}
        {#if daySnippet}
            {@render daySnippet({ dayStat: day, extraMonth, selected })}
        {:else}
          {#if (!showExtraMonthDays && day.month == visibleMonth) || showExtraMonthDays}
            <div
              style:border-radius="50%"
              class="day-slot {clazz.day || ''}"
              class:extra-month={extraMonth}
              class:selected
              class:not-selected={!selected}
              onclick={() => handleDayClick(day, extraMonth)}
              onkeydown={() => handleDayClick(day, extraMonth)}
              role="presentation"
            >
              {day.dayOfMonth}
            </div>
            <!-- {:else}
            <div /> -->
          {/if}        
        {/if}
      {/each}
    </div>
  {/key}
</div>

<style>
  .container {
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

  .selected {
    background-color: var(
      --calendar-selected-day-background-color,
      var(--calendar-default-selected-day-background-color)
    );
    color: var(
      --calendar-selected-day-color,
      var(--calendar-default-selected-day-color)
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
