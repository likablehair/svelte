<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import DashboardGridShaper from "$lib/components/simple/dashboards/DashboardGridShaper.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
</script>

<h1>DashboardGridShaper</h1>
<ComponentSubtitle>Shape new generation dashboards.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <DashboardGridShaper 
  ></DashboardGridShaper>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
  ]}
  styleProps={[
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