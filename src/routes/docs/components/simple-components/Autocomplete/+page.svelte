<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";

  import Autocomplete, { type Item } from "$lib/components/simple/forms/Autocomplete.svelte";

  let items: Item[] = [
    { value: 'orange', label: 'Orange' },
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'pear', label: 'Pear' },
    { value: 'blackberry', label: 'Blackberry' }
  ]
</script>

<h1>Autocomplete</h1>
<ComponentSubtitle>Autocompletion out of the limits.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Autocomplete
    closeOnSelect
    items={items}
  ></Autocomplete>
  <Autocomplete
    closeOnSelect
    items={items}
    disabled
    placeholder="disabled"
  ></Autocomplete>
  <div style:font-size="">
    <Autocomplete
      items={items}
      multiple
      --chip-height="20px"
      --chip-min-height="20px"
      --chip-border-radius="8px"
      --autocomplete-min-height="auto"
      --autocomplete-padding="6px"
      --autocomplete-background-color="transparent"
      --autocomplete-border-radius="8px"
      --autocomplete-border="1px solid rgb(var(--global-color-background-200))"
      --autocomplete-focus-box-shadow="0 0 0 2px rgb(var(--global-color-primary-500))"
      maxVisibleChips={2}
      mobileDrawer={true}
    ></Autocomplete>
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
    }
  ]}
  styleProps={[
    {
      name: '--alert-banner-color',
      type: 'string',
      default: "grey",
      description: "Banner color."
    }
  ]}
></PropsViewer>
<h2>Slots</h2>
<!-- <SlotsViewer
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
></SlotsViewer> -->
<h2>Events</h2>
<!-- <EventsViewer
  events={[
    {
      name: 'click',
      description: 'Occours when the alert is clicked',
    }, {
      name: 'keypress',
      description: 'Occours when the alert is focused and a key is pressed',
    }
  ]}
></EventsViewer> -->

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
</style>