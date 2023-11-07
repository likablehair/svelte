<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import TabSwitcher from "$lib/components/simple/navigation/TabSwitcher.svelte";
</script>

<h1>TabSwitcher</h1>
<ComponentSubtitle>Switch to a new tab, switch to a new life.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <TabSwitcher 
    tabs={[
      { name: 'pippo', label: 'Pippo', icon: 'mdi-cog'},
      { name: 'pluto', label: 'Pluto', icon: 'mdi-cog'},
      { name: 'paperino', label: 'Paperino', icon: 'mdi-cog'},
    ]}
    selected="pippo"
  >Some chip</TabSwitcher>
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