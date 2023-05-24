<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";

  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte"
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";

</script>

<h1>SimpleTextField</h1>
<ComponentSubtitle>A simple TextField.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div
    style:flex-grow="1"
  >
    <SimpleTextField
      type="text"
      placeholder="value"
      hint="this is a SimpleTextField"
      appendInnerIcon="mdi-check"
    ></SimpleTextField>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: 'value',
      type: 'string | number | undefined',
      default: "undefined",
      description: "The value in the TextField"
    }, {
      name: 'type',
      type: '"text" | "password" | "number"',
      description: "The type of the input value",
      default: '"text"'
    }, {
      name: 'placeholder',
      type: 'string',
      description: "Placeholder",
      default: 'undefined'
    }, {
      name: 'disabled',
      type: 'boolean',
      description: "Whether the input field is disabled",
      default: 'false'
    }, {
      name: 'readonly',
      type: 'boolean',
      description: "Whether the input field is readonly",
      default: 'false'
    }, {
      name: 'prependIcon',
      type: 'string',
      description: "Name of the icon located before the container",
      default: 'undefined'
    }, {
      name: 'prependInnerIcon',
      type: 'string',
      description: "Name of the icon located inside the container bedore the field",
      default: 'undefined'
    }, {
      name: 'appendInnerIcon',
      type: 'string',
      description: "Name of the icon located inside the container after the field",
      default: 'undefined'
    }, {
      name: 'appendIcon',
      type: 'string',
      description: "Name of the icon located after the container",
      default: 'undefined'
    }, {
      name: 'iconSize',
      description: 'size of the icons',
      type: 'number',
      default: '12'
    }, {
      name: 'hint',
      description: 'a description under the input field',
      type: 'string',
      default: 'undefined'
    }
  ]}
  styleProps={[
    {
      name: '_padding',
      description: 'Padding css property',
      type: 'string',
      default: '0.65rem 1rem 0.65rem 1rem'
    }, {
      name: '_width',
      description: 'Width css property',
      type: 'string',
      default: '280px'
    }, {
      name: '_height',
      description: 'Height css property',
      type: 'string',
      default: 'null'
    }, {
      name: '_backgroundColor',
      description: 'background-color css property',
      type: 'string',
      default: 'rgb(244 244 245/1)'
    }, {
      name: '_borderRadius',
      description: 'border-radius css property',
      type: 'string',
      default: '9999px'
    }, {
      name: '_boxShadow',
      description: 'box-shadow css property',
      type: 'string',
      default: 'none'
    }, {
      name: '_transition',
      description: 'css transition time',
      type: 'string',
      default: '0.2s'
    }, {
      name: '_fontSize',
      description: 'font-size css property',
      type: 'string',
      default: '0.9rem'
    }, {
      name: '_fontWeight',
      description: 'font-weight css property',
      type: 'string',
      default: 'normal'
    }, {
      name: '_focusBackgroundColor',
      description: 'background color of the input field when focused',
      type: 'string',
      default: '_backgroundColor'
    }, {
      name: '_focusBoxShadow',
      description: 'box-shadow of the input field when focused',
      type: 'string',
      default: 'rgba(100, 100, 111, 0.4) 0px 4px 25px 0px'
    }, {
      name: '_outerGap',
      description: 'Gap between the container and outer icons (or slots)',
      type: 'string',
      default: '8px'
    }, {
      name: '_innerGap',
      description: 'Gap between the field and inner icons (or slots)',
      type: 'string',
      default: '8px'
    }, {
      name: '_hintFontSize',
      description: 'Font size of the hint',
      type: 'string',
      default: '0.75rem'
    }, {
      name: '_hintColor',
      description: 'Text color of the hint',
      type: 'string',
      default: 'grey'
    }, {
      name: '_hintMarginLeft',
      description: 'margin-left css proprty of the hint',
      type: 'string',
      default: '20px'
    }, {
      name: '_marginBottom',
      description: 'The space between the input field and the hint',
      type: 'string',
      default: '5px'
    }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
    slots={[
      {
        name: 'prepend',
        description: 'space before the input container',
        default: `{#if !!prependIcon}
  <Icon name={prependIcon} size={iconSize}></Icon>
{/if}`,
        properties: [
          {
            name: 'prependIcon',
            type: 'string',
            description: 'the prependIcon prop'
          }, {
            name: 'iconSize',
            type: 'string',
            description: 'the iconSize prop'
          }
        ]
      }, {
        name: 'prepend-inner',
        description: 'space inside the input container before the input field',
        default: `{#if !!prependInnerIcon}
  <Icon name={prependInnerIcon} size={iconSize}></Icon>
{/if}`,
        properties: [
          {
            name: 'prependInnerIcon',
            type: 'string',
            description: 'the prependInnerIcon prop'
          }, {
            name: 'iconSize',
            type: 'string',
            description: 'the iconSize prop'
          }
        ]
      }, {
        name: 'append-inner',
        description: 'space inside the input container after the input field',
        default: `{#if !!appendInnerIcon}
  <Icon name={appendInnerIcon} size={iconSize}></Icon>
{/if}`,
        properties: [
          {
            name: 'appendInnerIcon',
            type: 'string',
            description: 'the appendInnerIcon prop'
          }, {
            name: 'iconSize',
            type: 'string',
            description: 'the iconSize prop'
          }
        ]
      }, {
        name: 'append',
        description: 'space after the input container',
        default: `{#if !!appendIcon}
  <Icon name={appendIcon} size={iconSize}></Icon>
{/if}`,
        properties: [
          {
            name: 'appendIcon',
            type: 'string',
            description: 'the appendIcon prop'
          }, {
            name: 'iconSize',
            type: 'string',
            description: 'the iconSize prop'
          }
        ]
      }, {
        name: 'hint',
        description: 'space under the input container',
        default: `{{#if !!hint}
  <span class="hint">{hint}</span>
{/if}`
      }
    ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
      events={
        [
          {
            name: 'change',
            description: 'Native event',
          }, {
            name: 'input',
            description: 'Native event'
          }, {
            name: 'focus',
            description: 'Native event'
          }, {
            name: 'blur',
            description: 'Native event'
          }, {
            name: 'keydown',
            description: 'Native event'
          }, {
            name: 'keypress',
            description: 'Native event'
          }, {
            name: 'keyup',
            description: 'Native event'
          }
        ]
      }
></EventsViewer>