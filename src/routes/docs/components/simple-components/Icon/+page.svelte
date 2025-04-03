<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
</script>

<h1>Icon</h1>
<ComponentSubtitle>Be iconic.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Icon name='mdi-cake'></Icon>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'name', type: 'string', description: 'The name of the material design icon.' },
    { name: 'tabindex', type: 'number | null', description: 'Optional tabindex for accessibility.', default: 'undefined' },
    { name: 'class', type: 'string', description: 'Optional additional classes to apply to the icon.', default: 'undefined' },
  ]}
  styleProps={[
    { name: 'icon-size', type: 'size', description: 'The font size of the icon.', },
    { name: 'icon-color', type: 'color', description: 'The color of the icon.', },
    { name: 'icon-cursor', type: 'cursor', description: 'The cursor style when the icon is clickable.', default: 'pointer' },
    { name: 'icon-pointer-events', type: 'events', description: 'Controls whether the icon is interactive or not.', default: 'none' },
    { name: 'icon-height', type: 'size', description: 'The height of the icon container.',  },
    { name: 'icon-width', type: 'size', description: 'The width of the icon container.',  },
    { name: 'icon-active-color', type: 'color', description: 'The color of the icon on click.', default: 'rgb(var(--global-color-primary-600))' },
    { name: 'icon-hover-color', type: 'color', description: 'The color of the icon on hover or focus.', default: 'rgb(var(--global-color-primary-500))' }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: 'onclick',
      description: 'Triggered when the icon is clicked or pressed.',
      properties: [
        { name: 'event', type: 'KeyboardEvent', description: 'The keyboard event that triggered the action.' }
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
    margin-bottom: 20px;
  }
</style>