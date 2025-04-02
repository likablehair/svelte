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
    { name: "label", type: "string", description: "Label for the text area", default: "null" },
    { name: "placeholder", type: "string", description: "Placeholder text for the text area", default: "'placeholder'" },
    { name: "textAreaId", type: "string", description: "ID for the text area", default: "createId()" },
    { name: "fontFamily", type: "string", description: "Font family for the text area", default: "'inherit'" },
    { name: "value", type: "string", description: "Value of the text area", default: "'$bindable('')'" },
    { name: "resizable", type: "boolean", description: "Whether the text area is resizable", default: "true" },
    { name: "disabled", type: "boolean", description: "Whether the text area is disabled", default: "false" },
    { name: "readOnly", type: "boolean", description: "Whether the text area is read-only", default: "false" },
    { name: "maxLength", type: "number | undefined", description: "Maximum number of characters allowed in the text area", default: "undefined" },
    { name: "textColor", type: "string", description: "Text color for the text area", default: "'black'" },
    { name: "border", type: "string", description: "Border style for the text area", default: "'none'" },
    { name: "borderRadius", type: "string", description: "Border radius for the text area", default: "'5px'" },
    { name: "focusedBoxShadow", type: "string | undefined", description: "Box shadow when the text area is focused", default: "undefined" },
    { name: "backgroundColor", type: "string", description: "Background color of the text area", default: "null" },
    { name: "padding", type: "string | undefined", description: "Padding inside the text area", default: "undefined" },
    { name: "paddingLeft", type: "string | undefined", description: "Left padding of the text area", default: "undefined" },
    { name: "paddingRight", type: "string | undefined", description: "Right padding of the text area", default: "undefined" },
    { name: "paddingBottom", type: "string | undefined", description: "Bottom padding of the text area", default: "undefined" },
    { name: "paddingTop", type: "string | undefined", description: "Top padding of the text area", default: "undefined" },
    { name: "fontSize", type: "string | undefined", description: "Font size for the text area", default: "undefined" },
    { name: "labelFontSize", type: "string | undefined", description: "Font size for the label", default: "undefined" },
    { name: "labelColor", type: "string | undefined", description: "Color for the label", default: "undefined" },
    { name: "width", type: "string", description: "Width of the text area", default: "'100%'" },
    { name: "height", type: "string", description: "Height of the text area", default: "'100%'" }
  ]}
  styleProps={[
    { name: "--textarea-focus-box-shadow", type: "shadow", description: "Box shadow when the text area is focused", default: "none" }
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