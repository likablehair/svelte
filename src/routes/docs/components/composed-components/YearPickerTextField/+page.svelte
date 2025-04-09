<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import YearPickerTextfield from "$lib/components/composed/forms/YearPickerTextField.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";

  let selectedYear: number
</script>

<h1>YearPickerTextField</h1>
<ComponentSubtitle>If you want a year, you'll have a year.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div>Anno selezionato: {selectedYear}</div>
  <YearPickerTextfield
    bind:selectedYear={selectedYear}
    minYearInRange={1990}
    maxYearInRange={new Date().getFullYear()}
  ></YearPickerTextfield>
</div>
<h2>Props</h2>
<PropsViewer props={[
  { name: "menuOpened", type: "boolean", description: "Indicates if the menu is opened.", default: "false" },
  { name: "openingId", type: "string", description: "The identifier of the element opening the menu.", default: "'year-picker-text-field'" },
  { name: "selectedYear", type: "number", description: "The currently selected year.", default: "undefined" },
  { name: "placeholder", type: "string", description: "The placeholder text for the input field.", default: "undefined" },
  { name: "mobileDialog", type: "boolean", description: "Determines if a dialog should be shown on mobile.", default: "true" },
  { name: "maxYearInRange", type: "number", description: "The maximum year available in the range.", default: "2100" },
  { name: "minYearInRange", type: "number", description: "The minimum year available in the range.", default: "1900" },
  { name: "disabled", type: "boolean", description: "Disables the component.", default: "false" },
  { name: "class", type: "object", description: "Class bindings for the component.", default: "{}" },
]}
  styleProps={[
    // {
    //   name: '--button-max-width',
    //   type: 'string',
    //   default: 'undefined',
    //   description: 'The max width of the outer element'
    // }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[ 
    {
      name: "activatorSnippet",
      description: "Default slot for the activator snippet.",
      default: `
<SimpleTextField
  bind:value={mask.value}
  onfocus={() => handleTextFieldFocus(mAndDown)}
  onkeydown={handleInputChange}
  bind:input={inputElement}
  {placeholder}
  class={clazz.textfield}
  {disabled}
  {appendSnippet}
  {appendInnerSnippet}
  {prependSnippet}
>
  {#snippet prependInnerSnippet({ iconSize, prependInnerIcon })}
    {#if prependInnerInternalSnippet}
      {@render prependInnerInternalSnippet({ prependInnerIcon, iconSize })}
    {:else}
      <Icon
        name="mdi-calendar"
        onclick={() => menuOpened = !menuOpened}
      ></Icon>
    {/if}
  {/snippet}
</SimpleTextField>
      `,
      properties: [
        { name: "mask", type: "InputMask", description: "The input mask instance." },
        { name: "handleTextFieldFocus", type: "function", description: "Function to handle text field focus." },
        { name: "handleInputChange", type: "function", description: "Function to handle input changes." },
        { name: "inputElement", type: "HTMLElement", description: "The input element." },
        { name: "placeholder", type: "string", description: "The placeholder text." },
        { name: "disabled", type: "boolean", description: "Indicates if the input is disabled." }
      ]
    },
    { name: "prependSnippet", description: "Slot for prepending an icon outside the field.", default: `
{#if !!prependIcon}
  <Icon name={prependIcon} --icon-size={iconSize}></Icon>
{/if}
    `, properties: [{ name: "prependIcon", type: "string | undefined", description: "Icon to display." }, { name: "iconSize", type: "string", description: "Size of the icon." }] },
    { name: "prependInnerSnippet", description: "Slot for prepending an icon inside the field.", default: `
<Icon
  name="mdi-calendar"
  onclick={() => menuOpened = !menuOpened}
></Icon>
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
    `, properties: [{ name: "appendInnerIcon", type: "string | undefined", description: "Icon to display." }, { name: "iconSize", type: "string", description: "Size of the icon." }] },]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "oninput", description: "Fired when the input value changes.", properties: [
      { name: "year", type: "number | undefined", description: "The selected year or undefined if no year is selected." }
    ] },
    { name: "onyearClick", description: "Fired when a year is clicked.", properties: [
      { name: "year", type: "number", description: "The clicked year." }
    ] }
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 20px;
  }
</style>