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
      activator={activator}
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
    { name: 'activator', type: 'HTMLElement', description: 'Element that triggers the menu or drawer', default: 'undefined' },
    { name: 'drawerPosition', type: '"left" | "top" | "right" | "bottom"', description: 'Position of the drawer', default: "'bottom'" },
    { name: 'menuAnchor', type: '"bottom" | "bottom-center" | "right-center"', description: 'Anchor position of the menu', default: "'bottom-center'" },
    { name: 'stayInViewport', type: 'boolean', description: 'Prevents the menu from overflowing the viewport', default: 'true' },
    { name: 'flipOnOverflow', type: 'boolean', description: 'Flips the menu position if it overflows', default: 'false' },
    { name: '_boxShadow', type: 'string', description: 'Box shadow applied to the menu', default: '"rgb(var(--global-color-grey-900), .5) 0px 2px 4px"' },
    { name: '_height', type: 'string', description: 'Height of the menu', default: '"fit-content"' },
    { name: '_width', type: 'string', description: 'Width of the menu', default: 'undefined' },
    { name: '_maxHeight', type: 'string', description: 'Maximum height of the menu', default: 'undefined' },
    { name: '_minWidth', type: 'string', description: 'Minimum width of the menu', default: '"100px"' },
    { name: '_borderRadius', type: 'string', description: 'Border radius of the menu', default: '"5px"' },
    { name: 'openingId', type: 'string', description: 'Identifier for the opening state of the menu', default: 'undefined' },
    { name: '_drawerOverflow', type: 'string', description: 'Overflow behavior of the drawer', default: 'undefined' }
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
    { name: 'onclose', description: 'Triggered when the menu or drawer is closed',  },
    { name: "onitemClick", description: "Triggered when an item is clicked", properties: [{ name: "item", type: "Item", description: "The clicked item" }] },
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