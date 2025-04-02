<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Switch from "$lib/components/simple/forms/Switch.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";

  let value: boolean
</script>

<h1>Switch</h1>
<ComponentSubtitle>Switching sides.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Switch label='Switch' bind:value={value}/>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "label", type: "string", description: "Label for the switch", default: "''" },
    { name: "value", type: "boolean", description: "Current state of the switch", default: "undefined" },
    { name: "disabled", type: "boolean", description: "Whether the switch is disabled", default: "false" }
  ]}
  styleProps={[
    { name: "--switch-padding", type: "spacing", description: "Padding inside the switch", default: "1px" },
    { name: "--switch-width", type: "size", description: "Width of the switch", default: "40px" },
    { name: "--switch-background-color", type: "color", description: "Background color of the switch", default: "rgb(var(--global-color-background-300), 0.5)" },
    { name: "--switch-border-radius", type: "size", description: "Border radius of the switch", default: "9999px" },
    { name: "--switch-box-shadow", type: "shadow", description: "Box shadow applied to the switch", default: "none" },
    { name: "--switch-active-toggle-color", type: "color", description: "Color of the toggle when active", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--switch-active-background-color", type: "color", description: "Background color when switch is active", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--switch-inactive-toggle-color", type: "color", description: "Color of the toggle when inactive", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--switch-inactive-background-color", type: "color", description: "Background color when switch is inactive", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--switch-label-width", type: "size", description: "Width of the switch label", default: "'auto'" },
    { name: "--switch-font-size", type: "typography", description: "Font size of the switch label", default: "16px" },
    { name: "--switch-gap", type: "spacing", description: "Gap between elements inside the switch", default: "0.5em" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[]}
>
</SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { 
      name: "onchange", 
      description: "Triggered when the switch state changes", 
      properties: [
        { name: "label", type: "string", description: "Label of the switch" },
        { name: "value", type: "boolean", description: "New state of the switch" }
      ] 
    }
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