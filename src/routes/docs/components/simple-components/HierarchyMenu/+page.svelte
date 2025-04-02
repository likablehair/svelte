<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import HierarchyMenu from "$lib/components/simple/lists/HierarchyMenu.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";

  let options = [
    { label: 'Articoli', name: 'articles', icon: 'mdi-cube' },
    { label: 'Movimenti', name: 'movements', icon: 'mdi-warehouse', options: [
      { label: 'Acquisto', name: 'purchase', icon: 'mdi-cart-arrow-down' },
      { label: 'Vendita', name: 'sell', icon: 'mdi-brightness-percent' },
      { label: 'Carico', name: 'load', icon: 'mdi-database-arrow-left' },
      { label: 'Scarico', name: 'unload', icon: 'mdi-database-arrow-right-outline' }
    ] },
    { label: 'Lista Movimenti', name: 'movements-list', icon: 'mdi-cart' },
    { label: 'Anagrafiche', name: 'registries', icon: 'mdi-card-account-details' }
  ]
</script>

<h1>HierarchyMenu</h1>
<ComponentSubtitle>Hierarchy is hard to write.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div style:width="200px">
    <HierarchyMenu
      {options}
      --icon-size="20px"
    ></HierarchyMenu>
  </div>
  <div style:width="40px">
    <HierarchyMenu
      {options}
      --icon-size="20px"
      iconsOnly={true}
    ></HierarchyMenu>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "options", type: "Option[]", description: "Array of selectable options", default: "[]" },
    { name: "selected", type: "string", description: "Currently selected option", default: "undefined" },
    { name: "expanded", type: "string[]", description: "Array of expanded option names", default: "[]" },
    { name: "iconsOnly", type: "boolean", description: "Display only icons instead of labels", default: "false" }
  ]}
  styleProps={[
    { name: "--hierarchy-menu-gap", type: "size", description: "Gap between elements", default: "4px" },
    { name: "--hierarchy-menu-width", type: "size", description: "Width of the menu", default: "100%" },
    { name: "--hierarchy-menu-element-border-radius", type: "size", description: "Border radius of menu elements", default: "8px" },
    { name: "--hierarchy-menu-element-background-color", type: "color", description: "Background color of menu elements", default: "transparent" },
    { name: "--hierarchy-menu-element-color", type: "color", description: "Text color of menu elements", default: "inherit" },
    { name: "--hierarchy-menu-element-hover-background-color", type: "color", description: "Background color when hovering", default: "rgb(var(--global-color-background-300), .5)" },
    { name: "--hierarchy-menu-element-hover-color", type: "color", description: "Text color when hovering", default: "inherit" },
    { name: "--hierarchy-menu-element-active-background-color", type: "color", description: "Background color when active", default: "rgb(var(--global-color-background-300), .5)" },
    { name: "--hierarchy-menu-element-active-color", type: "color", description: "Text color when active", default: "inherit" },
    { name: "--hierarchy-menu-element-selected-background-color", type: "color", description: "Background color of selected element", default: "rgb(var(--global-color-primary-500), .6)" },
    { name: "--hierarchy-menu-element-selected-color", type: "color", description: "Text color of selected element", default: "rgb(var(--global-color-grey-50))" },
    { name: "--hierarchy-menu-element-selected-font-weight", type: "font-weight", description: "Font weight of selected element", default: "700" },
    { name: "--hierarchy-menu-element-padding", type: "size", description: "Padding of menu elements", default: "8px" },
    { name: "--hierarchy-menu-element-cursor", type: "cursor", description: "Cursor style for menu elements", default: "pointer" },
    { name: "--hierarchy-menu-icon-button-padding", type: "size", description: "Padding for icon buttons", default: "0px 12px 0px 2px" },
    { name: "--hierarchy-menu-sub-options-padding", type: "size", description: "Padding for sub-options", default: "8px 0px 8px 40px" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { 
      name: "prependSnippet", 
      description: "Renders content before the option label",
      default: `
{#if !!option.options}
  <button
    class="style-less-button icon-button"
    class:no-transform={iconsOnly}
    onclick={(e) => {
      e.stopPropagation()
      if(!iconsOnly) {
        handleExpandOptionClick(option)
      } else {
        handleOptionClick(option)
      }
    }}
  >
    {#if !!option.icon}
      <Icon name={option.icon} />
    {:else if isExpanded}
      <Icon name="mdi-chevron-down" />
    {:else}
      <Icon name="mdi-chevron-right" />
    {/if}
  </button>

  {#if !iconsOnly}
    <button
      class="style-less-button expand-button"
      onclick={(e) => {
        e.stopPropagation()
        handleExpandOptionClick(option)}
      }
    >
      {#if isExpanded}
        <Icon name="mdi-chevron-down" />
      {:else}
        <Icon name="mdi-chevron-right" />
      {/if}
    </button>
  {/if}
{:else if !!option.icon}
  <div class="icon-only">
    <Icon name={option.icon} />
  </div>
{/if}
            `,
      properties: [
        { name: "option", type: "Option", description: "The current option" }
      ] 
    },
    { 
      name: "optionSnippet", 
      description: "Renders custom content for an option",
      default: `
<div class="label">
  {option.label}
</div>
      `,
      properties: [
        { name: "option", type: "Option", description: "The current option" }
      ] 
    },
    { 
      name: "appendSnippet", 
      description: "Renders content after the option label",
      properties: [
        { name: "option", type: "Option", description: "The current option" }
      ] 
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { 
      name: "onoptionClick", 
      description: "Triggered when an option is clicked",
      properties: [
        { name: "option", type: "Option", description: "The clicked option" }
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