<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import NoData from "$lib/components/simple/common/NoData.svelte";
</script>

<h1>NoData</h1>
<ComponentSubtitle>Nothing to see here.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <NoData></NoData>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: 'lang',
      type: `'it' | 'en'`,
      description: 'Language used to determine default no-data text.',
      default: `'en'`
    },
    {
      name: 'noItemsText',
      type: 'string',
      description: 'Text to display when there is no data available.',
      default: `'No data available' | 'Nessun dato disponibile' (based on lang)`
    },
    {
      name: 'iconName',
      type: 'string',
      description: 'Name of the MDI icon to display next to the text.',
      default: `'mdi-database-off'`
    },
    {
      name: 'class',
      type: 'string',
      description: 'Class to apply to the text element.'
    }
  ]}
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