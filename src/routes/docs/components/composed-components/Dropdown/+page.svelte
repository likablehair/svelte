<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";

  import Dropdown from "$lib/components/composed/forms/Dropdown.svelte";
  import Dialog from "$lib/components/simple/dialogs/Dialog.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import type { Item } from "$lib/components/simple/forms/Autocomplete.svelte";


  let items: Item[] = [
    { value: 'orange', label: 'Orange' },
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'pear', label: 'Pear' },
    { value: 'blackberry', label: 'Blackberry' },
    { value: 'grape', label: 'Grape' },
    { value: 'watermelon', label: 'Watermelon' },
    { value: 'pineapple', label: 'Pineapple' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'kiwi', label: 'Kiwi' },
    { value: 'mango', label: 'Mango' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'blueberry', label: 'Blueberry' },
    { value: 'raspberry', label: 'Raspberry' },
    { value: 'peach', label: 'Peach' },
    { value: 'apricot', label: 'Apricot' },
    { value: 'plum', label: 'Plum' },
    { value: 'lemon', label: 'Lemon' },
    { value: 'lime', label: 'Lime' },
    { value: 'coconut', label: 'Coconut' }
  ],
  dialogOpened: boolean = false
</script>

<h1>Dropdown</h1>
<ComponentSubtitle>Easily drop your things down.</ComponentSubtitle>
<h2>Example</h2>
<div 
  style:position="sticky" 
  style:top="70px"
>
  <Dropdown 
    {items}
    multiple={true}
  ></Dropdown>
</div>
<div style:height="150px">lorem</div>
<div class="example">
  <Dropdown
    icon="mdi-apple"
    {items}
  ></Dropdown>
  <Dropdown 
    {items}
    multiple={true}
  ></Dropdown>

  <div style:position="relative" style:height="400px" style:overflow="auto" style:width="80vw">
    <div style:height="500px">lorem</div>
    <div 
      style:position="sticky" 
      style:top="0px"
    >
      <Dropdown 
        {items}
        multiple={true}
      ></Dropdown>
    </div>
    <div style:height="500px">lorem</div>
  </div>
</div>
<Button onclick={() => dialogOpened = true}>Apri dialog</Button>
<Dialog
  bind:open={dialogOpened}
>
  <div
    style:background-color="rgb(var(--global-color-background-200))"
    style:border-radius="8px"
    style:height="200px"
    style:width="300px"
  >
    <Dropdown 
      {items}
      multiple={true}
    ></Dropdown>
  </div>
</Dialog>
<div 
  style:position="relative"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:height="500px"
>
  <Dropdown 
    {items}
    multiple={true}
  ></Dropdown>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "items", type: "Item[]", description: "List of items to be displayed in the autocomplete menu.", default: "[]" },
    { name: "values", type: "Item[]", description: "List of selected items.", default: "$bindable([])" },
    { name: "multiple", type: "boolean", description: "If true, multiple items can be selected.", default: "false" },
    { name: "lang", type: "'it' | 'en'", description: "Language of the autocomplete placeholder text.", default: "'en'" },
    { name: "searchText", type: "string", description: "The search text entered in the input field.", default: "$bindable()" },
    { name: "maxVisibleChips", type: "number", description: "Maximum number of chips to display.", default: "undefined" },
    { name: "placeholder", type: "string", description: "Placeholder text for the input field.", default: "lang === 'en' ? 'Select' : 'Seleziona'" },
    { name: "clearable", type: "boolean", description: "If true, a clear button is displayed to clear the selected items.", default: "true" },
    { name: "mandatory", type: "boolean", description: "If true, the field is mandatory to select.", default: "true" },
    { name: "icon", type: "string", description: "The name of the icon to display in the label.", default: "undefined" },
    { name: "menuOpened", type: "boolean", description: "If true, the autocomplete menu is open.", default: "$bindable(false)" },
    { name: "openingId", type: "string", description: "The unique identifier for the autocomplete menu.", default: "$bindable('autocomplete-menu')" },
    { name: "width", type: "string", description: "Width of the autocomplete input field.", default: "undefined" },
    { name: "minWidth", type: "string", description: "Minimum width of the autocomplete input field.", default: "undefined" },
    { name: "menuWidth", type: "string", description: "Width of the autocomplete menu.", default: "width" },
    { name: "mobileDrawer", type: "boolean", description: "If true, the menu is displayed as a mobile drawer.", default: "false" },
    { name: "disabled", type: "boolean", description: "If true, the autocomplete is disabled.", default: "false" },
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
      name: 'itemLabelSnippet', 
      description: 'Renders the label of an item.', 
      default: '{item.label}', 
      properties: [
        { name: 'item', type: 'ItemData', description: 'The item to render the label for.' }
      ]
    },
    {
      name: "labelSnippet",
      description: "Snippet for customizing the label of the button element in the autocomplete.",
      default: `
<div class="label">
  {#if !!icon}
    <Icon name={icon}></Icon>
  {/if}
  {#if values.length == 0}
    <div class="space-between">
      <div>{placeholder}</div>
      <Icon name="mdi-chevron-down"></Icon>
    </div>
  {:else}
    <div class="space-between">
      <div>{generatedLabel}</div>
      {#if clearable}
        <Icon
          name="mdi-close"
          onclick={handleCloseClick}
        ></Icon>
      {/if}
    </div>
  {/if}
</div>
      `,
      properties: [
        { name: "values", type: "Item[]", description: "The selected items." },
        { name: "items", type: "Item[]", description: "The list of available items." },
        { name: "searchText", type: "string", description: "The current search text." },
        { name: "generatedLabel", type: "string", description: "The generated label based on selected items." },
        { name: "placeholder", type: "string", description: "The placeholder text for the input." },
        { name: "clearable", type: "boolean", description: "If true, a clear button is displayed." },
        { name: "handleCloseClick", type: "function", description: "Function triggered when the clear button is clicked." }
      ]
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onchange", description: "Triggered when the selected items change.", properties: [
        { name: "unselect", type: "Item | undefined", description: "The item that was unselected." },
        { name: "select", type: "Item | undefined", description: "The item that was selected." },
        { name: "selection", type: "Item[]", description: "The list of currently selected items." }
      ]
    },
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