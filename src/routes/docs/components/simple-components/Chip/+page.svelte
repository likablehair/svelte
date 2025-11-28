<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import Chip from "$lib/components/simple/navigation/Chip.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
</script>

<h1>Chip</h1>
<ComponentSubtitle>Cheap Chip.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Chip prependIcon='mdi-factory' close>Some chip</Chip>
  <Chip inactive>Some chip</Chip>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "close", type: "boolean", description: "If true, shows a close icon to remove the chip", default: "false" },
    { name: "closeIcon", type: "string", description: "Icon name for the close button", default: "mdi-close-circle" },
    { name: "disabled", type: "boolean", description: "If true, disables the chip", default: "false" },
    { name: "prependIcon", type: "string", description: "Icon name for the prepend icon", },
    { name: "inactive", type: "boolean", description: "If true, applies an inactive style to the chip", default: "false" },
    { name: "buttonTabIndex", type: "number | null", description: "Tab index for the chip button", default: "null" },
    { name: "truncateText", type: "boolean", description: "If true, truncates the text with ellipsis", default: "false" },
  ]}
  styleProps={[
    { name: "--chip-min-height", type: "size", description: "Minimum height of the chip", default: "1.8rem" },
    { name: "--chip-height", type: "size", description: "Height of the chip", },
    { name: "--chip-padding", type: "size", description: "Padding of the chip", default: "0px 7px" },
    { name: "--chip-cursor", type: "cursor", description: "Cursor style", default: "pointer" },
    { name: "--chip-gap", type: "size", description: "Gap between chip elements", default: "5px" },
    { name: "--chip-text-max-width", type: "size", description: "Max width for text before truncation", default: "200px" },
    { name: "--chip-background-color", type: "color", description: "Background color of the chip", default: "rgb(var(--global-color-primary-500))" },
    { name: "--chip-color", type: "color", description: "Default color of the chip", default: "rgb(var(--global-color-grey-50))" },
    { name: "--chip-hover-background-color", type: "color", description: "Background color on hover", default: "rgb(var(--global-color-primary-600))" },
    { name: "--chip-focus-background-color", type: "color", description: "Background color on focus", default: "rgb(var(--global-color-primary-600))" },
    { name: "--chip-inactive-focus-color", type: "color", description: "Focus color for inactive chip", default: "rgb(var(--global-color-primary-400))" },
    { name: "--chip-inactive-focus-border-color", type: "color", description: "Focus border color for inactive chip", },
    { name: "--chip-inactive-focus-box-shadow", type: "box-shadow", description: "Box shadow for focused inactive chip", default: "0px 0px 4px 2px rgba(var(--global-color-primary-400),0.1)" },
    { name: "--chip-border-radius", type: "size", description: "Border radius of the chip", default: "6px" },
    { name: "--chip-font-size", type: "size", description: "Font size of the chip", default: "inherit" },
    { name: "--chip-line-height", type: "size", description: "Line height of the chip", default: "inherit" },
    { name: "--chip-font-weight", type: "weight", description: "Fonth weight of the chip", default: "500" },
    { name: "--chip-inactive-color", type: "color", description: "Color for inactive chip" },
    { name: "--chip-inactive-background-color", type: "color", description: "Background color for inactive chip", default: "rgb(var(--global-color-background-300))" },
    { name: "--chip-inactive-border", type: "border", description: "Border for inactive chip", },
    { name: "--chip-inactive-border-color", type: "color", description: "Border color for inactive chip" },
    
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: "children",
      description: "Content of the chip, displayed inside the chip",
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: "onclick",
      description: "Triggered when the chip is clicked",
      properties: [
        { name: "native", type: "MouseEvent", description: "The native mouse event" }
      ]
    },
    {
      name: "onclose",
      description: "Triggered when the close icon is clicked",
      properties: [
        { name: "native", type: "MouseEvent", description: "The native mouse event" }
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