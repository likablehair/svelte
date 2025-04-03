<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Skeleton from "$lib/components/simple/loaders/Skeleton.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
</script>

<h1>Skeleton</h1>
<ComponentSubtitle>Bones in your closet.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Skeleton
    --skeleton-card-height="100px"
  ></Skeleton>
</div>
<h2>Props</h2>
<PropsViewer
  props={[]}
  styleProps={[
    { name: "--skeleton-card-background", type: "color", description: "Background color of the skeleton.", default: "rgb(var(--global-color-background-200))" },
    { name: "--skeleton-animation-color", type: "color", description: "Color of the skeleton animation effect.", default: "rgb(var(--global-color-background-400))" },
    { name: "--skeleton-card-width", type: "size", description: "Width of the skeleton.", default: "100%" },
    { name: "--skeleton-card-height", type: "size", description: "Height of the skeleton.", default: "100%" },
    { name: "--skeleton-card-max-width", type: "size", description: "Maximum width of the skeleton.", },
    { name: "--skeleton-card-max-height", type: "size", description: "Maximum height of the skeleton.", },
    { name: "--skeleton-card-min-width", type: "size", description: "Minimum width of the skeleton.", },
    { name: "--skeleton-card-min-height", type: "size", description: "Minimum height of the skeleton.", },
    { name: "--skeleton-card-padding", type: "size", description: "Padding inside the skeleton.", }
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
    gap: 10px;
    margin-bottom: 20px;
  }
</style>