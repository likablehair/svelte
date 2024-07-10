<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import YearPickerTextfield from "$lib/components/composed/forms/YearPickerTextField.svelte";

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
    // {
    //   name: 'type',
    //   type: '"button" | "submit"',
    //   description: "HTML type attribute",
    //   default: "button"
    // }
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
<h2>Events</h2>

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