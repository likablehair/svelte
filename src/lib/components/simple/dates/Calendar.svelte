<script lang="ts">
  import './Calendar.css'
  import { fly } from "svelte/transition";
  import { getDateRowsStats, getDaysNames } from "./utils";
  import type { DateStat, Locale } from "./utils";

  let clazz: {
    container?: string,
    weekHeader?: string,
    day?: string
  } = {};
	export { clazz as class };

  export let selectedDate: Date | undefined = undefined,
    visibleMonth: number = new Date().getMonth(),
    visibleYear: number = new Date().getFullYear(),
    locale: Locale = "it",
    showExtraMonthDays = true,
    showHeader = true,
    animationDuration = 200;

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher<{
    "day-click": {
      dateStat: DateStat;
      selected: boolean;
      extraMonth: boolean;
    };
  }>();

  function handleDayClick(dateStat: DateStat, extraMonth: boolean) {
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

    dispatch("day-click", {
      dateStat: dateStat,
      selected: !extraMonth,
      extraMonth: extraMonth,
    });
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
          <slot name="weekHeader" header={weekHeader} {index}>
            <div class="week-header-slot {clazz.weekHeader || ''}">{weekHeader}</div>
          </slot>
        {/each}
      {/if}
      {#each getDateRowsStats(visibleMonth, visibleYear, locale) as day}
        {@const selected =
          !!selectedDate &&
          selectedDate.getDate() == day.dayOfMonth &&
          selectedDate.getMonth() == day.month &&
          selectedDate.getFullYear() == day.year}
        {@const extraMonth = day.month != visibleMonth}
        <slot name="day" dayStat={day} {extraMonth} {selected}>
          {#if (!showExtraMonthDays && day.month == visibleMonth) || showExtraMonthDays}
            <div
              style:border-radius="50%"
              class="day-slot {clazz.day || ''}"
              class:extra-month={extraMonth}
              class:selected
              class:not-selected={!selected}
              on:click={() => handleDayClick(day, extraMonth)}
              on:keydown={() => handleDayClick(day, extraMonth)}
            >
              {day.dayOfMonth}
            </div>
          {:else}
            <div />
          {/if}
        </slot>
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
