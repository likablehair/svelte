<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import SidebarMenuList from "$lib/components/simple/lists/SidebarMenuList.svelte";
</script>

<h1>SidebarMenuList</h1>
<ComponentSubtitle>Choose wisely, but to the side.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <SidebarMenuList
    menus={[
      { title: "Home", name: "home", },
      { title: "About", name: "about", },
      { 
        title: "Services", 
        name: "services", 
        children: [
          { title: "Web Development", name: "web-dev", },
          { title: "SEO", name: "seo", }
        ]
      },
      { 
        title: "Products", 
        name: "products", 
        children: [
          { title: "Laptops", name: "laptops", },
          { title: "Phones", name: "phones", }
        ] 
      },
      { title: "Contact", name: "contact", }
    ]}
  ></SidebarMenuList>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "menus", type: "Menu[]", description: "List of menu items" },
    { name: "level", type: "number", description: "Current depth level of the menu", default: "0" },
    { name: "selected", type: "string | number", description: "Currently selected menu item", default: "undefined" },
    { name: "bookmarkColor", type: "string", description: "Color of the bookmark indicator", default: "rgb(var(--global-color-primary-500))" },
    { name: "color", type: "string", description: "Text color of menu items", default: "inherit" },
    { name: "hoverColor", type: "string", description: "Text color on hover", default: "inherit" },
    { name: "selectedTextColor", type: "string", description: "Text color of selected menu item", default: "inherit" },
    { name: "selectedFontWeight", type: "string", description: "Font weight of selected menu item", default: "600" },
    { name: "autoDetectUrl", type: "boolean", description: "Automatically detect selected menu item based on URL", default: "false" }
  ]}
  styleProps={[
    { name: "--sidebar-menu-list-selected-index", type: "size", description: "Index of the selected menu item", default: "undefined" },
    { name: "--sidebar-menu-list-primary-color", type: "color", description: "Color of the bookmark indicator", default: "rgb(var(--global-color-primary-500))" },
    { name: "--sidebar-menu-list-selected-text-color", type: "color", description: "Text color of the selected menu item", default: "rgb(var(--global-color-primary-500))" },
    { name: "--sidebar-menu-list-selected-font-weight", type: "size", description: "Font weight of the selected menu item", default: "600" },
    { name: "--sidebar-menu-list-color", type: "color", description: "Text color of menu items", default: "inherit" },
    { name: "--sidebar-menu-list-hover-color", type: "color", description: "Text color on hover", default: "inherit" }
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