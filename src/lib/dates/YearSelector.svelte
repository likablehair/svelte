<script lang="ts">
  import { scrollAtCenter } from "$lib/common/scroller";
  import { createEventDispatcher, onMount } from "svelte";

  export let selectedYear: number | undefined = undefined,
    selectableYears: number[] = [...Array(150).keys()].map(
      (i) => i + (new Date().getFullYear() - 75)
    ),
    height = "100%",
    width = "100%";

  let container: HTMLElement,
    targetButtons: { [k: string]: HTMLElement } = {};

  onMount(() => {
    if (selectedYear)
      scrollAtCenter(container, targetButtons[selectedYear], "auto");
  });

  const dispatch = createEventDispatcher<{
    click: {
      year: number;
    };
  }>();

  function handleYearClick(year: number) {
    selectedYear = year;

    scrollAtCenter(container, targetButtons[selectedYear], "smooth");

    dispatch("click", {
      year,
    });
  }
  import Button from "$lib/buttons/Button.svelte";
</script>

<div bind:this={container} style:height style:width class="selector-container">
  {#each selectableYears as year}
    <slot name="selector" {year}>
      <div bind:this={targetButtons[year]}>
        <Button
          height="30px"
          active={year == selectedYear}
          display="flex"
          alignItems="center"
          justifyContent="center"
          on:click={() => handleYearClick(year)}
        >
          <slot name="label" {year}>
            <div
              style:transition="all .1s"
              style:font-weight={year == selectedYear ? "700" : "400"}
              style:font-size={year == selectedYear ? "16pt" : "13pt"}
            >
              {year}
            </div>
          </slot>
        </Button>
      </div>
    </slot>
  {/each}
</div>

<style>
  .selector-container {
    overflow-y: auto;
  }
</style>
