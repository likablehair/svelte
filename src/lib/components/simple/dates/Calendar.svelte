<script lang="ts">
  import { fly } from "svelte/transition";
  import { getDateRowsStats, getDaysNames } from "./utils";
  import type { DateStat, Locale } from "./utils";

  export let selectedDate: Date | undefined = undefined,
    visibleMonth: number = new Date().getMonth(),
    visibleYear: number = new Date().getFullYear(),
    locale: Locale = "it",
    showExtraMonthDays = true,
    showHeader = true,
    height = "100%",
    width = "100%",
    dayWidth = "30px",
    dayHeight = "30px",
    dayHoverColor = "#c9c8c873",
    daySelectedColor = "#adadad",
    selectedTextColor = "black",
    gridGap = "1px",
    dayBackgroundColor: string | undefined = undefined,
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

<div style:height style:width>
  {#key visibleMonth}
    <div
      in:fly={{ delay: animationDuration, duration: animationDuration, y: 30 }}
      out:fly|local={{ duration: animationDuration, y: -30 }}
      style:gap={gridGap}
      class="grid-layout"
    >
      {#if showHeader}
        {#each getDaysNames(locale).map((name) => name[0]) as weekHeader, index}
          <slot name="weekHeader" header={weekHeader} {index}>
            <div class="week-header-slot">{weekHeader}</div>
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
              style:background-color={dayBackgroundColor}
              style:height={dayHeight}
              style:width={dayWidth}
              style:cursor={extraMonth ? "default" : "pointer"}
              style:--calendar-hover-color={extraMonth ? "" : dayHoverColor}
              style:--calendar-selected-color={daySelectedColor}
              style:--calendar-selected-text-color={selectedTextColor}
              class="day-slot"
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
  .grid-layout {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    height: 100%;
  }

  .day-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    justify-self: center;
    align-self: center;
    transition: background-color 0.1s ease-in;
  }

  .extra-month {
    opacity: 30%;
  }

  .selected {
    background-color: var(--calendar-selected-color);
    color: var(--calendar-selected-text-color);
  }

  .day-slot.not-selected:hover {
    background-color: var(--calendar-hover-color);
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
