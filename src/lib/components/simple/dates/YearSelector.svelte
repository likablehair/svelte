<script lang="ts">
  import '../../../css/main.css'
  import './YearSelector.css'
  import { scrollAtCenter } from "$lib/components/simple/common/scroller";
  import { onMount, type Snippet } from "svelte";

  /*
    Styles

    --year-selector-height
    --year-selector-width
  */

  interface Props {
    selectedYear?: number | undefined;
    selectableYears?: number[];
    disabled?: boolean;
    class?: string
    onclick?: (event: {
      detail: {
        year: number
      }
    }) => void
    onchange?: (event: {
      detail: {
        year: number | undefined
      }
    }) => void
    selectorSnippet?: Snippet<[{
      year: number,
      handleYearClick: (year: number) => void
    }]>
    labelSnippet?: Snippet<[{
      year: number,
    }]>
  }

  let {
    selectedYear = $bindable(undefined),
    selectableYears = [...Array(150).keys()].map(
      (i) => i + (new Date().getFullYear() - 75)
    ),
    disabled = false,
    class: clazz = '',
    onchange,
    onclick,
    selectorSnippet,
    labelSnippet,
  }: Props = $props();

  let container: HTMLElement,
    targetButtons: { [k: string]: HTMLElement } = {};

  onMount(() => {
    if (selectedYear)
      scrollAtCenter(container, targetButtons[selectedYear], "auto");
  });

  function handleYearClick(year: number) {
    if(selectedYear === year) {
      selectedYear = undefined
    } else {
      selectedYear = year;
      scrollAtCenter(container, targetButtons[selectedYear], "smooth");
    }

    if(onclick){
      onclick({
        detail: {
          year
        }
      })
    }

    if(onchange){
      onchange({
        detail: {
          year: selectedYear
        }
      })
    }
  }
  import Button from "$lib/components/simple/buttons/Button.svelte";
</script>

<div bind:this={container} class="selector-container {clazz || ''}">
  {#each selectableYears as year}
    {#if selectorSnippet}
      {@render selectorSnippet({ year, handleYearClick })}
    {:else}
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
          onclick={() => handleYearClick(year)}
          disabled={disabled}
        >
          {#if labelSnippet}
            {@render labelSnippet({ year })}
          {:else}
            <div
              style:transition="all .1s"
              style:font-weight={year == selectedYear ? "700" : "400"}
              style:font-size={year == selectedYear ? "16pt" : "13pt"}
            >
              {year}
            </div>
          {/if}
        </Button>
      </div>
    {/if}
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
