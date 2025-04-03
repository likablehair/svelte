<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import HeaderMenu from "$lib/components/simple/navigation/HeaderMenu.svelte";
</script>

<h1>HeaderMenu</h1>
<ComponentSubtitle>A menu that scores an header.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <HeaderMenu></HeaderMenu>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "openDrawer", type: "boolean", description: "Controls the open state of the drawer", default: "false" },
    { name: "title", type: "string", description: "Title of the header", default: "" },
    { name: "hideOnScroll", type: "boolean", description: "Hides the header on scroll down", default: "true" },
    { name: "initialRemoveShadow", type: "boolean", description: "Initial state of shadow removal", default: "false" },
    { name: "color", type: "string", description: "Text color of the header", default: "undefined" },
    { name: "mobileMenu", type: "boolean", description: "Controls the visibility of the mobile menu", default: "true" },
    { name: "zIndex", type: "number", description: "Z-index of the header", default: "25" },
  ]}
  styleProps={[
    { name: "--header-menu-width", type: "size", description: "Width of the header menu", default: "100vw" },
    { name: "--header-menu-height", type: "size", description: "Height of the header menu", default: "56px" },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "drawerSnippet", description: "Slot for custom drawer content", },
    { name: "titleSnippet", description: "Slot for custom title content", default: `
<span style:font-size="24px" style:line-height="32px">{title}</span>
    ` },
    { name: "appendSnippet", description: "Slot for additional content to append", },
    { name: "prependSnippet", description: "Slot for content to prepend", default: `
<div
  style:width="fit-content"
  style:margin-left="10px"
  style:margin-right="10px"
  class:hide-on-desktop={!mobileMenu}
>
  <Button 
    buttonType="icon" 
    icon="mdi-menu" 
    onclick={toggleDrawer} 
    --button-default-background-color="transparent"
  />
</div>
    `, properties: [{ name: "toggleDrawer", type: "function", description: "Function to toggle the drawer" }, { name: "openDrawer", type: "boolean", description: "Indicates if the drawer is open" }] },
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "ondrawerChange", description: "Triggered when the drawer state changes", properties: [{ name: "opened", type: "boolean", description: "Indicates whether the drawer is open or not" }] },
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