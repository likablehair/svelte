<script lang="ts">
  import { scrollAtCenter } from "$lib/common/scroller"
  import { createEventDispatcher, onMount } from 'svelte';

  export let selectedYear: number = undefined,
    selectableYears: number[] = [...Array(150).keys()].map(i => i + (new Date().getFullYear() - 75)),
    height: string = "100%",
    width: string = "100%";

  let container: HTMLElement, targetButtons: { [k: string]: HTMLElement }  = {}
  onMount(() => {
    console.log({...targetButtons})
    container.scroll({
      top: targetButtons[selectedYear].offsetTop,
      behavior: "smooth"
    })
    // scrollAtCenter(container, targetButtons[selectedYear])
  })
  
  const dispatch = createEventDispatcher<{
    "click": {
      year: number,
    }
  }>()

  function handleYearClick(year: number) {
    selectedYear = year

    dispatch('click', {
      year
    })
  }
  import Button from '$lib/buttons/Button.svelte';
</script>

<div 
  style:height={height}
  style:width={width}
  class="selector-container"
>
  {#each selectableYears as year}
    <slot
      name="selector"
      year={year}
    >
      <div
        bind:this={targetButtons[selectedYear]}
      >
        <Button 
          height="30px"
          active={year == selectedYear}
          display="flex"
          alignItems="center"
          justifyContent="center"
          on:click={() => handleYearClick(year)}
        >
          <slot
            name="label"
            year={year}
          >
            <div
              style:transition="all .1s"
              style:font-weight={year == selectedYear ? '700' : '400'}
              style:font-size={year == selectedYear ? '16pt' : '13pt'}
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