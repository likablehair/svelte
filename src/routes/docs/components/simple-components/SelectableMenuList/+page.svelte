<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import SelectableMenuList from "$lib/components/simple/lists/SelectableMenuList.svelte";
</script>

<h1>SelectableMenuList</h1>
<ComponentSubtitle>Choose wisely.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <SelectableMenuList
    items={[
      { name: "dashboard", label: "Dashboard", icon: "mdi-view-dashboard" },
      { name: "profile", label: "Profile", icon: "mdi-account" },
      { divider: true, marginTop: "8px", marginBottom: "8px" },
      { name: "settings", label: "Settings", icon: "mdi-cog", disabled: false },
      { name: "help", label: "Help", icon: "mdi-help-circle" },
      { name: "logout", label: "Logout", icon: "mdi-logout", disabled: true }
    ]}
  ></SelectableMenuList>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "collapsed", type: "boolean", description: "Determines if the menu is collapsed", default: "false" },
    { name: "items", type: "MenuItem[]", description: "List of menu items", default: "[]" },
    { name: "selected", type: "string | number", description: "Currently selected item", default: "undefined" },
  ]}
  styleProps={[
    { name: "--selectable-menu-list-divider-background-color", type: "color", description: "Background color of the divider", default: "rgb(var(--global-color-background-500))" },
    { name: "--selectable-menu-list-divider-height", type: "size", description: "Height of the divider", default: "1px" },
    { name: "--selectable-menu-list-icon-gap", type: "size", description: "Spacing between icon and label", default: "10px" },
    { name: "--selectable-menu-list-spacing", type: "size", description: "Spacing between menu items", default: "1.5rem" },
    { name: "--selectable-menu-list-selected-color", type: "color", description: "Text color of the selected item", default: "rgb(var(--global-color-primary-400))" },
    { name: "--selectable-menu-list-margin-block-start", type: "size", description: "Top margin of the menu", default: "1rem" },
    { name: "--selectable-menu-list-margin-block-end", type: "size", description: "Bottom margin of the menu", default: "1rem" }
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
      name: "onselect", 
      description: "Triggered when a menu item is selected",
      properties: [
        { name: "item", type: "Item", description: "The selected menu item" }
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