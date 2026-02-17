<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import PeriodPicker from "$lib/components/composed/forms/PeriodPicker.svelte";

</script>

<h1>PeriodPicker</h1>
<ComponentSubtitle>What period are you going through?</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <PeriodPicker
  ></PeriodPicker>
</div>

<h2>Props</h2>
<PropsViewer
  props={[
  
  ]}
  styleProps={[
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin-bottom: 20px;
  }
</style>