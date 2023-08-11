<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Drawer from "$lib/components/simple/navigation/Drawer.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";

  let open: boolean = false

  function handleButtonClick() {
    open = true
  }
</script>

<h1>Drawer</h1>
<ComponentSubtitle>Drop your things in this drawer.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Button
    width="200px"
    maxWidth="90vw"
    on:click={handleButtonClick}
  >
    Open drawer
  </Button>
  <Drawer
    bind:open={open}
  >pippo</Drawer>
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