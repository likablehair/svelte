<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import HorizontalStackedProgress from "$lib/components/composed/progress/HorizontalStackedProgress.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
</script>

<h1>HorizontalStackedProgress</h1>
<ComponentSubtitle>Stacked progress.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <HorizontalStackedProgress
    progresses={[
      {
        label: 'Etichetta uno',
        value: 1000,
        color: 'grey',
      },
      {
        label: 'Etichetta due',
        value: 2000,
        color: 'rgb(var(--global-color-error-500))'
      },
      {
        label: 'Etichetta tre',
        value: 1200,
        color: 'rgb(var(--global-color-primary-500))'
      }
    ]}
    --horizontal-stacked-progress-width="300px"
    labelTextVisible={false}
  ></HorizontalStackedProgress>
  <HorizontalStackedProgress
    progresses={[
      {
        label: 'Etichetta uno',
        value: 100000,
        color: 'grey'
      },
      {
        label: 'Etichetta due',
        value: 2000,
        color: 'rgb(var(--global-color-error-500))',
      },
      {
        label: 'Etichetta tre',
        value: 12000,
        color: 'rgb(var(--global-color-primary-500))',
        valueLabel: 'pluto'
      }
    ]}
    --horizontal-stacked-progress-width="100%"
    hideLabelUnderPercentage={10}
  ></HorizontalStackedProgress>
  <HorizontalStackedProgress
    progresses={[
      {
        label: 'Etichetta uno',
        value: 1000,
        color: 'grey',
        valueLabel: 'pippo'
      },
      {
        label: 'Etichetta due',
        value: 2000,
        color: 'rgb(var(--global-color-error-500))'
      },
      {
        label: 'Etichetta tre',
        value: 1200,
        color: 'rgb(var(--global-color-primary-500))'
      }
    ]}
    --horizontal-stacked-progress-width="100%"
    labelVisible={false}
    legendVisible
  ></HorizontalStackedProgress>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "progresses", type: "(number | ProgressItem)[]", description: "An array of progress items or values to display.", default: "[]" },
    { name: "labelVisible", type: "boolean", description: "Controls the visibility of the label.", default: "true" },
    { name: "labelValueVisible", type: "boolean", description: "Controls the visibility of the label value.", default: "true" },
    { name: "labelTextVisible", type: "boolean", description: "Controls the visibility of the label text.", default: "true" },
    { name: "legendVisible", type: "boolean", description: "Controls the visibility of the legend.", default: "false" },
    { name: "legendValueVisible", type: "boolean", description: "Controls the visibility of the legend values.", default: "true" },
    { name: "legendTextVisible", type: "boolean", description: "Controls the visibility of the legend text.", default: "true" },
    { name: "hideLabelUnderPercentage", type: "number", description: "Percentage threshold to hide labels.", default: "undefined" }
  ]}
  styleProps={[
    { name: "--horizontal-stacked-progress-default-gap", type: "size", description: "Gap between stacked progress bars.", default: "4px" },
    { name: "--horizontal-stacked-progress-default-dot-height", type: "size", description: "Height of the dot representing progress.", default: "10px" },
    { name: "--horizontal-stacked-progress-default-dot-width", type: "size", description: "Width of the dot representing progress.", default: "10px" },
    { name: "--horizontal-stacked-progress-default-dot-min-width", type: "size", description: "Minimum width of the dot representing progress.", default: "10px" },
    { name: "--horizontal-stacked-progress-label-gap", type: "size", description: "Gap between label and progress bar.", default: "12px" },
    { name: "--horizontal-stacked-progress-legend-margin-top", type: "size", description: "Margin top for the legend.", default: "8px" },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer></SlotsViewer>
<h2>Events</h2>
<EventsViewer></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 20px;
  }
</style>