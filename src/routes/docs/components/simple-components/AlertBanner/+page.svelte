<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";

  import AlertBanner from "$lib/components/simple/notifiers/AlertBanner.svelte";
</script>

<h1>AlertBanner</h1>
<ComponentSubtitle>Warning, an alert is coming.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div
    style:flex-grow="1"
  >
    <AlertBanner
      title="Warning"
      description="an alert is coming"
      --alert-banner-color="red"
    ></AlertBanner>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'title', type: 'string', description: 'The title text for the alert banner', default: 'undefined' },
    { name: 'description', type: 'string', description: 'The description text for the alert banner', default: 'undefined' },
    { name: 'disabled', type: 'boolean', description: 'Whether the alert banner is disabled and non-interactive', default: 'false' },
    { name: 'class', type: '{ container?: string, border?: string, body?: string }', description: 'Custom CSS classes for the alert banner container, border, and body', default: 'undefined' },
  ]}
  styleProps={[
    { name: '--alert-banner-border-radius', type: 'size', description: 'Border radius for the alert banner', default: '5px' },
    { name: '--alert-banner-color', type: 'color', description: 'Color for the alert banner', default: 'var(--my-var-blue)' },
    { name: '--alert-banner-border-width', type: 'size', description: 'Width of the border on the alert banner', default: '.7rem' },
    { name: '--alert-banner-padding-left', type: 'size', description: 'Padding on the left side of the alert banner', default: '.5rem' },
    { name: '--alert-banner-padding-top', type: 'size', description: 'Padding on the top of the alert banner', default: '.3rem' },
    { name: '--alert-banner-padding-bottom', type: 'size', description: 'Padding on the bottom of the alert banner', default: '.3rem' },
    { name: '--alert-banner-padding-right', type: 'size', description: 'Padding on the right side of the alert banner', default: '.3rem' },
    { name: '--alert-banner-cursor', type: 'string', description: 'Cursor style for the alert banner', default: 'pointer' },
    { name: '--alert-banner-width', type: 'size', description: 'Width of the alert banner', default: '100%' }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { 
      name: 'contentSnippet', 
      description: 'A snippet to customize the content of the alert banner', 
      default: 'undefined', 
      properties: [
        { name: 'title', type: 'string', description: 'The title of the alert banner' },
        { name: 'description', type: 'string', description: 'The description of the alert banner' }
      ]
    },
    { 
      name: 'titleSnippet', 
      description: 'A snippet to customize the title of the alert banner', 
      default: 'undefined', 
      properties: [
        { name: 'title', type: 'string', description: 'The title of the alert banner' }
      ]
    },
    { 
      name: 'descriptionSnippet', 
      description: 'A snippet to customize the description of the alert banner', 
      default: 'undefined', 
      properties: [
        { name: 'description', type: 'string', description: 'The description of the alert banner' }
      ]
    },
    { 
      name: 'appendSnippet', 
      description: 'A snippet to append additional content to the alert banner', 
      default: 'undefined', 
      properties: [
        { name: 'disabled', type: 'boolean', description: 'Whether the additional content should be disabled' }
      ]
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { 
      name: 'onclick', 
      description: 'Triggered when the alert banner is clicked', 
      properties: [
        { name: 'e', type: 'MouseEvent', description: 'The native mouse click event' }
      ]
    },
    { 
      name: 'onkeypress', 
      description: 'Triggered when a key is pressed while focusing on the alert banner', 
      properties: [
        { name: 'e', type: 'KeyboardEvent', description: 'The native keyboard event' }
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