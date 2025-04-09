<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import CircularLoader from "$lib/components/simple/loaders/CircularLoader.svelte";
</script>

<h1>CircularLoader</h1>
<ComponentSubtitle>Like a dog chasing his own tail.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <CircularLoader loading ></CircularLoader>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "loading", type: "boolean", description: "Determines if the loader is active.", default: "true" },
    { name: "class", type: "string", description: "Additional CSS classes for styling.", default: "''" }
  ]}
  styleProps={[
    { name: "--circular-loader-width", type: "size", description: "Width of the circular loader.", default: "30px" },
    { name: "--circular-loader-height", type: "size", description: "Height of the circular loader.", default: "30px" },
    { name: "--circular-loader-color", type: "color", description: "Color of the circular loader.", default: "var(global-color-primary-500)" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[]}
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>