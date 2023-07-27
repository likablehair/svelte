<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import ColorInvertedSelector from "$lib/components/simple/lists/ColorInvertedSelector.svelte";
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