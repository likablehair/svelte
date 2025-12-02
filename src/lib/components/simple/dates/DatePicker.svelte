<script lang="ts">
  import '../../../css/main.css'
  import './DatePicker.css'
  import { getMonthName, dateToString } from "./utils";
  import type { Locale } from "./utils";
  import YearSelector from "./YearSelector.svelte";
  import MonthSelector from "./MonthSelector.svelte";
  import Calendar from "./Calendar.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import type { ComponentProps } from 'svelte';

  interface Props {
    selectedYear?: number;
    selectedMonth?: number;
    selectedDate?: Date;
    selectedDateTo?: Date;
    visibleMonth?: number;
    visibleYear?: number;
    view?: "year" | "month" | "day";
    type?: ComponentProps<typeof Calendar>['type']
    locale?: Locale;
    selectableYears?: number[];
    skipTabs?: boolean;
    disabled?: boolean;
    class?: {
      container?: string,
      header?: string,
      selectorRow?: string
    }
    onyearClick?: (event: {
      detail: {
        year: number
      }
    }) => void
    onmonthClick?: (event: {
      detail: {
        month: number
      }
    }) => void
    ondayClick?: ComponentProps<typeof Calendar>['ondayClick']
  }

  let {
    selectedYear = $bindable(new Date().getFullYear()),
    selectedMonth = $bindable(new Date().getMonth()),
    selectedDate = $bindable(undefined),
    selectedDateTo = $bindable(undefined),
    visibleMonth = $bindable(selectedMonth),
    visibleYear = $bindable(selectedYear),
    view = "day",
    locale = "it",
    selectableYears = [...Array(150).keys()].map((i) => i + (new Date().getFullYear() - 75)),
    skipTabs = false,
    disabled = false,
    type,
    class: clazz = {},
    onmonthClick,
    onyearClick,
    ondayClick,
  }: Props = $props();

  let visibleSelector = $derived(view == "day" || view == "month");
  let selectorText =
    $derived(view == "day"
      ? getMonthName(visibleMonth, locale) + " " + visibleYear
      : visibleYear.toString()
    )
  let elementDisabled = $derived(view == "year" ? "year" : "date");
  let lastSelectedYear: number = selectedYear

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
    if(visibleYear == undefined) {
      visibleYear = lastSelectedYear
    }
    else {
      lastSelectedYear = visibleYear
    }

    visibleYear = selectedYear

    if(onyearClick){
      onyearClick({
        detail: {
          year: selectedYear
        }
      })
    }

    view = "month";
  }

  function handleMonthChange() {
    visibleMonth = selectedMonth

    if(onmonthClick){
      onmonthClick({
        detail: {
          month: selectedMonth
        }
      })
    }

    view = "day";
  }
</script>

<div
  class="date-picker-container {clazz.container || ''}"
>
  <div
    class="header {clazz.header || ''}"
  >
    <button
      class:disabled={elementDisabled == "year"}
      onclick={() => {
        view = "year";
      }}
      onkeypress={() => {
        view = "year";
      }}
      class="unstyled year"
      tabindex={skipTabs ? -1 : undefined}
    >{visibleYear}</button>
    <button
      class:disabled={elementDisabled == "date"}
      onclick={() => {
        view = "day";
      }}
      onkeypress={() => {
        view = "day";
      }}
      class="unstyled day"
      tabindex={skipTabs ? -1 : undefined}
    >
      {#if !!selectedDate && !selectedDateTo}
        {dateToString(selectedDate, "dayAndMonth", locale)}
      {:else if !!selectedDate && !!selectedDateTo}
        {dateToString(selectedDate, "dayAndMonth", locale)} - {dateToString(selectedDateTo, "dayAndMonth", locale)}
      {/if}
    </button>
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
            onclick={previous}
            tabindex={skipTabs ? -1 : undefined}
          />
        </div>
        <div class="row-elem selector">
          {#key selectorText}
            <button
              class="unstyled selector-text"
              onclick={SelectorHandler}
              onkeypress={SelectorHandler}
              tabindex={skipTabs ? -1 : undefined}
            >
              {selectorText}
            </button>
          {/key}
        </div>
        <div class="row-elem">
          <Button
            --button-background-color="transparent"
            buttonType="icon"
            --icon-size="25pt"
            icon="mdi-chevron-right"
            onclick={next}
            tabindex={skipTabs ? -1 : undefined}
          />
        </div>
      </div>
    {/if}
    {#if view == "month"}
      <MonthSelector
        --month-selector-height="calc((var(--date-picker-height, var(--date-picker-default-height)) / 8 * 5) - 10px)"
        --month-selector-width="var(--date-picker-width, var(--date-picker-default-width))"
        bind:selectedMonth={selectedMonth}
        onclick={handleMonthChange}
        {locale}
      />
    {:else if view == "year"}
      <YearSelector
        --year-selector-height="calc(var(--date-picker-height, var(--date-picker-default-height)) - calc(var(--date-picker-height, var(--date-picker-default-height)) / 4))"
        bind:selectedYear={selectedYear}
        {selectableYears}
        onclick={handleYearChange}
      />
    {:else}
      <Calendar
        --calendar-height="calc((var(--date-picker-height, var(--date-picker-default-height)) / 8 * 5) - 10px)"
        --calendar-width="var(--date-picker-width, var(--date-picker-default-width))"
        bind:visibleMonth={visibleMonth}
        bind:visibleYear={visibleYear}
        bind:selectedDate
        bind:selectedDateTo
        {type}
        {locale}
        disabled={disabled}
        {ondayClick}
      />
    {/if}
  </div>
</div>

<style>
  .date-picker-container {
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
    overflow: var(
      --date-picker-overflow,
      var(--date-picker-default-overflow)
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
  .header > button.day {
    margin-left: 15px;
    margin-top: 5px;
    transition: 0.1s;
    opacity: 0.8;
    display: block;
    font-size: 1.3rem;
    font-weight: 700;
  }
  .header > button.day:hover {
    opacity: 1;
    cursor: pointer;
  }
  .header > button.day:focus, .header > button.day:active {
    text-decoration: underline;
  }
  .header > button.year {
    display: inline-block;
    line-height: 100%;
    margin-left: 15px;
    margin-top: 10px;
    opacity: 0.8;
    transition: 0.1s;
  }
  .header > button.year:hover {
    opacity: 1;
    cursor: pointer;
  }
  .header > button.year:focus, .header > button.year:active {
    text-decoration: underline;
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

  .selector-text:active, .selector-text:focus {
    color: rgb(var(--global-color-primary-500));
  }

  button.unstyled {
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
  }
</style>
