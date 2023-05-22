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
    ></AlertBanner>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: 'title',
      type: 'string',
      default: "undefined",
      description: "The title of the banner."
    }, {
      name: 'description',
      type: 'string',
      default: "undefined",
      description: "The description of the banner."
    }, {
      name: 'disabled',
      type: 'boolean',
      default: "true",
      description: "Whather the banner is disabled."
    }
  ]}
  styleProps={[
    {
      name: '_bannerColor',
      type: 'string',
      default: "grey",
      description: "Banner color."
    }, {
      name: '_cursor',
      type: 'string',
      default: "pointer",
      description: "Cursors css property."
    }, {
      name: '_borderRadius',
      type: 'string',
      default: 'null',
      description: 'Border radius css property.'
    }, {
      name: '_paddingLeft',
      type: 'string',
      default: 'null',
      description: 'Padding left css property.'
    }, {
      name: '_paddingRight',
      type: 'string',
      default: 'null',
      description: 'Padding right css property.'
    }, {
      name: '_paddingTop',
      type: 'string',
      default: 'null',
      description: 'Padding top css property.'
    }, {
      name: '_paddingBottom',
      type: 'string',
      default: 'null',
      description: 'Padding bottom value.'
    }, {
      name: '_borderWidth',
      type: 'string',
      default: 'null',
      description: 'Border width css property.'
    }, {
      name: '_width',
      type: 'string',
      default: 'null',
      description: 'Container width css property.'
    }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: 'content',
      description: 'The alert content.',
      default: `{#if !!title}
  <slot name="title" title={title}>
    <div class="title">{title}</div>
  </slot>
{/if}
{#if !!description}
  <slot name="description" description={description}>
    <div class="description">{description}</div>
  </slot>
{/if}`,
      properties: [
        {
          name: 'title',
          type: 'string',
          description: 'The alert title.'
        }, {
          name: 'description',
          type: 'string',
          description: 'The alert description.'
        },
      ]
    }, {
      name: 'append',
      description: 'The alert append space.',
      default: ``,
      properties: [
        {
          name: 'disabled',
          type: 'boolean',
          description: 'The disabled prop.'
        }
      ]
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: 'click',
      description: 'Occours when the alert is clicked',
    }, {
      name: 'keypress',
      description: 'Occours when the alert is focused and a key is pressed',
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