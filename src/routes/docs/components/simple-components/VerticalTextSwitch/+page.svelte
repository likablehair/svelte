<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import VerticalTextSwitch from "$lib/components/simple/forms/VerticalTextSwitch.svelte";

</script>

<h1>VerticalTextSwitch</h1>
<ComponentSubtitle>Switching sides vertically and with text.</ComponentSubtitle>
<h2>Example</h2>
<div class="example" style="height: 100px;">
  <VerticalTextSwitch>
    {#snippet falseOptionSnippet()}
      false
    {/snippet}
    {#snippet trueOptionSnippet()}
      true
    {/snippet}
  </VerticalTextSwitch>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "value", type: "boolean", description: "The value of the switch (true or false)", default: "false" },
    { name: "height", type: "size", description: "Height of the switch", default: "100%" },
    { name: "width", type: "size", description: "Width of the switch", default: "100%" },
    { name: "backgroundColor", type: "color", description: "Background color of the switch", default: "undefined" },
    { name: "firstColor", type: "color", description: "Color for the first option", default: "undefined" },
    { name: "secondColor", type: "color", description: "Color for the second option", default: "firstColor" },
    { name: "fontSize", type: "size", description: "Font size for the options", default: "12px" },
    { name: "hoverBackgroundColor", type: "color", description: "Background color on hover", default: "undefined" },
    { name: "hoverBoxShadow", type: "string", description: "Box shadow effect on hover", default: "undefined" },
    { name: "animationDuration", type: "number", description: "Duration of the animation in milliseconds", default: "200" },
    { name: "falseOptionSnippet", type: "Snippet", description: "Snippet for the false option", default: "undefined" },
    { name: "trueOptionSnippet", type: "Snippet", description: "Snippet for the true option", default: "undefined" }
  ]}
  styleProps={[
    { name: "--vertical-text-switch-height", type: "size", description: "Height of the vertical text switch", default: "100%" },
    { name: "--vertical-text-switch-hover-background-color", type: "color", description: "Background color on hover", default: "undefined" },
    { name: "--vertical-text-switch-hover-box-shadow", type: "string", description: "Box shadow effect on hover", default: "undefined" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "falseOptionSnippet", description: "Snippet for the false option", },
    { name: "trueOptionSnippet", description: "Snippet for the true option", }
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