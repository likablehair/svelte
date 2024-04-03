<script lang="ts">
  import ToggleList from "$lib/components/composed/forms/ToggleList.svelte";
  import type { Item } from "$lib/components/composed/forms/ToggleList.svelte";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";

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

  let values: Item[] | undefined

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
    // {
    //   name: 'type',
    //   type: '"button" | "submit"',
    //   description: "HTML type attribute",
    //   default: "button"
    // }
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
<h2>Events</h2>

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
