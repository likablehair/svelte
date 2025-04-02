<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import ColorInvertedSelector from "$lib/components/simple/lists/ColorInvertedSelector.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
</script>

<h1>TabSwitcher</h1>
<ComponentSubtitle>Switch to a new tab, switch to a new life.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <ColorInvertedSelector 
    options={[
      { label: 'pippo', name: 'pippo' },
      { label: 'pluto', name: 'pluto' }
    ]}
    selectedIndex={0}
    --color-inverted-selector-width="300px"
  ></ColorInvertedSelector>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "options", type: "Option[]", description: "Array of selectable options", default: "[]" },
    { name: "selectedIndex", type: "number", description: "Index of the currently selected option", default: "undefined" },
    { name: "deletable", type: "boolean", description: "Determines if options can be deleted", default: "true" },
    { name: "class", type: "{ container?: string, element?: string, selected?: string, }", description: "Custom class names for styling", default: "{}" }
  ]}
  styleProps={[
    { name: "--color-inverted-selector-background-color", type: "color", description: "Background color of the selector", default: "rgb(var(--global-color-background-200))" },
    { name: "--color-inverted-selector-selected-background-color", type: "color", description: "Background color of the selected option", default: "rgb(var(--global-color-primary-400))" },
    { name: "--color-inverted-selector-selected-color", type: "color", description: "Text color of the selected option", default: "rgb(var(--global-color-grey-50))" },
    { name: "--color-inverted-selector-vertical-gap", type: "size", description: "Vertical gap between options", default: "8px" },
    { name: "--color-inverted-selector-icon-gap", type: "size", description: "Gap between the icon and the label", default: "8px" },
    { name: "--color-inverted-selector-selected-font-weight", type: "font-weight", description: "Font weight of the selected option", default: "700" },
    { name: "--color-inverted-selector-element-padding", type: "size", description: "Padding of each selectable element", default: "8px 8px 8px 16px" },
    { name: "--color-inverted-selector-element-border-radius", type: "size", description: "Border radius of each selectable element", default: "5px" },
    { name: "--color-inverted-selector-hover-background-color", type: "color", description: "Background color when hovering over an option", default: "rgb(var(--global-color-primary-500), .3)" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { 
      name: "prependSnippet", 
      description: "Renders content before the option label",
      default: `
{#if !!option.icon}
  <Icon
    name={option.icon}
  ></Icon>
{/if}
      `,
      properties: [
        { name: "option", type: "Option", description: "The current option" },
        { name: "index", type: "number", description: "Index of the current option" },
        { name: "handleClickClose", type: "(option: Option, index: number) => void", description: "Function to handle deletion" }
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
      default: `
{#if deletable}
  <Icon
    name="mdi-close"
    onclick={() => handleClickClose(option, index)}
  ></Icon>
{/if}
      `,
      properties: [
        { name: "option", type: "Option", description: "The current option" },
        { name: "handleClickClose", type: "(option: Option, index: number) => void", description: "Function to handle deletion" }
      ] 
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { 
      name: "onselect", 
      description: "Triggered when an option is selected",
      properties: [
        { name: "option", type: "Option", description: "The selected option" },
        { name: "selectedIndex", type: "number | undefined", description: "Index of the selected option" },
        { name: "native", type: "Event", description: "The native event" }
      ] 
    },
    { 
      name: "ondelete", 
      description: "Triggered when an option is deleted",
      properties: [
        { name: "option", type: "Option", description: "The deleted option" },
        { name: "index", type: "number", description: "Index of the deleted option" }
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