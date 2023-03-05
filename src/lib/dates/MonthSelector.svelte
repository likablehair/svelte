<script lang="ts">
  import type { Locale } from "./utils";
  import { getMonthName } from "./utils";

  export let selectedMonth: number | undefined = undefined,
    locale: Locale = "it",
    height = "100%",
    width = "100%",
    monthSelectedColor = "#adadad",
    monthSelectedTextColor = "#21a";

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher<{
    click: {
      monthIndex: number;
    };
  }>();

  function handleMonthClick(monthIndex: number) {
    selectedMonth = monthIndex;

    dispatch("click", {
      monthIndex,
    });
  }
  import Button from "$lib/buttons/Button.svelte";
</script>

<div style:height style:width class="selector-container">
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
