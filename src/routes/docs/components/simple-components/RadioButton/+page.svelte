<script lang="ts">
    import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
    import PropsViewer from "../../PropsViewer.svelte";
    
    import RadioButton from "$lib/components/simple/forms/RadioButton.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
</script>

<h1>Radio Button</h1>
<ComponentSubtitle>Tune in and choose you favorite station with our radio buttons.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <RadioButton name='radio' value='Pippo' label='Pippo' disabled checked/>
  <RadioButton name='radio' value='Pluto' label='Pippo'/>
  <RadioButton name='radio' value='PippoPluto' label='Pippo Pluto'/>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "name", type: "string", description: "Name attribute for the radio button." },
    { name: "value", type: "string", description: "Value associated with the radio button." },
    { name: "id", type: "string", description: "ID attribute for the radio button.", default: "undefined" },
    { name: "checked", type: "boolean", description: "Whether the radio button is checked.", default: "$bindable(false)" },
    { name: "label", type: "string", description: "Label text for the radio button.", default: "undefined" },
    { name: "disabled", type: "boolean", description: "Disables the radio button.", default: "false" }
  ]}
  styleProps={[
    { name: "--radio-button-active-color", type: "color", description: "Color of the active radio button.", default: "rgb(var(--global-color-primary-500))" },
    { name: "--radio-button-active-inner-color", type: "color", description: "Inner color of the active radio button.", default: "rgb(var(--global-color-grey-50))" },
    { name: "--radio-button-focus-shadow", type: "shadow", description: "Shadow when the radio button is focused.", default: "2px rgb(var(--global-color-primary-500), .3)" },
    { name: "--radio-button-border-color", type: "color", description: "Border color of the radio button.", default: "rgb(var(--global-color-contrast-300), .2)" },
    { name: "--radio-button-border-hover-color", type: "color", description: "Border color when the radio button is hovered.", default: "rgb(var(--global-color-primary-500))" },
    { name: "--radio-button-background-color", type: "color", description: "Background color of the radio button.", default: "rgb(var(--global-color-background-200))" },
    { name: "--radio-button-disabled-color", type: "color", description: "Color of the disabled radio button.", default: "rgb(var(--global-color-background-200), .5)" },
    { name: "--radio-button-disabled-active-color", type: "color", description: "Color of the active state when disabled.", default: "rgb(var(--global-color-primary-400))" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onchange", description: "Triggered when the radio button state changes." },
    { name: "oninput", description: "Triggered when the radio button receives input." },
    { name: "onfocus", description: "Triggered when the radio button gains focus." },
    { name: "onblur", description: "Triggered when the radio button loses focus." },
    { name: "onkeydown", description: "Triggered when a key is pressed down while focused on the radio button." },
    { name: "onkeypress", description: "Triggered when a key is pressed and released while focused on the radio button." },
    { name: "onkeyup", description: "Triggered when a key is released while focused on the radio button." }
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