<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import CollapsibleDivider from "$lib/components/simple/common/CollapsibleDivider.svelte";
</script>

<h1>CollapsibleDivider</h1>
<ComponentSubtitle>Make everything collapsable</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <CollapsibleDivider
  ></CollapsibleDivider>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "collapsed", type: "boolean", description: "Controls whether the divider is collapsed", default: "$bindable(false)" },
    { name: "openedIconName", type: "string", description: "Icon name when the divider is opened", default: `"mdi-chevron-left"` },
    { name: "collapsedIconName", type: "string", description: "Icon name when the divider is collapsed", default: `"mdi-chevron-right"` },
    { name: "disabled", type: "boolean", description: "Disables the collapsible button", default: "false" }
  ]}
  styleProps={[
    { name: "--collapsible-divider-margin-right", type: "size", description: "Margin on the right side", default: "0rem" },
    { name: "--collapsible-divider-margin-left", type: "size", description: "Margin on the left side", default: "0.5rem" },
    { name: "--collapsible-divider-margin-top", type: "size", description: "Margin on the top", default: "0.5rem" },
    { name: "--collapsible-divider-margin-bottom", type: "size", description: "Margin on the bottom", default: "0.5rem" },
    { name: "--collapsible-divider-background-color", type: "color", description: "Background color of the divider", default: "rgb(var(--global-color-contrast-500), .5)" },
    { name: "--collapsible-divider-line-border-radius", type: "size", description: "Border radius of the divider line", default: "0.5rem" },
    { name: "--collapsible-divider-line-height", type: "size", description: "Height of the divider line", default: "0.1rem" },
    { name: "--collapsible-divider-button-border-radius", type: "size", description: "Border radius of the button", default: "9999px" },
    { name: "--collapsible-divider-button-border", type: "size", description: "Border size of the button", default: "0.1rem solid" },
    { name: "--collapsible-divider-button-border-color", type: "color", description: "Border color of the button", default: "rgb(var(--global-color-contrast-500), .5)" },
    { name: "--collapsible-divider-button-height", type: "size", description: "Height of the button", default: "25px" },
    { name: "--collapsible-divider-button-width", type: "size", description: "Width of the button", default: "25px" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: "onchange",
      description: "Triggered when the collapsed state changes",
      properties: [
        { name: "collapsed", type: "boolean", description: "The new collapsed state" }
      ]
    },
    {
      name: "onkeydown",
      description: "Triggered when a key is pressed down"
    },
    {
      name: "onkeyup",
      description: "Triggered when a key is released"
    },
    {
      name: "onkeypress",
      description: "Triggered when a key is pressed"
    }
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
</style>