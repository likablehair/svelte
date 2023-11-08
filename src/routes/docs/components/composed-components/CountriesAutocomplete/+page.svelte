<script lang="ts">
    import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
    import PropsViewer from "../../PropsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import CountriesAutocomplete from "$lib/components/composed/forms/CountriesAutocomplete.svelte";
  </script>
  
  <h1>CountriesAutocomplete</h1>
  <ComponentSubtitle>Every nation includes the flag.</ComponentSubtitle>
  <h2>Example</h2>
  <div class="example">
    <CountriesAutocomplete></CountriesAutocomplete>
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