<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import Switch from "$lib/components/simple/forms/Switch.svelte";

  let value: boolean
</script>

<h1>Switch</h1>
<ComponentSubtitle>Switching sides.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Switch bind:value={value} disabled/>

  <Switch bind:value={value} />
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "value", type: "boolean", description: "Current state of the switch", default: "undefined" },
    { name: "disabled", type: "boolean", description: "Whether the switch is disabled", default: "false" }
  ]}
  styleProps={[
    { name: "--switch-width", type: "size", description: "Width of the switch", default: "42px" },
    { name: "--switch-height", type: "size", description: "Height of the switch", default: "22px" },
    { name: "--switch-handle-width", type: "size", description: "Diameter of the switch handle", default: "16px" },
    { name: "--switch-handle-color", type: "color", description: "Color of the switch handle", default: "#ffffff" },
    { name: "--switch-translate-x", type: "size", description: "Translation distance when switched on", default: "20px" },
    { name: "--switch-active-box-shadow", type: "shadow", description: "Box shadow for the active state", default: "inset 0 0 0 2px rgb(var(--global-color-primary-500))" },
    { name: "--switch-active-background-color", type: "color", description: "Background color for the active state", default: "rgb(var(--global-color-primary-500))" },
    { name: "--switch-inactive-box-shadow", type: "shadow", description: "Box shadow for the inactive state", default: "inset 0 0 0 2px rgb(var(--global-color-contrast-200))" },
    { name: "--switch-inactive-background-color", type: "color", description: "Background color for the inactive state", default: "rgb(var(--global-color-contrast-50))" },
    { name: "--switch-disabled-inactive-box-shadow", type: "shadow", description: "Box shadow for the inactive disabled state", default: "inset 0 0 0 2px rgb(var(--global-color-contrast-400))" },
    { name: "--switch-disabled-inactive-background-color", type: "color", description: "Background color for the inactive disabled state", default: "rgb(var(--global-color-contrast-100))" },
    { name: "--switch-disabled-inactive-handle-color", type: "color", description: "Handle color for the inactive disabled state", default: "rgb(var(--global-color-contrast-400))" },
    { name: "--switch-disabled-active-box-shadow", type: "shadow", description: "Box shadow for the active disabled state", default: "inset 0 0 0 2px rgb(var(--global-color-primary-400))" },
    { name: "--switch-disabled-active-background-color", type: "color", description: "Background color for the active disabled state", default: "rgb(var(--global-color-primary-300))" },
    { name: "--switch-disabled-active-handle-color", type: "color", description: "Handle color for the active disabled state", default: "#eeeeee" }
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
      description: "Fired when the switch value changes",
      properties: [
        { name: "nativeEvent", type: "Event & { currentTarget: EventTarget & HTMLInputElement }", description: "The native DOM event" },
        { name: "value", type: "boolean", description: "The new state of the switch" }
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