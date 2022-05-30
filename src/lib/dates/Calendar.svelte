<script lang="ts">
  import { onMount } from 'svelte';
  import { getDateRowsStats, getMonthName } from './utils'
  import type { DateStat } from './utils';

  export let selectedDate: Date = undefined,
    visibleMonth: number = new Date().getMonth(),
    visibleYear: number = new Date().getFullYear(),
    showExtraMonthDays: boolean = true,
    height: string = "100%",
    width: string = "100%",
    dayWidth: string = '30px',
    dayHeight: string = '30px',
    dayHoverColor: string = '#c9c8c873',
    daySelectedColor: string = '#adadad',
    dayBackgroundColor: string = undefined

  onMount(() => {

  })

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{
    "day-click": {
      dateStat: DateStat,
      selected: boolean,
      extraMonth: boolean
    }
  }>()

  function handleDayClick(dateStat: DateStat, extraMonth: boolean) {
    if(!extraMonth) {
      selectedDate = new Date(dateStat.year, dateStat.month, dateStat.dayOfMonth, 0, 0, 0, 0)
    }

    dispatch('day-click', {
      dateStat: dateStat,
      selected: !extraMonth,
      extraMonth: extraMonth
    })
  }
</script>

<div 
  style:height={height}
  style:width={width}
>
  <div class="grid-layout">
    {#each ['L', 'M', 'M', 'G', 'V', 'S', 'D'] as weekHeader, index}
      <slot
        name="weekHeader"
        header={weekHeader}
        index={index}
      >
        <div
          class="week-header-slot"
        >{weekHeader}</div>
      </slot>
    {/each}
    {#each getDateRowsStats(visibleMonth, visibleYear) as day}
      {@const selected = !!selectedDate && selectedDate.getDate() == day.dayOfMonth && selectedDate.getMonth() == day.month && selectedDate.getFullYear() == day.year}
      {@const extraMonth = day.month != visibleMonth}
      <slot 
        name="day" 
        dayStat={day}
        extraMonth={extraMonth}
        selected={selected}
      >
        {#if (!showExtraMonthDays && day.month == visibleMonth) || showExtraMonthDays }  
          <div
            style:border-radius="50%"
            style:background-color={dayBackgroundColor}
            style:height={dayHeight}
            style:width={dayWidth}
            style:cursor={extraMonth ? 'default' : 'pointer'}
            style:--calendar-hover-color={extraMonth ? '' : dayHoverColor}
            style:--calendar-selected-color={daySelectedColor}
            class="day-slot"
            class:extra-month={extraMonth}
            class:selected={selected}
            class:not-selected={!selected}
            on:click={() => handleDayClick(day, extraMonth)}
          >{day.dayOfMonth}</div>
        {:else}
          <div></div>
        {/if}
      </slot>
    {/each}
  </div>
</div>

<style>

.grid-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1px;
}

.day-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  justify-self: center;
  align-self: center;
  transition: background-color .1s ease-in;
}

.extra-month {
  opacity: 30%;
}

.selected {
  background-color: var(--calendar-selected-color);
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
