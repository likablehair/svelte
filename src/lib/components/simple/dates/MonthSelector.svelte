<script lang="ts">
  import './MonthSelector.css'
  import type { Locale } from "./utils";
  import { getMonthName } from "./utils";

  /*
    Styles

    --month-selector-height
    --month-selector-width
  */

  let clazz: {
    buttons?: string,
    container?: string,
  } = {};
	export { clazz as class };

  export let selectedMonth: number | undefined = undefined,
    locale: Locale = "it"

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
  import Button from "$lib/components/simple/buttons/Button.svelte";
</script>

<div class="selector-container {clazz.container || ''}">
  {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as monthIndex}
    <slot
      name="selector"
      month={monthIndex}
      monthName={getMonthName(monthIndex, locale)}
    >
      <Button
        --button-background-color={monthIndex == selectedMonth ? "rgb(var(--global-color-primary-500))" : "trasparent"}
        --button-hover-background-color={monthIndex == selectedMonth ? "var(--button-background-color)" : "rgb(var(--global-color-primary-500), .2)"}
        --button-color={monthIndex == selectedMonth ?  "rgb(var(--global-color-grey-50))" : undefined}
        --button-font-weight="500"
        class={clazz.buttons}
        buttonType="text"
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
    height: var(
      --month-selector-height,
      var(--month-selector-default-height)
    );
    width: var(
      --month-selector-width,
      var(--month-selector-default-width)
    );
  }
</style>
