<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import MenuOrDrawer from "$lib/components/composed/common/MenuOrDrawer.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";

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
    onclick={handleButtonClick}
  >
    Open menu or drawer
  </Button>
  {#if !!activator}
    <MenuOrDrawer
      bind:open={open}
      menuProps={{
        activator,
      }}
    >
      {#snippet children({ isDrawer, isMenu })}
        {#if isDrawer}
          io sono un drawer
        {:else}
          io sono un menu
        {/if}
      {/snippet} 
    </MenuOrDrawer>
  {/if}
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'open', type: 'boolean', description: 'Controls whether the menu or drawer is open', default: 'false' },
    { name: 'menuProps', type: 'ComponentProps<typeof Menu>', description: 'Props for the menu', },
    { name: 'drawerProps', type: 'ComponentProps<typeof Drawer>', description: 'Props for the drawer', },
  ]}
  styleProps={[]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: 'children', description: 'Slot for rendering the menu or drawer content', properties: [{ name: 'isDrawer', type: 'boolean', description: 'Indicates if the content is in a drawer' }, { name: 'isMenu', type: 'boolean', description: 'Indicates if the content is in a menu' }] }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
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