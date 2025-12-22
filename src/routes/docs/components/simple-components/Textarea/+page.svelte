<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import Textarea from "$lib/components/simple/forms/Textarea.svelte";
</script>

<h1>Textarea</h1>
<ComponentSubtitle>Big area of text</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Textarea></Textarea>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "label", type: "string", description: "Label for the text area", },
    { name: "class", type: "object", description: "CSS classes for the component", default: "" },
    { name: "...rest", type: "HTMLTextareaAttributes", description: "Attributes for the text area", default: "" },
  ]}
  styleProps={[
    { name: "--textarea-padding", type: "padding", description: "Padding for the text area", default: "0.65rem 1rem 0.65rem 1rem" },
    { name: "--textarea-margin", type: "margin", description: "Margin for the text area", default: "0px 0px 5px" },
    { name: "--textarea-height", type: "height", description: "Height for the text area", default: "100%" },
    { name: "--textarea-width", type: "width", description: "Width for the text area", default: "100%" },
    { name: "--textarea-background-color", type: "color", description: "Background color for the text area", default: "rgb(var(--global-color-background-300), .5)" },
    { name: "--textarea-border-radius", type: "border-radius", description: "Border radius for the text area", default: "4px" },
    { name: "--textarea-border", type: "border", description: "Border for the text area", },
    { name: "--textarea-box-shadow", type: "box-shadow", description: "Box shadow for the text area", default: "none" },
    { name: "--textarea-transition", type: "transition", description: "Transition for the text area", default: ".2s" },
    { name: "--textarea-font-family", type: "font-family", description: "Font family for the text area", default: "inherit" },
    { name: "--textarea-font-size", type: "font-size", description: "Font size for the text area", default: ".9rem" },
    { name: "--textarea-font-weight", type: "font-weight", description: "Font weight for the text area", default: "normal" },
    { name: "--textarea-color", type: "color", description: "Text color for the text area", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--textarea-resize", type: "resize", description: "Resize property for the text area", default: "none" },
    { name: "--textarea-label-margin", type: "margin", description: "Margin for the label", default: "0px 0px 10px 4px" },
    { name: "--textarea-label-font-size", type: "font-size", description: "Font size for the label", },
    { name: "--textarea-label-font-weight", type: "font-weight", description: "Font weight for the label", default: "500" },
    { name: "--textarea-label-color", type: "color", description: "Color for the label",  },
    { name: "--textarea-focus-box-shadow", type: "box-shadow", description: "Box shadow for the text area on focus",},
  ]}
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
    margin-bottom: 20px;
  }
</style>