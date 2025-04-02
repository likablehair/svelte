<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import Divider from "$lib/components/simple/common/Divider.svelte";
</script>

<h1>Divider</h1>
<ComponentSubtitle>Wasn't meant to be together</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div style="width: 100%;">
    <Divider
      --divider-color='rgb(var(--global-color-contrast-900))'
    ></Divider>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  styleProps={[
    { name: 'divider-color', type: 'color', description: 'The background color of the divider.', default: 'rgb(var(--global-color-background-500))' },
    { name: 'divider-weight', type: 'size', description: 'The weight (height) of the divider.', default: '1px' },
    { name: 'divider-radius', type: 'size', description: 'The border radius of the divider.', default: '0.5px' },
    { name: 'divider-margin-top', type: 'size', description: 'The top margin of the divider.', default: '10px' },
    { name: 'divider-margin-bottom', type: 'size', description: 'The bottom margin of the divider.', default: '10px' },
    { name: 'divider-margin-left', type: 'size', description: 'The left margin of the divider.', default: '5px' },
    { name: 'divider-margin-right', type: 'size', description: 'The right margin of the divider.', default: '5px' }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
</style>