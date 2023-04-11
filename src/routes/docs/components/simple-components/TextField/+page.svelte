<script lang="ts">
  import FinalButton from "../../../FinalButton.svelte";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import colors from "../../../stores/colors";
  import EventsViewer from "../../EventsViewer.svelte";

  import Textfield from "$lib/components/simple/forms/Textfield.svelte";
</script>

<h1>TextField</h1>
<ComponentSubtitle>wip</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Textfield
  ></Textfield>
</div>
<h2>Props</h2>
<PropsViewer
  props={[]}
  styleProps={[]}
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
  }
</style>