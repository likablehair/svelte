<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";

  import LinkButton from "$lib/components/simple/buttons/LinkButton.svelte";
</script>

<h1>LinkButton</h1>
<ComponentSubtitle>Links a page, links a mood.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <LinkButton
    href="#"
  >Click me</LinkButton>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: 'disabled',
      type: 'boolean',
      default: "false",
      description: "Whether the button is disabled."
    }, {
      name: 'href',
      type: 'string',
      description: "The href attribute of the a tag."
    }, {
      name: 'prependIcon',
      type: 'string | undefined',
      default: "undefined",
      description: "The prepend icon name."
    }, {
      name: 'appendIcon',
      type: 'string | undefined',
      default: "undefined",
      description: "The append icon name."
    }, {
      name: 'target',
      type: 'string',
      default: "undefined",
      description: "The target attribute of the a tag."
    }, {
      name: 'class',
      type: 'string',
      default: "''",
      description: "Additional CSS class for the button."
    }
  ]}
  styleProps={[
    {
      name: '--link-button-color',
      type: 'color',
      default: 'rgb(var(--global-color-contrast-900))',
      description: 'The color of the link button.'
    },
    {
      name: '--link-button-width',
      type: 'size',
      default: 'fit-content',
      description: 'The width of the link button.'
    },
    {
      name: '--link-button-height',
      type: 'size',
      default: 'auto',
      description: 'The height of the link button.'
    },
    {
      name: '--link-button-font-size',
      type: 'size',
      default: '.875rem',
      description: 'The font size of the link button.'
    },
    {
      name: '--link-button-font-weight',
      type: 'number',
      default: '500',
      description: 'The font weight of the link button.'
    },
    {
      name: '--link-button-line-height',
      type: 'size',
      default: '1.5rem',
      description: 'The line height of the link button.'
    },
    {
      name: '--link-button-padding',
      type: 'size',
      default: '0.25rem 0.75rem 0.25rem 0.75rem',
      description: 'The padding inside the link button.'
    },
    {
      name: '--link-button-background-color',
      type: 'color',
      default: 'rgb(var(--global-color-background-300))',
      description: 'The background color of the link button.'
    },
    {
      name: '--link-button-border-radius',
      type: 'size',
      default: '9999px',
      description: 'The border radius of the link button.'
    },
    {
      name: '--link-button-gap',
      type: 'size',
      default: '.5rem',
      description: 'The gap between elements inside the link button.'
    },
    {
      name: '--link-button-hover-background-color',
      type: 'color',
      default: 'rgb(var(--global-color-background-400))',
      description: 'The background color on hover.'
    }
  ]}
/>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: 'default',
      description: 'The button content',
    },
    {
      name: 'prepend',
      description: 'The button prepend space',
      default: `{#if !!prependIcon}
  <Icon name={prependIcon}></Icon>
{/if}`,
      properties: [
        {
          name: 'prependIcon',
          type: 'string',
          description: 'The prependIcon prop.'
        }
      ]
    },
    {
      name: 'append',
      description: 'The button append space',
      default: `{#if !!appendIcon}
  <Icon name={appendIcon}></Icon>
{/if}`,
      properties: [
        {
          name: 'appendIcon',
          type: 'string',
          description: 'The appendIcon prop.'
        }
      ]
    }
  ]}
/>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: 'onclick',
      description: 'Triggered when the button is clicked.',
      properties: [
        {
          name: 'nativeEvent',
          type: 'MouseEvent',
          description: 'The native mouse event triggered by the click.'
        }
      ]
    },
    {
      name: 'onkeypress',
      description: 'Triggered when a key is pressed while the button is focused.',
      properties: [
        {
          name: 'nativeEvent',
          type: 'KeyboardEvent',
          description: 'The native keyboard event triggered by the key press.'
        }
      ]
    }
  ]}
/>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
</style>