<script lang="ts">
    import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
    import PropsViewer from "../../PropsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import CountriesAutocomplete from "$lib/components/composed/forms/CountriesAutocomplete.svelte";
    import Button from "$lib/components/simple/buttons/Button.svelte";
    import Dialog from "$lib/components/simple/dialogs/Dialog.svelte";

    let dialog: boolean = false
  </script>
  
  <h1>CountriesAutocomplete</h1>
  <ComponentSubtitle>Every nation includes the flag.</ComponentSubtitle>
  <h2>Example</h2>
  <div class="example">
    <CountriesAutocomplete></CountriesAutocomplete>
    <CountriesAutocomplete
      --chip-height="20px"
      --chip-min-height="20px"
      --chip-border-radius="8px"
      --autocomplete-min-height="auto"
      --autocomplete-padding="6px"
      --autocomplete-background-color="transparent"
      --autocomplete-border-radius="8px"
      --autocomplete-border="1px solid rgb(var(--global-color-background-200))"
      --autocomplete-focus-border="2px solid rgb(var(--global-color-primary-500))"
      --countries-autocomplete-flag-icon-size=".8rem"
      autocompleteProps={{ mobileDrawer: true }}
    ></CountriesAutocomplete>
  </div>
  <div>
    <Button onclick={() => dialog = !dialog}>Apri dialog</Button>
    <Dialog
      bind:open={dialog}
    >
      <CountriesAutocomplete
        autocompleteProps={{ mobileDrawer: true }}
      ></CountriesAutocomplete>
    </Dialog>
  </div>
  <h2>Props</h2>
  <PropsViewer
    props={[
      { name: "autocompleteProps", type: "ComponentProps<typeof Autocomplete>", description: "Props to pass down to the Autocomplete component, excluding the 'items' prop.", default: "{}" },
      { name: "selected", type: "Item[]", description: "The selected items in the autocomplete.", default: "[]" },
      { name: "items", type: "Item[]", description: "The list of items displayed in the autocomplete.", default: "countriesOptions" },
      { name: "class", type: "{ flagIcon?: string, }", description: "Custom class names for styling.", default: "{}" },
    ]}
    styleProps={[]}
  ></PropsViewer>
  <h2>Slots</h2>
  <SlotsViewer
    slots={[]}
  ></SlotsViewer>
  <h2>Events</h2>
  <EventsViewer
    events={[
      {
        name: 'onchange',
        description: 'Fired when the selection changes.',
        properties: [
          { name: 'unselect', type: 'Item | undefined', description: 'The item that was unselected.' },
          { name: 'select', type: 'Item | undefined', description: 'The item that was selected.' },
          { name: 'selection', type: 'Item[]', description: 'The current selection of items.' }
        ]
      },
      {
        name: 'onfocus',
        description: 'Fired when the input field is focused.',
      },
      {
        name: 'onblur',
        description: 'Fired when the input field loses focus.',
      },
      {
        name: 'onkeydown',
        description: 'Fired when a key is pressed in the input field.',
      },
      {
        name: 'onclose',
        description: 'Fired when the menu is closed.',
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