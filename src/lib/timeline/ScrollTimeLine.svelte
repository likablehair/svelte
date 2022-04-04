<script lang="ts" context="module">
  export type Period = {
    name: string,
    title?: string,
    subtitle?: string,
    from?: Date,
    to?: Date
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  export let 
    value: Period | undefined = undefined,
    periods: Period[] = [],
    sideMenuVisible: boolean = true,
    
    width: string = "500px",
    maxWidth: string = "100vw",
    minWidth: string = "initial",
    height: string = "300px",
    maxHeight: string = "100vh",
    minHeight: string = "initial"

  let 
    visiblePeriodIndex: number = 0, 
    oldTitle: string = undefined,
    newTitle: string = undefined,
    oldTitleTop: string = '0%',
    newTitleTop: string = '100%'

  onMount(() => {
    if(!value) value = periods[0]

    if(!!value) {
      oldTitle = value.title
    }
  })

  function animateTitle(oldTitle, newTitle) {

  }

  function handleSwipeUp(detail) {
  }

  function handleSwipeDown(detail) {
  }

  $: if(!!value && periods.length > 0) {
      visiblePeriodIndex = periods.findIndex((period) => period.name == value.name)
    }
  import Gesture from '$lib/common/Gesture.svelte'
</script>

<style>
  .timeline-container {
    display: flex;
    flex-direction: column;
  }
</style>

<Gesture
  on:swipe-up={handleSwipeUp}
  on:swipe-down={handleSwipeDown}
></Gesture>

<div 
  style:width={width}
  style:maxWidth={maxWidth}
  style:minWidth={minWidth}
  style:height={height}
  style:maxHeight={maxHeight}
  style:minHeight={minHeight}
  class="timeline-container"
>
  <div style:display="flex">
    {#if sideMenuVisible}
      <div class="side-menu shrink">
        {#if !!value}
          {value.from?.getFullYear()} - {value.to?.getFullYear()}
        {/if}
      </div>
    {/if}
    <div class="slide grow">
      {#if !!value}
        <div 
          style:height="64px"
          style:overflow="hidden"
          style:position="relative"
        >
          <div 
            style:height="100%"
            style:position="absolute"
            style:top={oldTitleTop}
            class="old-title"
          >
            {oldTitle}
          </div>
          <div 
            style:height="100%"
            style:position="absolute"
            style:top={newTitleTop}
            class="new-title"
          >
            {newTitle}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

