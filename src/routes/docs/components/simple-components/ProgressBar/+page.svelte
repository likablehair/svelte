<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import ProgressBar from "$lib/components/simple/progress/ProgressBar.svelte";
  import HorizontalStackedProgress, { type ProgressItem } from "$lib/components/composed/progress/HorizontalStackedProgress.svelte";
  import { onMount } from "svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";

  let progress: ProgressItem[] = [
    { label: 'Prova 1', color: 'red', value: Math.round(Math.random() * 10)},
    { label: 'Prova 2', color: 'green', value: Math.round(Math.random() * 10)},
    { label: 'Prova 3', color: 'purple', value: Math.round(Math.random() * 10)}
  ],
    progressBar = 50

  onMount(() => {
    setInterval(() => {
      progress[0].value = Math.round(Math.random() * 10)
      progress[1].value = Math.round(Math.random() * 10)
      progress[2].value = Math.round(Math.random() * 10)
      progressBar = Math.round(Math.random() * 100)
    }, 2000)
  })
</script>

<h1>ProgressBar</h1>
<ComponentSubtitle>Makes some progress to get there.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div class="progress-bar-container">
    <ProgressBar
      value={progressBar}
    ></ProgressBar>
  </div>
  <div class="horizontal-stacked-progress-container">
    <HorizontalStackedProgress
      progresses={progress}
    ></HorizontalStackedProgress>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'value', type: 'number', description: 'Current value of the progress bar', default: '0' },
    { name: 'total', type: 'number', description: 'Total value for the progress bar', default: '100' },
    { name: 'valueTooltip', type: 'boolean', description: 'Toggle the visibility of the tooltip', default: 'false' },
    { name: 'valueTooltipLabel', type: 'string | number', description: 'Custom label for the tooltip', default: 'undefined' }
  ]}
  styleProps={[
    { name: '--progress-bar-background-color', type: 'color', description: 'Background color of the progress bar', default: 'rgb(var(--global-color-background-300), .3)' },
    { name: '--progress-bar-highlight-color', type: 'color', description: 'Highlight color of the progress bar', default: 'rgb(var(--global-color-primary-500))' },
    { name: '--progress-bar-height', type: 'size', description: 'Height of the progress bar', default: '5px' },
    { name: '--progress-bar-width', type: 'size', description: 'Width of the progress bar', default: '100%' },
    { name: '--progress-bar-border-radius', type: 'size', description: 'Border radius for the progress bar', default: '2px' },
    { name: '--progress-bar-tooltip-background-color', type: 'color', description: 'Background color of the tooltip', default: 'rgb(var(--global-color-background-100))' },
    { name: '--progress-bar-tooltip-border-radius', type: 'size', description: 'Border radius of the tooltip', default: '8px' }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer></EventsViewer>

<style>
  .example {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .progress-bar-container {
    width: 200px;
  }

  .horizontal-stacked-progress-container {
    width: 100%;
    margin-top: 40px;
  }
</style>