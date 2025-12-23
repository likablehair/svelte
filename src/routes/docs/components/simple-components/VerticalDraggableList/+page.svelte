<script lang="ts">
  import { VerticalDraggableList } from "$lib";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import type { ComponentProps } from "svelte";

  let items: ComponentProps<typeof VerticalDraggableList>['items'] = [
    {
      id: 'businessName',
      name: 'Business name',
    },
    {
      id: "productName",
      name: "Product Name",
    },
    {
      id: "progress",
      name: "Progress",
    },
    {
      id: "rating",
      name: "Rating",
    }
  ]
</script>

<h1>VerticalDraggableList</h1>
<ComponentSubtitle>Drag all over me.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <VerticalDraggableList
    items={items}
  >
  </VerticalDraggableList>
</div>
<h2>Props</h2>
<PropsViewer
  props={[  
    { name: "items", type: "{ id: string; name: string; }[]", description: "An array of draggable items.", default: "[]" },  
    { name: "disableFirstItem", type: "boolean", description: "Disables dragging for the first item.", default: "false" },  
    { name: "class", type: "string", description: "Additional CSS classes for item containers.", default: "''" }  
  ]}
  styleProps={[
    { name: '--vertical-draggable-list-item-padding', type: 'size', description: 'Defines the row padding.', default: '8px' },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { 
      name: "itemSnippet", 
      description: "Custom rendering snippet for each draggable item.", 
      properties: [
        { name: "item", type: "{ id: string; name: string; }", description: "The item being rendered." },
        { name: "index", type: "number", description: "The index of the item being rendered." }
      ],
      default: '{item.name}'
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { 
      name: "onchangeOrder", 
      description: "Triggered when the order of items changes.", 
      properties: [
        { name: "items", type: "{ id: string; name: string; }[]", description: "The updated list of items in the new order." }
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