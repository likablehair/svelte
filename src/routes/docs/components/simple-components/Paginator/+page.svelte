<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Paginator from "$lib/components/simple/lists/Paginator.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
</script>

<h1>Paginator</h1>
<ComponentSubtitle>One page at a time.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Paginator
  ></Paginator>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "page", type: "number", description: "Current page number", default: "1" },
    { name: "maxPage", type: "number", description: "Maximum number of pages", default: "undefined" },
  ]}
  styleProps={[
    { name: "--paginator-page-button-selected-background-color", type: "color", description: "Background color of the selected page button", default: "rgb(var(--global-color-primary-500))" },
    { name: "--paginator-page-button-selected-color", type: "color", description: "Text color of the selected page button", default: "rgb(var(--global-color-grey-100))" },
    { name: "--paginator-page-button-selected-padding", type: "size", description: "Padding of the selected page button", default: ".2rem .7rem" },
    { name: "--paginator-page-button-hover-background-color", type: "color", description: "Background color of the page button on hover", default: "rgb(var(--global-color-primary-500))" },
    { name: "--paginator-page-button-hover-border-radius", type: "size", description: "Border radius of the page button on hover", default: "8px" },
    { name: "--paginator-page-button-focus-color", type: "color", description: "Text color of the page button on focus", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--paginator-page-button-focus-background-color", type: "color", description: "Background color of the page button on focus", default: "transparent" },
    { name: "--paginator-page-button-padding", type: "size", description: "Padding of the page button", default: ".2rem .7rem" },
    { name: "--paginator-page-button-border-radius", type: "size", description: "Border radius of the page button", default: "8px" },
    { name: "--paginator-page-button-color", type: "color", description: "Text color of the page button", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--paginator-page-button-background-color", type: "color", description: "Background color of the page button", default: "transparent" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { 
      name: "onchange", 
      description: "Triggered when the page changes",
      properties: [
        { name: "page", type: "number", description: "The new page number" }
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