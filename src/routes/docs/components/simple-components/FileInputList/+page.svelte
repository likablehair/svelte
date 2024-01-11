<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import FileInputList from "$lib/components/simple/forms/FileInputList.svelte";
</script>

<h1>FileInputList</h1>
<ComponentSubtitle>Drop it like it's hot (the list).</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <FileInputList 
    --file-input-list-border-radius="10px"
  />
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
      name: "dropAreaActive",
      type: "boolean",
      default: "true",
      description: "Whether the drop area is active.",
    },{
      name: "icon",
      type: "string",
      default: "mdi-folder",
      description: "Folder icon to use. See { https://pictogrammers.com/library/mdi }",
    },
    {
      name: "persistOverUpload",
      type: "boolean",
      default: "true",
      description: "Dai Gabbo.",
    },
  ]}
  styleProps={[
    {
      name: "--file-input-list-color",
      type: "string",
      default: "inherit",
      description: "color css property.",
    },
    {
      name: "--file-input-list-background-color",
      type: "string",
      default: "rgb(244 244 245/1)",
      description: "background-color css property.",
    },
    {
      name: "--file-input-list-width",
      type: "string",
      default: "fit-content",
      description: "width css property.",
    },
    {
      name: "--file-input-list-height",
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
      description: "Occurs when an item is being click over the target area",
      properties: [
        {
          name: "NativeEvent",
          type: "ClickEvent",
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
    height: 200px;
    width: auto;
  }
</style>
