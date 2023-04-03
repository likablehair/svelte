<script lang="ts">
  import FinalButton from "../../../FinalButton.svelte";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import DefaultButton from "$lib/components/simple/buttons/DefaultButton.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import colors from "../../../stores/colors";
  import EventsViewer from "../../EventsViewer.svelte";
</script>

<h1>DefaultButton</h1>
<ComponentSubtitle>The amazing power of simplicity in one button.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <DefaultButton
  >Click me</DefaultButton>
</div>
<h2>Props</h2>
<PropsViewer
  styleProps={[
    {
      name: '_backgroundColor',
      type: 'string',
      default: "rgba(239, 239, 239)",
      description: "background-color css property."
    }, {
      name: '_border',
      type: 'string',
      default: "none",
      description: "border css property."
    }, {
      name: '_padding',
      type: 'string',
      default: ".875rem 1.2rem",
      description: "padding css property."
    }, {
      name: '_color',
      type: 'string',
      default: "inherit",
      description: "color css property."
    }, {
      name: '_borderRadius',
      type: 'string',
      default: ".3rem",
      description: "border-radius css property."
    }, {
      name: '_cursor',
      type: 'string',
      default: "pointer",
      description: "cursor css property."
    }, {
      name: '_opacity',
      type: 'string',
      default: "100%",
      description: "opacity css property."
    }, {
      name: '_transitionTimingFunction',
      type: 'string',
      default: "ease-in-out",
      description: "transition-timing-function css property."
    }, {
      name: '_transitionDuration',
      type: 'string',
      default: ".1s",
      description: "transition-duration css property."
    }, {
      name: '_boxShadow',
      type: 'string',
      default: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      description: "box-shadow css property."
    }, {
      name: '_disabledBackgroundColor',
      type: 'string',
      default: "rgba(239, 239, 239, 0.3)",
      description: "background-color css property of disabled button."
    }, {
      name: '_disabledBorder',
      type: 'string',
      default: "none",
      description: "border css property of disabled button."
    }, {
      name: '_disabledColor',
      type: 'string',
      default: "inherit",
      description: "color property of disabled button."
    }, {
      name: '_disabledOpacity',
      type: 'string',
      default: "100%",
      description: "opacity css property of disabled button."
    }, {
      name: '_hoverBackgroundColor',
      type: 'string',
      default: "rgba(126, 126, 126, 0.3)",
      description: "background-color css property of hover button."
    }, {
      name: '_hoverBorder',
      type: 'string',
      default: "none",
      description: "border css property of hover button."
    }, {
      name: '_hoverColor',
      type: 'string',
      default: "inherit",
      description: "color css property of hover button."
    }, {
      name: '_hoverOpacity',
      type: 'string',
      default: "100%",
      description: "opacity css property of hover button."
    }, {
      name: '_hoverBoxShadow',
      type: 'string',
      default: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      description: "box-shadow css property of disabled button."
    }, {
      name: '_activeBackgroundColor',
      type: 'string',
      default: "rgba(126, 126, 126, 0.3)",
      description: "background-color css property of active button."
    }, {
      name: '_activeBorder',
      type: 'string',
      default: "none",
      description: "border css property of active button."
    }, {
      name: '_activeColor',
      type: 'string',
      default: "inherit",
      description: "color css property of active button."
    }, {
      name: '_activeOpacity',
      type: 'string',
      default: "100%",
      description: "opacity css property of active button."
    }, {
      name: '_activeBoxShadow',
      type: 'string',
      default: "100%",
      description: "box-shadow css property of active button."
    },  
  ]}
  props={[
    {
      name: 'disabled',
      type: 'boolean',
      default: "false",
      description: "Whether the button is disabled."
    }, {
      name: 'active',
      type: 'boolean',
      default: "false",
      description: "Whether the button is active."
    },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: 'default',
      description: 'The button content',
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