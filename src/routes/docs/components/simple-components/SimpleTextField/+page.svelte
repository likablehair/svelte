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
    { name: "value", type: "string | number", description: "Bound value of the text field.", default: "undefined" },
    { name: "type", type: "'text' | 'password' | 'number' | 'time' | 'date'", description: "Type of input field.", default: "'text'" },
    { name: "placeholder", type: "string", description: "Placeholder text.", default: "undefined" },
    { name: "disabled", type: "boolean", description: "Whether the input is disabled.", default: "false" },
    { name: "readonly", type: "boolean", description: "Whether the input is read-only.", default: "false" },
    { name: "id", type: "string", description: "ID of the input field.", default: "undefined" },
    { name: "appendIcon", type: "string", description: "Icon to display at the end.", default: "undefined" },
    { name: "appendInnerIcon", type: "string", description: "Icon inside the field at the end.", default: "undefined" },
    { name: "prependIcon", type: "string", description: "Icon to display at the start.", default: "undefined" },
    { name: "prependInnerIcon", type: "string", description: "Icon inside the field at the start.", default: "undefined" },
    { name: "iconSize", type: "string", description: "Size of the icons.", default: "'12pt'" },
    { name: "name", type: "string", description: "Name attribute of the input field.", default: "undefined" },
    { name: "hint", type: "string", description: "Hint text below the input field.", default: "undefined" },
    { name: "input", type: "HTMLElement", description: "Reference to the input element.", default: "undefined" },
    { name: "class", type: "{ container?: string, row?: string, field?: string, hint?: string, input?: string }", description: "Additional CSS class for the button.", default: "undefined" }
  ]}
  styleProps={[
    { name: "--simple-textfield-padding", type: "spacing", description: "Padding inside the text field", default: "0.65rem 1rem 0.65rem 1rem" },
    { name: "--simple-textfield-width", type: "size", description: "Width of the text field", default: "280px" },
    { name: "--simple-textfield-background-color", type: "color", description: "Background color of the text field", default: "rgb(var(--global-color-background-300), .5)" },
    { name: "--simple-textfield-border-radius", type: "size", description: "Border radius of the text field", default: "9999px" },
    { name: "--simple-textfield-box-shadow", type: "shadow", description: "Box shadow of the text field", default: "none" },
    { name: "--simple-textfield-transition", type: "animation", description: "Transition effect duration", default: ".2s" },
    { name: "--simple-textfield-font-size", type: "typography", description: "Font size of the text field", default: ".9rem" },
    { name: "--simple-textfield-font-weight", type: "typography", description: "Font weight of the text field", default: "normal" },
    { name: "--simple-textfield-outer-gap", type: "spacing", description: "Gap between elements around the text field", default: "8px" },
    { name: "--simple-textfield-inner-gap", type: "spacing", description: "Gap between elements inside the text field", default: "8px" },
    { name: "--simple-textfield-hint-font-size", type: "typography", description: "Font size of the hint text", default: ".75rem" },
    { name: "--simple-textfield-hint-color", type: "color", description: "Color of the hint text", default: "rgb(var(--global-color-contrast-500), .5)" },
    { name: "--simple-textfield-hint-margin-left", type: "spacing", description: "Margin left for the hint text", default: "20px" },
    { name: "--simple-textfield-margin-bottom", type: "spacing", description: "Bottom margin of the text field", default: "5px" },
    { name: "--simple-textfield-color", type: "color", description: "Text color of the input field", default: "rgb(var(--global-color-contrast-900))" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "prependSnippet", description: "Slot for prepending an icon outside the field.", default: `
{#if !!prependIcon}
  <Icon name={prependIcon} --icon-size={iconSize}></Icon>
{/if}
    `, properties: [{ name: "prependIcon", type: "string | undefined", description: "Icon to display." }, { name: "iconSize", type: "string", description: "Size of the icon." }] },
    { name: "prependInnerSnippet", description: "Slot for prepending an icon inside the field.", default: `
{#if !!prependInnerIcon}
  <Icon name={prependInnerIcon} --icon-size={iconSize}></Icon>
{/if}
    `, properties: [{ name: "prependInnerIcon", type: "string | undefined", description: "Icon to display." }, { name: "iconSize", type: "string", description: "Size of the icon." }] },
    { name: "appendSnippet", description: "Slot for appending an icon outside the field.", default: `
{#if !!appendIcon}
  <Icon name={appendIcon} --icon-size={iconSize}></Icon>
{/if}
    `, properties: [{ name: "appendIcon", type: "string | undefined", description: "Icon to display." }, { name: "iconSize", type: "string", description: "Size of the icon." }] },
    { name: "appendInnerSnippet", description: "Slot for appending an icon inside the field.", default: `
{#if !!appendInnerIcon}
  <Icon name={appendInnerIcon} --icon-size={iconSize}></Icon>
{/if}
    `, properties: [{ name: "appendInnerIcon", type: "string | undefined", description: "Icon to display." }, { name: "iconSize", type: "string", description: "Size of the icon." }] },
    { name: "hintSnippet", description: "Slot for custom hint text.", default: `
{#if !!hint}
  <span class="hint">{hint}</span>
{/if}
    `, properties: [{ name: "hint", type: "string | undefined", description: "Hint text to display." }] }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onchange", description: "Triggered when input value changes." },
    { name: "oninput", description: "Triggered while typing inside the input field." },
    { name: "onfocus", description: "Triggered when input field is focused." },
    { name: "onblur", description: "Triggered when input field loses focus." },
    { name: "onkeydown", description: "Triggered when a key is pressed down." },
    { name: "onkeyup", description: "Triggered when a key is released." },
    { name: "onkeypress", description: "Triggered when a key that produces a character is pressed." }
  ]}
></EventsViewer>