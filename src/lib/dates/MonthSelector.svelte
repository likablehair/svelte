<script lang="ts">
  import type { Locale } from './utils'
  import { getMonthName } from './utils'

  export let selectedMonth: number = undefined,
    locale: Locale = 'it',
    height: string = "100%",
    width: string = "100%",
    monthSelectedColor: string = '#adadad',
    monthSelectedTextColor: string = '#21a';
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{
    "click": {
      monthIndex: number,
    }
  }>()

  function handleMonthClick(monthIndex: number) {
    selectedMonth = monthIndex

    dispatch('click', {
      monthIndex
    })
  }
  import Button from '$lib/buttons/Button.svelte';
</script>

<div 
  style:height={height}
  style:width={width}
  class="selector-container"
>
  {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as monthIndex}
    <slot
      name="selector"
      month={monthIndex}
      monthName={getMonthName(monthIndex, locale)}
    >
      <Button 
        active={monthIndex == selectedMonth}
        display="flex"
        alignItems="center"
        justifyContent="center"
        activeBackgroundColor={monthSelectedColor}
        color={monthIndex == selectedMonth ? monthSelectedTextColor : null}
        on:click={() => handleMonthClick(monthIndex)}
      >
        <slot
          name="label"
          month={monthIndex}
          monthName={getMonthName(monthIndex, locale)}
        >
          {getMonthName(monthIndex, locale)}
        </slot>
      </Button>
    </slot>
  {/each}
</div>

<style>
  .selector-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px;
  }
</style>