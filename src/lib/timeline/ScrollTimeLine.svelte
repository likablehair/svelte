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
    progress: number = 0,
    periods: Period[] = [],
    progressVisible: boolean = true,
    sideMenuVisible: boolean = true,
    
    width: string = "500px",
    maxWidth: string = "100vw",
    minWidth: string = "initial",
    height: string = "300px",
    maxHeight: string = "100vh",
    minHeight: string = "initial",
    progressBackgroundColor: string = undefined,
    progressColor: string = undefined

  let visiblePeriodIndex: number = 0

  onMount(() => {
    if(!value) value = periods[0]
  })

  function handleSwipeUp(detail) {
  }

  function handleSwipeDown(detail) {
  }

  $: if(!!value && periods.length > 0) {
      visiblePeriodIndex = periods.findIndex((period) => period.name == value.name)
    }
  import Gesture from '$lib/common/Gesture.svelte'
  import ProgressBar from '$lib/progress/ProgressBar.svelte'
  import '$lib/common/tailwind.css'
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
  {#if progressVisible}
    <ProgressBar
      value={progress}
      backgroundColor={progressBackgroundColor}
      color={progressColor}
    ></ProgressBar>
  {/if}
  <div style="display: flex;">
    {#if sideMenuVisible}
      <div class="side-menu shrink">
        {#if !!value}
          {value.from?.getFullYear()} - {value.to?.getFullYear()}
        {/if}
      </div>
    {/if}
    <div class="slide grow">
      {#if !!value}
        <h1>{value.title}</h1>
      {/if}
    </div>
  </div>
</div>

