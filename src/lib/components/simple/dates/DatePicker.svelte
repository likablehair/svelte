<script lang="ts">
  import './DatePicker.css'
  import { getMonthName, dateToString } from "./utils";
  import type { Locale } from "./utils";
  import YearSelector from "./YearSelector.svelte";
  import MonthSelector from "./MonthSelector.svelte";
  import Calendar from "./Calendar.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import { createEventDispatcher } from 'svelte';

  let clazz: {
    container?: string,
    header?: string,
    selectorRow?: string
  } = {};
	export { clazz as class };

  export let selectedYear: number = new Date().getFullYear(),
    selectedMonth: number = new Date().getMonth(),
    selectedDate: Date | null = new Date(),
    visibleMonth: number = selectedMonth,
    visibleYear: number = selectedYear,
    view: "year" | "month" | "day" = "day",
    locale: Locale = "it",
    selectableYears: number[] = [...Array(150).keys()].map(
      (i) => i + (new Date().getFullYear() - 75)
    )

  let dispatch = createEventDispatcher<{
    'year-click': {
      year: number
    },
    'month-click': {
      month: number
    }
  }>()

  let selectorText: string | undefined = undefined;
  let elementDisabled: "year" | "date" = "date";

  $: visibleSelector = view == "day" || view == "month";
  $: {
    selectorText =
      view == "day"
        ? getMonthName(visibleMonth, locale) + " " + visibleYear
        : visibleYear.toString();
  }
  $: elementDisabled = view == "year" ? "year" : "date";

  function next() {
    if (view == "day") {
      if (visibleMonth == 11) {
        visibleMonth = 0;
        visibleYear += 1;
      } else {
        visibleMonth += 1;
      }
    } else {
      if (visibleYear != selectableYears[selectableYears.length - 1])
        visibleYear++;
    }
  }

  function previous() {
    if (view == "day") {
      if (visibleMonth == 0) {
        visibleMonth = 11;
        visibleYear -= 1;
      } else {
        visibleMonth -= 1;
      }
    } else {
      if (visibleYear != selectableYears[0]) visibleYear--;
    }
  }

  function SelectorHandler() {
    if (view == "month") view = "year";
    else view = "month";
  }

  function handleYearChange() {
    dispatch('year-click', {
      year: selectedYear
    })
    view = "month";
  }

  function handleMonthChange() {
    dispatch('month-click', {
      month: selectedMonth
    })
    view = "day";
  }
</script>

<div
  class="container {clazz.container || ''}"
>
  <div
    class="header {clazz.header || ''}"
  >
    <span
      class:disabled={elementDisabled == "year"}
      on:click={() => {
        view = "year";
      }}
      on:keypress={() => {
        view = "year";
      }}>{visibleYear}</span
    >
    <h2
      class:disabled={elementDisabled == "date"}
      on:click={() => {
        view = "day";
      }}
      on:keypress={() => {
        view = "day";
      }}
    >
      {#if !!selectedDate}
        {dateToString(selectedDate, "dayAndMonth", locale)}
      {/if}
    </h2>
  </div>
  <div class="body">
    {#if visibleSelector}
      <div class="selector-row {clazz.selectorRow || ''}" style:height="calc(var(--date-picker-height, var(--date-picker-default-height)) / 8 * 1)">
        <div class="row-elem">
          <Button
            --button-background-color="transparent"
            buttonType="icon"
            --icon-size="25pt"
            icon="mdi-chevron-left"
            on:click={previous}
          />
        </div>
        <div class="row-elem selector">
          {#key selectorText}
            <div
              on:click={SelectorHandler}
              on:keypress={SelectorHandler}
            >
              {selectorText}
            </div>
          {/key}
        </div>
        <div class="row-elem">
          <Button
            --button-background-color="transparent"
            buttonType="icon"
            --icon-size="25pt"
            icon="mdi-chevron-right"
            on:click={next}
          />
        </div>
      </div>
    {/if}
    {#if view == "month"}
      <MonthSelector
        --month-selector-height="calc((var(--date-picker-height, var(--date-picker-default-height)) / 8 * 5) - 10px)"
        --month-selector-width="var(--date-picker-width, var(--date-picker-default-width))"
        bind:selectedMonth={visibleMonth}
        on:click={handleMonthChange}
        {locale}
      />
    {:else if view == "year"}
      <YearSelector
        --year-selector-height="calc(var(--date-picker-height, var(--date-picker-default-height)) / 8 * 6)"
        bind:selectedYear={visibleYear}
        {selectableYears}
        on:click={handleYearChange}
      />
    {:else}
      <Calendar
        --calendar-height="calc((var(--date-picker-height, var(--date-picker-default-height)) / 8 * 5) - 10px)"
        --calendar-width="var(--date-picker-width, var(--date-picker-default-width))"
        bind:visibleMonth={visibleMonth}
        bind:visibleYear={visibleYear}
        bind:selectedDate
        {locale}
        on:day-click
      />
    {/if}
  </div>
</div>

<style>
  .container {
    border-radius: 5px;
    height: var(
      --date-picker-height,
      var(--date-picker-default-height)
    );
    width: var(
      --date-picker-width,
      var(--date-picker-default-width)
    );
    box-shadow: var(
      --date-picker-box-shadow,
      var(--date-picker-default-box-shadow)
    );
  }

  .header {
    border-radius: 5px 5px 0 0;
    background-color: var(
      --date-picker-header-background-color,
      var(--date-picker-default-header-background-color)
    );
    height: calc(var(--date-picker-height, var(--date-picker-default-height)) / 4);
    color: var(
      --date-picker-header-color,
      var(--date-picker-default-header-color)
    );
  }
  .header > h2 {
    margin-left: 15px;
    margin-top: 5px;
    transition: 0.1s;
    opacity: 0.8;
  }
  .header > h2:hover {
    opacity: 1;
    cursor: pointer;
  }
  .header > span {
    display: inline-block;
    line-height: 100%;
    margin-left: 15px;
    margin-top: 10px;
    opacity: 0.8;
    transition: 0.1s;
  }
  .header > span:hover {
    opacity: 1;
    cursor: pointer;
  }
  .selector-row {
    display: flex;
    justify-content: space-between;
    line-height: 100%;
  }
  .row-elem {
    margin: auto;
  }
  .selector {
    width: 50%;
    text-align: center;
  }
  .selector > div {
    transition: 0.1s;
  }
  .selector > div:hover {
    cursor: pointer;
  }
  .disabled {
    pointer-events: none;
    opacity: 1 !important;
  }
</style>
