<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import SelectableVerticalList from "$lib/components/simple/lists/SelectableVerticalList.svelte";
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
></PropsViewer>
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
</style>