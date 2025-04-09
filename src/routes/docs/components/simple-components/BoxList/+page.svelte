<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import BoxList from "$lib/components/simple/lists/BoxList.svelte";
</script>

<h1>BoxList</h1>
<ComponentSubtitle>A lot of boxes</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <BoxList boxes={[
    {
      name: 'dashboard',
      label: 'Dashboard',
      style: { width: '200px' }
    },
    {
      name: 'settings',
      label: 'Settings',
      style: { width: '200px' }
    },
    {
      name: 'profile',
      label: 'Profile',
      style: { width: '200px' }
    }
  ]}/>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: 'boxes',
      type: 'Box[]',
      description: 'Array of box objects to be displayed in the list.',
      default: '[]'
    },
    {
      name: 'gap',
      type: 'string',
      description: 'Gap between items in the list.',
      default: "'15px'"
    },
  ]}
  styleProps={[]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: 'boxSnippet',
      description: 'Slot for custom content inside the box.',
      default: `
{#if box.href}
  <a
    class="box"
    style:width={box.style?.width}
    style:max-width={box.style?.maxWidth}
    style:min-width={box.style?.minWidth}
    href={box.href}
    onclick={(event) => handleBoxClick(event, box)}
  >
    <div style:flex-grow="1">
      {box.label}
    </div>
    <div style:margin-left="10px">
      <Icon name="mdi-arrow-right" />
    </div>
  </a>
{:else}
  <button
    class="box"
    style:width={box.style?.width}
    style:max-width={box.style?.maxWidth}
    style:min-width={box.style?.minWidth}
    onclick={(event) => handleBoxClick(event, box)}
  >
    <div style:flex-grow="1">
      {box.label}
    </div>
    <div style:margin-left="10px">
      <Icon name="mdi-arrow-right" />
    </div>
  </button>
{/if}
      `,
      properties: [
        {
          name: 'box',
          type: 'Box',
          description: 'The box object passed to the slot.'
        }
      ]
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: 'onboxClick',
      description: 'Triggered when a box is clicked.',
      properties: [
        {
          name: 'box',
          type: 'Box',
          description: 'The box object that was clicked.'
        }
      ]
    }
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
</style>