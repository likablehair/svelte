<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import FileInput from "$lib/components/simple/forms/FileInput.svelte";
</script>

<h1>FileInput</h1>
<ComponentSubtitle>Drop it like it's hot.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <FileInput />
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: "files",
      type: "File[] | undefined",
      default: "undefined",
      description: "The list of files to upload.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Whether the component is disabled.",
    },
    {
      name: "rounded",
      type: "boolean",
      default: "true",
      description: "Rounded corners or not.",
    },
    {
      name: "persistOverUpload",
      type: "boolean",
      default: "true",
      description: "Gabbo aiutami.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "If set to false, the input will not accept new files."
    },
    {
      name: "limit",
      type: "number | undefined",
      default: "undefined",
      description: "If set it limits the number of files that can be uploaded. Exceding files will be ignored."
    }
  ]}
  styleProps={[
    {
      name: "--file-input-color",
      type: "string",
      default: "inherit",
      description: "color css property.",
    },
    {
      name: "--file-input-background-color",
      type: "string",
      default: "rgb(244 244 245/1)",
      description: "background-color css property.",
    },
    {
      name: "--file-input-width",
      type: "string",
      default: "fit-content",
      description: "width css property.",
    },
    {
      name: "--file-input-height",
      type: "string",
      default: "auto",
      description: "height css property.",
    },
  ]}
/>

<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: "body",
      description: "Drop area",
      properties: [
        {
          name: "dropAreaActive",
          type: "boolean",
          description: "State of activity of the drop area.",
        },
      ],
    },
  ]}
/>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: "click",
      description: "Occurs when an item is being clicked over the target area",
      properties: [
        {
          name: "NativeEvent",
          type: "ClickEvent",
          description: "The native event caught by the handler.",
        },
      ],
    },
    {
      name: "keypress",
      description: "Occurs when an key is being pressed",
      properties: [
        {
          name: "NativeEvent",
          type: "KeyEvent",
          description: "The native event caught by the handler.",
        },
      ],
    },
    {
      name: "dragover",
      description: "Occurs when an item is being dragged over the target area",
      properties: [
        {
          name: "NativeEvent",
          type: "DragEvent",
          description: "The native event caught by the handler.",
        },
      ],
    },
    {
      name: "dragleave",
      description:
        "Occurs when an item is being dragged out of the target area",
      properties: [
        {
          name: "NativeEvent",
          type: "DragEvent",
          description: "The native event caught by the handler.",
        },
      ],
    },
    {
      name: "dragend",
      description: "Occurs when the user has finished dragging an item",
      properties: [
        {
          name: "NativeEvent",
          type: "DragEvent",
          description: "The native event caught by the handler.",
        },
      ],
    },
    {
      name: "drop",
      description: "Occurs when an item is dropped on the target area",
      properties: [
        {
          name: "NativeEvent",
          type: "DragEvent",
          description: "The native event caught by the handler.",
        },
      ],
    },
    {
      name: "mouseenter",
      description: "Occurs when the mouse pointer enters the target area",
      properties: [
        {
          name: "NativeEvent",
          type: "MouseEvent",
          description: "The native event caught by the handler.",
        },
      ],
    },
    {
      name: "mouseleave",
      description: "Occurs when the mouse pointer leaves the target area",
      properties: [
        {
          name: "NativeEvent",
          type: "MouseEvent",
          description: "The native event caught by the handler.",
        },
      ],
    },
  ]}
/>

<style>
  .example {
    height: 100px;
    width: auto;
  }
</style>
