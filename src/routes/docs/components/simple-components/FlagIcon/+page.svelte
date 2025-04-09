<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import FlagIcon from "$lib/components/simple/media/FlagIcon.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
</script>

<h1>FlagIcon</h1>
<ComponentSubtitle>No to racism.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <FlagIcon alpha2="ua"></FlagIcon>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'alpha2', type: 'string', description: 'The 2-letter country code representing the flag to display.' },
    { name: 'class', type: 'string', description: 'Optional additional classes to apply to the flag icon.', default: 'undefined' }
  ]}
  styleProps={[
    { name: '--flag-icon-border-radius', type: 'size', description: 'The border radius of the flag icon.', default: '4px' },
    { name: '--flag-icon-font-size', type: 'size', description: 'The size of the flag icon.', default: '1.2rem' }
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