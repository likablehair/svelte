<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import ProgressBar from "$lib/components/simple/progress/ProgressBar.svelte";
  import HorizontalStackedProgress, { type ProgressItem } from "$lib/components/composed/progress/HorizontalStackedProgress.svelte";
  import { onMount } from "svelte";

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
    // {
    //   name: 'type',
    //   type: '"button" | "submit"',
    //   description: "HTML type attribute",
    //   default: "button"
    // }
  ]}
  styleProps={[
    // {
    //   name: '--button-max-width',
    //   type: 'string',
    //   default: 'undefined',
    //   description: 'The max width of the outer element'
    // }
  ]}
></PropsViewer>
<h2>Slots</h2>
<h2>Events</h2>

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