<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Drawer from "$lib/components/simple/navigation/Drawer.svelte";
  import Dialog from "$lib/components/simple/dialogs/Dialog.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";

  let open: boolean = false,
    dialogOpened: boolean = false,
    secondDrawerOpened: boolean = false,
    largerDrawer: boolean = false

  function handleButtonClick() {
    open = true
  }
</script>

<h1>Drawer</h1>
<ComponentSubtitle>Drop your things in this drawer.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Button
    onclick={handleButtonClick}
  >
    Open drawer
  </Button>
  <Button
    onclick={() => largerDrawer = true}
  >
    Open larger drawer
  </Button>
  <Button
    onclick={() => dialogOpened = true}
  >
    Open dialog
  </Button>
  <Drawer
    bind:open={open}
  >
    <Button
      onclick={() => dialogOpened = true}
    >
      Open dialog
    </Button>
  </Drawer>
  <Drawer
    bind:open={largerDrawer}
    _space="80vw"
    _openingSpeed=".5s"
  >
    <Button
      onclick={() => dialogOpened = true}
    >
      Open dialog
    </Button>
  </Drawer>
  <Dialog
    bind:open={dialogOpened}
  >
    <div>
      <Button
        onclick={() => secondDrawerOpened = true}
      >
        Open drawer
      </Button>
      <Drawer
        bind:open={secondDrawerOpened}
      >second</Drawer>
    </div>
  </Dialog>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "open", type: "boolean", description: "Controls the visibility of the drawer.", default: "false" },
    { name: "position", type: "\"left\" | \"top\" | \"right\" | \"bottom\"", description: "Position of the drawer relative to the screen.", default: "\"left\"" },
    { name: "overlay", type: "boolean", description: "Whether to display an overlay behind the drawer.", default: "false" },
    { name: "closeOnClickOutside", type: "boolean", description: "Whether to close the drawer when clicking outside of it.", default: "true" },
    { name: "items", type: "Item[]", description: "Array of items to be displayed in the navigator.", default: "[]" },
    { name: "teleportedUid", type: "string | undefined", description: "Unique ID for teleported elements.", default: "undefined" },
    { name: "_space", type: "string | undefined", description: "Custom space for the drawer.", default: "undefined" },
    { name: "_openingSpeed", type: "string | undefined", description: "Speed of the drawer opening animation.", default: "undefined" },
    { name: "_backgroundColor", type: "string | undefined", description: "Background color of the drawer.", default: "undefined" },
    { name: "_color", type: "string | undefined", description: "Text color of the drawer.", default: "undefined" },
    { name: "_overflow", type: "string | undefined", description: "Overflow behavior of the drawer.", default: "undefined" },
    { name: "_borderRadius", type: "string | undefined", description: "Border radius of the drawer.", default: "undefined" },
    { name: "_margin", type: "string | undefined", description: "Margin of the drawer.", default: "undefined" },
    { name: "_overlaySpeed", type: "string | undefined", description: "Speed of the overlay animation.", default: "undefined" },
    { name: "_overlayBackgroundColor", type: "string | undefined", description: "Background color of the overlay.", default: "undefined" },
    { name: "_overlayOpacity", type: "string | undefined", description: "Opacity of the overlay.", default: "undefined" },
  ]}
  styleProps={[
    { name: "--drawer-space", type: "size", description: "Space occupied by the drawer.", default: "20rem" },
    { name: "--drawer-opening-speed", type: "time", description: "Speed of the drawer opening animation.", default: ".3s" },
    { name: "--drawer-overlay-speed", type: "time", description: "Speed of the overlay animation.", default: ".2s" },
    { name: "--drawer-overlay-opacity", type: "opacity", description: "Opacity of the overlay.", default: "50%" },
    { name: "--drawer-overlay-background-color", type: "color", description: "Background color of the overlay.", default: "rgb(var(--global-color-grey-900))" },
    { name: "--drawer-default-z-index", type: "z-index", description: "Default z-index of the drawer.", default: "30" },
    { name: "--drawer-background-color", type: "color", description: "Background color of the drawer.", default: "rgb(var(--global-color-background-200))" },
    { name: "--drawer-default-overflow", type: "overflow", description: "Overflow behavior of the drawer.", default: "auto" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "children", description: "Custom content inside the drawer", default: `
<div
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:margin-top={position == "left" || position == "right"
    ? "10px"
    : "0px"}
  style:height={position == "top" || position == "bottom"
    ? "100%"
    : "fit-content"}
>
  <Navigator
    {items}
    vertical={position == "right" || position == "left"}
    {onitemClick}
  />
</div>
    ` },
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onclose", description: "Triggered when the drawer is closed." },
    { name: "onitemClick", description: "Triggered when an item in the navigator is clicked.", properties: [
      { name: "item", type: "Item", description: "The item that was clicked." }
    ] }
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