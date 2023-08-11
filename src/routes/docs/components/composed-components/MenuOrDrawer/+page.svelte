<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import MenuOrDrawer from "$lib/components/composed/common/MenuOrDrawer.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";

  let activator: HTMLElement | undefined,
    open: boolean = false

  function handleButtonClick() {
    open = true
  }
</script>

<h1>MenuOrDrawer</h1>
<ComponentSubtitle>Put all the menus in the drawer please.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Button
    bind:buttonElement={activator}
    width="200px"
    maxWidth="90vw"
    on:click={handleButtonClick}
  >
    Open menu or drawer
  </Button>
  {#if !!activator}
    <MenuOrDrawer
      bind:open={open}
      activator={activator}
      let:isDrawer
    >
      {#if isDrawer}
        io sono un drawer
      {:else}
        io sono un menu
      {/if}
    </MenuOrDrawer>
  {/if}
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