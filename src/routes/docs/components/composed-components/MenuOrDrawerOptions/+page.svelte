<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import MenuOrDrawerOptions from "$lib/components/composed/common/MenuOrDrawerOptions.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";

  let activator: HTMLElement | undefined,
    open: boolean = false

  function handleButtonClick() {
    open = true
  }
</script>

<h1>MenuOrDrawerOptions</h1>
<ComponentSubtitle>If a menu does not have an option is not a menu.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Button
    bind:buttonElement={activator}
    onclick={handleButtonClick}
  >
    Open menu or drawer
  </Button>
  {#if !!activator}
    <MenuOrDrawerOptions
      bind:open={open}
      menuProps={{
        activator,
      }}
      elements={[
        {name: 'new', title: 'Nuovo', icon: 'mdi-plus' },
        {name: 'edit', title: 'Modifica', icon: 'mdi-pencil'},
        {name: 'delete', title: 'Elimina', icon: 'mdi-delete', style: { color: 'rgb(var(--global-color-error-400))' }},
        {name: 'edit1', title: 'Modifica', icon: 'mdi-pencil'},
        {name: 'edit2', title: 'Modifica', icon: 'mdi-pencil'},
        {name: 'edit3', title: 'Modifica', icon: 'mdi-pencil'},
        {name: 'edit4', title: 'Modifica', icon: 'mdi-pencil'},
        {name: 'edit5', title: 'Modifica', icon: 'mdi-pencil'},
        {name: 'disabled', title: 'Disabilitato', icon: 'mdi-pencil', disabled: true},
      ]}
    ></MenuOrDrawerOptions>
  {/if}
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'open', type: 'boolean', description: 'Controls whether the menu or drawer is open', default: 'false' },
    { name: 'elements', type: 'Element[]', description: 'List of selectable elements', default: '[]' },
    { name: 'menuProps', type: 'ComponentProps<typeof Menu>', description: 'Props for the menu', },
    { name: 'drawerProps', type: 'ComponentProps<typeof Drawer>', description: 'Props for the drawer', },
  ]}
  styleProps={[
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onselect", description: "Triggered when an element is selected.", properties: [{ name: "element", type: "Element", description: "The selected element." }] },
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