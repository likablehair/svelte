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
      name: 'iconSize',
      type: 'number | undefined',
      default: "undefined",
      description: "The append/prepend icon size."
    }, {
      name: 'target',
      type: 'string',
      default: "undefined",
      description: "The target attribute of the a tag."
    },
  ]}
  styleProps={[
    {
      name: '_color',
      type: 'string',
      default: "inherit",
      description: "color css property."
    }, {
      name: '_fontSize',
      type: 'string',
      default: ".875rem",
      description: "font-size css property."
    }, {
      name: '_lineHeight',
      type: 'string',
      default: "1.5rem",
      description: "line-height css property."
    }, {
      name: '_padding',
      type: 'string',
      default: "0.25rem 0.75rem 0.25rem 0.75rem",
      description: "padding css property."
    }, {
      name: '_backgroundColor',
      type: 'string',
      default: "rgb(244 244 245/1)",
      description: "background-color css property."
    }, {
      name: '_borderRadius',
      type: 'string',
      default: "9999px",
      description: "border-radius css property."
    }, {
      name: '_width',
      type: 'string',
      default: "fit-content",
      description: "width css property."
    }, {
      name: '_height',
      type: 'string',
      default: "auto",
      description: "height css property."
    }, {
      name: '_gap',
      type: 'string',
      default: "0.5rem",
      description: "gap css property."
    }, {
      name: '_fontWeight',
      type: 'string',
      default: "500",
      description: "font-weight css property."
    }, {
      name: '_hoverBackgroundColor',
      type: 'string',
      default: "rgb(228 228 231/1)",
      description: "background-color css property of hover button."
    }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: 'default',
      description: 'The button content',
    }, {
      name: 'prepend',
      description: 'The button prepend space',
      default: `{#if !!prependIcon}
  <Icon name={prependIcon} size={iconSize}></Icon>
{/if}`,
      properties: [
        {
          name: 'prependIcon',
          type: 'string',
          description: 'the prependIcon prop.'
        }, {
          name: 'iconSize',
          type: 'string',
          description: 'the iconSize prop.'
        },
      ]
    }, {
      name: 'append',
      description: 'The button append space',
      default: `{#if !!appendIcon}
  <Icon name={appendIcon} size={iconSize}></Icon>
{/if}`,
      properties: [
        {
          name: 'appendIcon',
          type: 'string',
          description: 'the appendIcon prop.'
        }, {
          name: 'iconSize',
          type: 'string',
          description: 'the iconSize prop.'
        },
      ]
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: 'click',
      description: 'Occours when the button is clicked',
      properties: [
        {
          name: 'NativeEvent',
          type: 'MouseEvent',
          description: 'The native event catched by the handler.'
        }
      ]
    }, {
      name: 'keypress',
      description: 'Occours when the button is focused and a key is pressed',
      properties: [
        {
          name: 'NativeEvent',
          type: 'KeyboardEvent',
          description: 'The native event catched by the handler.'
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