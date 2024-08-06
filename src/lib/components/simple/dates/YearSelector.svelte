<script lang="ts">
  import '../../../css/main.css'
  import './YearSelector.css'
  import { scrollAtCenter } from "$lib/components/simple/common/scroller";
  import { createEventDispatcher, onMount } from "svelte";

  /*
    Styles

    --year-selector-height
    --year-selector-width
  */

  let clazz: string | undefined = undefined;
	export { clazz as class };

  export let selectedYear: number | undefined = undefined,
    selectableYears: number[] = [...Array(150).keys()].map(
      (i) => i + (new Date().getFullYear() - 75)
    ),
    disabled: boolean = false

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
    change: {
      year: number | undefined
    }
  }>();

  function handleYearClick(year: number) {
    if(selectedYear === year) {
      selectedYear = undefined
    } else {
      selectedYear = year;
      scrollAtCenter(container, targetButtons[selectedYear], "smooth");
    }

    dispatch("click", {
      year,
    })
    dispatch("change", {
      year: selectedYear
    })
  }
  import Button from "$lib/components/simple/buttons/Button.svelte";
</script>

<div bind:this={container} class="selector-container {clazz || ''}">
  {#each selectableYears as year}
    <slot name="selector" {year} {handleYearClick}>
      <div bind:this={targetButtons[year]} style:width="100%">
        <Button
          --button-background-color={year == selectedYear ? "rgb(var(--global-color-primary-500))" : "trasparent"}
          --button-active-background-color={year == selectedYear ? "rgb(var(--global-color-primary-500))" : "trasparent"}
          --button-focus-background-color={year == selectedYear ? "rgb(var(--global-color-primary-500))" : "trasparent"}
          --button-hover-background-color={year == selectedYear ? "var(--button-background-color)" : "rgb(var(--global-color-primary-500), .2)"}
          --button-color={year == selectedYear ?  "rgb(var(--global-color-grey-50))" : undefined}
          --button-font-weight="500"
          --button-width="var(--year-selector-width, var(--year-selector-default-width))"
          --button-padding=".5rem 0px"
          buttonType="text"
          on:click={() => handleYearClick(year)}
          disabled={disabled}
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
    height: var(
      --year-selector-height,
      var(--year-selector-default-height)
    );
    max-height: var(
      --year-selector-max-height,
      var(--year-selector-default-max-height)
    );
    width: var(
      --year-selector-width,
      var(--year-selector-default-width)
    );
  }
</style>
