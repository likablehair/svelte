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
    { name: "files", type: "File[]", description: "The selected files", default: "undefined" },
    { name: "placeholder", type: "string", description: "Placeholder text for the input", default: "undefined" },
    { name: "persistOverUpload", type: "boolean", description: "Whether new files are added to the existing ones", default: "true" },
    { name: "disabled", type: "boolean", description: "Disables the file input", default: "false" },
    { name: "maxFiles", type: "number", description: "Maximum number of files that can be selected", default: "undefined" },
    { name: "class", type: "string", description: "Additional CSS classes", default: "''" }
  ]}
  styleProps={[
    { name: "--file-input-height", type: "size", description: "Height of the file input", default: "64px" },
    { name: "--file-input-width", type: "size", description: "Width of the file input", default: "" },
    { name: "--file-input-background-color", type: "color", description: "Background color of the file input", default: "rgb(var(--global-color-background-300))" },
    { name: "--file-input-color", type: "color", description: "Text color inside the file input", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--file-input-focus-shadow", type: "shadow", description: "Shadow effect on focus", default: "inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 #0000, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)" },
    { name: "--file-input-border-radius", type: "size", description: "Border radius of the file input", default: "5px" },
    { name: "--file-input-active-background-color", type: "color", description: "Background color when active", default: "rgb(var(--global-color-primary-700))" }
  ]}
/>

<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "bodySnippet", description: "Custom content for the file drop area", default: "<span> { placeholder || 'Drop file here or click to upload'}</span>", properties: [{ name: "active", type: "boolean", description: "Indicates if the drop area is active" }] }
  ]}
/>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onfileDrop", description: "Triggered when files are dropped", properties: [{ name: "nativeEvent", type: "DragEvent", description: "The native drag event" }, { name: "files", type: "File[]", description: "Dropped files" }] },
    { name: "onfileSelect", description: "Triggered when files are selected via the file input", properties: [{ name: "nativeEvent", type: "Event", description: "The native input event" }, { name: "files", type: "File[]", description: "Selected files" }] },
    { name: "onchange", description: "Triggered when the file selection changes" }
  ]}
/>

<style>
  .example {
    height: 100px;
    width: auto;
  }
</style>
