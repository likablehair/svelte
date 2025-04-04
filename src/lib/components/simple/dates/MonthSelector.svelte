<script lang="ts">
  import '../../../css/main.css'
  import './MonthSelector.css'
  import type { Locale } from "./utils";
  import { getMonthName } from "./utils";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import type { Snippet } from 'svelte';

  interface Props {
    selectedMonth?: number | undefined;
    locale?: Locale
    class?: {
      buttons?: string,
      container?: string,
    }
    onclick?: (event: {
      detail: {
        monthIndex: number
      }
    }) => void
    selectorSnippet?: Snippet<[{
      month: number,
      monthName: string
    }]>
    labelSnippet?: Snippet<[{
      month: number,
      monthName: string
    }]>
  }

  let {
    selectedMonth = $bindable(undefined),
    locale = "it",
    class: clazz = {},
    onclick,
    selectorSnippet,
    labelSnippet,
  }: Props = $props();


  function handleMonthClick(monthIndex: number) {
    selectedMonth = monthIndex;

    if(onclick){
      onclick({
        detail: {
          monthIndex
        }
      })
    }
  }
</script>

<div class="selector-container {clazz.container || ''}">
  {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as monthIndex}
    {#if selectorSnippet}
      {@render selectorSnippet({ month: monthIndex, monthName: getMonthName(monthIndex, locale) })}
    {:else}
      <Button
        --button-background-color={monthIndex == selectedMonth ? "rgb(var(--global-color-primary-500))" : "trasparent"}
        --button-focus-background-color={monthIndex == selectedMonth ? "rgb(var(--global-color-primary-500))" : "trasparent"}
        --button-hover-background-color={monthIndex == selectedMonth ? "var(--button-background-color)" : "rgb(var(--global-color-primary-500), .2)"}
        --button-color={monthIndex == selectedMonth ?  "rgb(var(--global-color-grey-50))" : undefined}
        --button-font-weight="500"
        class={clazz.buttons}
        buttonType="text"
        onclick={() => handleMonthClick(monthIndex)}
      >
        {#if labelSnippet}
          {@render labelSnippet({ month: monthIndex, monthName: getMonthName(monthIndex, locale) })}
        {:else}
          {getMonthName(monthIndex, locale)}
        {/if}
      </Button>
    {/if}
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
