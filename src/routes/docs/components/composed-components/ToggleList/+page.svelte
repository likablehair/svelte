<script lang="ts">
  import ToggleList from "$lib/components/composed/forms/ToggleList.svelte";
  import type { Item } from "$lib/components/composed/forms/ToggleList.svelte";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";

  let items: Item[] = [
    {
      value: 'first',
      label: 'First item'
    },
    {
      value: 'second',
      label: 'Second item'
    },
    {
      value: 'third',
      label: 'Third item'
    },
  ]

  let values: Item[] | undefined = []

</script>

<h1>ToggleList</h1>
<ComponentSubtitle>List of toggle buttons</ComponentSubtitle>
<h2>Example</h2>
selected values: [
  {#each (values || []) as value}
    <span class="value">{value.value}</span>
  {/each}
]
<div class="example">
  <ToggleList
    {items}
    bind:values
  ></ToggleList>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "values", type: "ItemData[]", description: "An array of selected items.", default: "[]" },
    { name: "items", type: "ItemData[]", description: "An array of items to select from.", default: "[]" },
    { name: "multiple", type: "boolean", description: "Allows multiple selections.", default: "true" },
    { name: "disabled", type: "boolean", description: "Disables the component.", default: "false" },
  ]}
  styleProps={[
    // {
    //   name: '--button-max-width',
    //   type: 'string',
    //   default: 'undefined',
    //   description: 'The max width of the outer element'
    // }
  ]}
/>
<h2>Slots</h2>
<SlotsViewer></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { 
      name: "onchange", 
      description: "Fired when the selection changes.",
      properties: [
        { name: "unselect", type: "ItemData | undefined", description: "The item that was unselected." },
        { name: "select", type: "ItemData | undefined", description: "The item that was selected." },
        { name: "selection", type: "ItemData[]", description: "The array of selected items." }
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

  .value {
    margin-left: 10px;
    margin-right: 10px;
  }
</style>
