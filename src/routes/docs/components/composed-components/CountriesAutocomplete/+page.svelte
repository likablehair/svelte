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
    <Button on:click={() => dialog = !dialog}>Apri dialog</Button>
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
      {
        name: 'title',
        type: 'string',
        default: "undefined",
        description: "The title of the banner."
      }
    ]}
    styleProps={[
      {
        name: '--alert-banner-color',
        type: 'string',
        default: "grey",
        description: "Banner color."
      }
    ]}
  ></PropsViewer>
  <h2>Slots</h2>
  <h2>Events</h2>

  <style>
    .example {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
  </style>