<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import HierarchyMenu from "$lib/components/simple/lists/HierarchyMenu.svelte";

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