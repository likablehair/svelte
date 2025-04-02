<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import VerticalSwitch from "$lib/components/simple/forms/VerticalSwitch.svelte";

</script>

<h1>VerticalSwitch</h1>
<ComponentSubtitle>Switching sides vertically.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <VerticalSwitch></VerticalSwitch>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "value", type: "boolean", description: "The current state of the switch (true or false)", default: "false" },
    { name: "rounded", type: "boolean", description: "If true, the switch will have rounded corners", default: "false" },
  ]}
  styleProps={[
    { name: "--vertical-switch-height", type: "size", description: "Height of the vertical switch", default: "60px" },
    { name: "--vertical-switch-width", type: "size", description: "Width of the vertical switch", default: "30px" },
    { name: "--vertical-switch-container-border-radius", type: "size", description: "Border radius of the switch container", default: "4px" },
    { name: "--vertical-switch-slider-border-radius", type: "size", description: "Border radius of the slider", default: "4px" },
    { name: "--vertical-switch-background-color", type: "color", description: "Background color of the switch", default: "#90CAF9" },
    { name: "--vertical-switch-selected-option-color", type: "color", description: "Color of the selected option", default: "#90CAF9" },
    { name: "--vertical-switch-slider-color", type: "color", description: "Color of the slider", default: "white" },
    { name: "--vertical-switch-option-color", type: "color", description: "Color of the options (1 and 0)", default: "white" },
    { name: "--vertical-switch-font-size", type: "size", description: "Font size for the options", default: "11px" },
    { name: "--vertical-switch-animation-duration", type: "time", description: "Duration of the switch animation", default: "0.1s" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "falseOptionSnippet", description: "Snippet for the false option", default: "0" },
    { name: "trueOptionSnippet", description: "Snippet for the true option", default: "1" }
  ]}
>
</SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onchange", description: "Event triggered when the value of the switch changes" }
  ]}
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