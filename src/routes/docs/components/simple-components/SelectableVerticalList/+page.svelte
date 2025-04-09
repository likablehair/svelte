<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SelectableVerticalList from "$lib/components/simple/lists/SelectableVerticalList.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
</script>

<h1>SelectableVerticalList</h1>
<ComponentSubtitle>Vertical horizon, selectable soul.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <SelectableVerticalList 
    elements={[
      { title: 'pippo', name: 'pippo', description: 'io sono pippo' },
      { title: 'pluto', name: 'pluto', description: 'io sono pluto' }
    ]}
    --selectable-vertical-list-width="300px"
  ></SelectableVerticalList>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "activeKeyboard", type: "boolean", description: "Enables keyboard navigation.", default: "false" },
    { name: "loopSelection", type: "boolean", description: "Loops selection when reaching the end.", default: "true" },
    { name: "focused", type: "string | number", description: "Currently focused element.", default: "undefined" },
    { name: "selected", type: "string | number", description: "Currently selected element.", default: "undefined" },
    { name: "elements", type: "Element[]", description: "List of elements in the list.", default: "[]" },
    { name: "centered", type: "boolean", description: "Centers the content.", default: "false" },
    { name: "bicolor", type: "boolean", description: "Applies alternating row colors.", default: "false" },
    { name: "appendIconSize", type: "string", description: "Size of the appended icon.", default: "20pt" }
  ]}
  styleProps={[
    { name: "--selectable-vertical-list-element-padding", type: "size", description: "Padding inside elements.", default: ".75rem 1rem .75rem 1rem" },
    { name: "--selectable-vertical-list-element-cursor", type: "cursor", description: "Cursor style for elements.", default: "pointer" },
    { name: "--selectable-vertical-list-selection-background-color", type: "color", description: "Background color for selected elements.", default: "rgb(var(--global-color-background-300))" },
    { name: "--selectable-vertical-list-selection-color", type: "color", description: "Text color for selected elements.", default: "inherit" },
    { name: "--selectable-vertical-list-focus-background-color", type: "color", description: "Background color for focused elements.", default: "rgb(var(--global-color-background-300), .5)" },
    { name: "--selectable-vertical-list-focus-color", type: "color", description: "Text color for focused elements.", default: "inherit" },
    { name: "--selectable-vertical-list-element-border-radius", type: "size", description: "Border radius for elements.", default: "0px" },
    { name: "--selectable-vertical-list-element-height", type: "size", description: "Height of elements.", default: "auto" },
    { name: "--selectable-vertical-list-padding", type: "size", description: "Padding for the list.", default: "0px" },
    { name: "--selectable-vertical-list-title-font-size", type: "size", description: "Font size for titles.", default: "1.2rem" },
    { name: "--selectable-vertical-list-description-font-size", type: "size", description: "Font size for descriptions.", default: ".875rem" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "elementSnippet", description: "Custom template for an element.", properties: [{ name: "selected", type: "boolean", description: "Whether the element is selected." }, { name: "focused", type: "boolean", description: "Whether the element is focused." }], default: `
{#if !!element.icon}
  <Icon
    name={element.icon}
  ></Icon>
{/if}
<div class="title-description-container" class:centered>
  <div class="title">
    {#if titleSnippet}
      {@render titleSnippet({ 
        focused: focused == element.name,
        selected: selected == element.name,
        element
      })}
    {:else}
      {element.title}
    {/if}
  </div>
  {#if !!element.description}
    <div class="description">
      {#if descriptionSnippet}
        {@render descriptionSnippet({ 
          focused: focused == element.name,
          selected: selected == element.name,
          element
        })}
      {:else}
        {element.description || ''}
      {/if}
    </div>
  {/if}
</div>
{#if !!element.appendIcon}
  <div
    role="button"
    tabindex="0"
    class="append"
    onclick={(e) => {
      e.stopPropagation()
      handleIconClick(index, element)
    }}
    {onkeypress}
  >
    <Icon
      name={element.appendIcon}
      --icon-size={appendIconSize}
    ></Icon>
  </div>
{/if}
    ` },
    { name: "titleSnippet", description: "Custom template for the element title.", properties: [{ name: "selected", type: "boolean", description: "Whether the element is selected." }, { name: "focused", type: "boolean", description: "Whether the element is focused." }, { name: "element", type: "Element", description: "The element being rendered." }], default: '{element.title}' },
    { name: "descriptionSnippet", description: "Custom template for the element description.", properties: [{ name: "selected", type: "boolean", description: "Whether the element is selected." }, { name: "focused", type: "boolean", description: "Whether the element is focused." }, { name: "element", type: "Element", description: "The element being rendered." }], default: '{element.description || ""}' }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onselect", description: "Triggered when an element is selected.", properties: [{ name: "element", type: "Element", description: "The selected element." }] },
    { name: "onfocus", description: "Triggered when an element gains focus.", properties: [{ name: "element", type: "Element", description: "The focused element." }] },
    { name: "oniconClick", description: "Triggered when an appended icon is clicked.", properties: [{ name: "index", type: "number", description: "Index of the clicked element." }, { name: "element", type: "Element", description: "The element whose icon was clicked." }] },
    { name: "onkeypress", description: "Handles keypress events.", properties: [{ name: "event", type: "KeyboardEvent", description: "The keypress event." }] }
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