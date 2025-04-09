<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import Avatar from "$lib/components/simple/media/Avatar.svelte";
    import Select from "$lib/components/simple/forms/Select.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
</script>

<h1>Select</h1>
<ComponentSubtitle>Choose me.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Select
    options={[{
      text: 'Option 1',
      value: 'value',
      icon: 'mdi-wifi-strength-1'
    },
    {
      text: 'Option 2',
      value: 'value2',
      icon: 'mdi-wifi-strength-2'
    },
    {
      text: 'Option 3',
      value: 'value3',
      icon: 'mdi-wifi-strength-3'
    }]}
  >

  </Select>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "options", type: "Option[]", description: "List of options available in the select dropdown.", default: "undefined" },
    { name: "name", type: "string", description: "Name of the select input.", default: "undefined" },
    { name: "value", type: "string | number", description: "The selected value of the select input.", default: "undefined" },
    { name: "disabled", type: "boolean", description: "Disables the select input if true.", default: "false" },
    { name: "placeholder", type: "string", description: "Placeholder text when no option is selected.", default: "undefined" },
    { name: "optionAttributes", type: "HTMLOptionAttributes", description: "Additional attributes for the option elements.", default: "undefined" }
  ]}
  styleProps={[
    { name: "--select-border", type: "border", description: "Border of the select input.", default: "1.3px solid rgb(var(--global-color-contrast-300), .3)" },
    { name: "--select-active-border-color", type: "color", description: "Border color when the select is active.", default: "rgb(var(--global-color-primary-500))" },
    { name: "--option-border-color", type: "color", description: "Border color of each option.", default: "rgb(var(--global-color-contrast-200))" },
    { name: "--option-background-color", type: "color", description: "Background color of each option.", default: "rgb(var(--global-color-background-200))" },
    { name: "--option-color", type: "color", description: "Text color of each option.", default: "rgb(var(--global-color-contrast-700))" },
    { name: "--select-border-radius", type: "size", description: "Border radius of the select input.", default: "5px" },
    { name: "--select-padding-right", type: "size", description: "Right padding of the select input.", default: "5px" },
    { name: "--select-padding-left", type: "size", description: "Left padding of the select input.", default: "5px" },
    { name: "--select-background-color", type: "color", description: "Background color of the select input.", default: "transparent" },
    { name: "--select-color", type: "color", description: "Text color of the select input.", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--select-width", type: "size", description: "Width of the select input.", default: "100%" },
    { name: "--select-height", type: "size", description: "Height of the select input.", default: "36px" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onchange", description: "Triggered when the selected value changes." }
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