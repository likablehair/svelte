<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import Checkbox from "$lib/components/simple/forms/Checkbox.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
</script>

<h1>Checkbox</h1>
<ComponentSubtitle>A simple checkbox.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Checkbox />
  <Checkbox disabled />
  <Checkbox disabled value={true} />
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: 'value',
      type: 'boolean',
      description: 'The checked state of the checkbox.',
      default: 'false'
    },
    {
      name: 'id',
      type: 'string',
      description: 'The id of the checkbox element.',
      default: 'undefined'
    },
    {
      name: 'disabled',
      type: 'boolean',
      description: 'Whether the checkbox is disabled.',
      default: 'false'
    },
  ]}
  styleProps={[
    {
      name: '--checkbox-active-color',
      type: 'color',
      description: 'The background color of the checkbox when it is checked.',
      default: 'rgb(var(--global-color-primary-500))'
    },
    {
      name: '--checkbox-active-inner-color',
      type: 'color',
      description: 'The color of the checkmark inside the checkbox when checked.',
      default: 'rgb(var(--global-color-grey-50))'
    },
    {
      name: '--checkbox-focus-shadow',
      type: 'shadow',
      description: 'The shadow effect when the checkbox is focused.',
      default: '2px rgb(var(--global-color-primary-500), .3)'
    },
    {
      name: '--checkbox-border-color',
      type: 'color',
      description: 'The border color of the checkbox.',
      default: 'rgb(var(--global-color-contrast-300), .2)'
    },
    {
      name: '--checkbox-border-hover-color',
      type: 'color',
      description: 'The border color when the checkbox is hovered.',
      default: 'rgb(var(--global-color-primary-500))'
    },
    {
      name: '--checkbox-background-color',
      type: 'color',
      description: 'The background color of the checkbox.',
      default: 'rgb(var(--global-color-background-200))'
    },
    {
      name: '--checkbox-disabled-color',
      type: 'color',
      description: 'The background color of the checkbox when disabled.',
      default: 'rgb(var(--global-color-background-200), .5)'
    },
    {
      name: '--checkbox-disabled-active-color',
      type: 'color',
      description: 'The color of the checkbox when it is disabled and checked.',
      default: 'rgb(var(--global-color-primary-500))'
    },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: 'onchange',
      description: 'Triggered when the checkbox value changes.',
      properties: [
        {
          name: 'shiftKeyPressed',
          type: 'boolean',
          description: 'Indicates whether the Shift key is pressed during the change event.'
        },
        {
          name: 'nativeEvent',
          type: 'Event',
          description: 'The original event object.'
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
    margin-bottom: 20px;
  }
</style>