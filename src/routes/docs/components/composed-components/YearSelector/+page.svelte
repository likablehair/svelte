<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import YearSelector from "$lib/components/simple/dates/YearSelector.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
</script>

<h1>YearSelector</h1>
<ComponentSubtitle>Select your year.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <YearSelector></YearSelector>
</div>
<h2>Props</h2>
<PropsViewer props={[
  { name: "selectedYear", type: "number", description: "The currently selected year.", default: "undefined" },
  { name: "selectableYears", type: "number[]", description: "The list of selectable years.", default: "[...Array(150).keys()].map((i) => i + (new Date().getFullYear() - 75))" },
  { name: "disabled", type: "boolean", description: "If true, the year selector will be disabled.", default: "false" },
  { name: "class", type: "string", description: "Custom CSS class for the year selector.", default: "undefined" }
]}
  styleProps={[
    { name: "--year-selector-height", type: "size", description: "The height of the year selector.", default: "100%" },
    { name: "--year-selector-max-height", type: "size", description: "The maximum height of the year selector.", default: "500px" },
    { name: "--year-selector-width", type: "size", description: "The width of the year selector.", default: "100%" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "selectorSnippet", description: "A snippet for rendering the year selector button.", default: `
<div bind:this={targetButtons[year]} style:width="100%">
  <Button
    --button-background-color={year == selectedYear ? "rgb(var(--global-color-primary-500))" : "trasparent"}
    --button-active-background-color={year == selectedYear ? "rgb(var(--global-color-primary-500))" : "trasparent"}
    --button-focus-background-color={year == selectedYear ? "rgb(var(--global-color-primary-500))" : "trasparent"}
    --button-hover-background-color={year == selectedYear ? "var(--button-background-color)" : "rgb(var(--global-color-primary-500), .2)"}
    --button-color={year == selectedYear ?  "rgb(var(--global-color-grey-50))" : undefined}
    --button-font-weight="500"
    --button-width="var(--year-selector-width, var(--year-selector-default-width))"
    --button-padding=".5rem 0px"
    buttonType="text"
    onclick={() => handleYearClick(year)}
    disabled={disabled}
  >
    {#if labelSnippet}
      {@render labelSnippet({ year })}
    {:else}
      <div
        style:transition="all .1s"
        style:font-weight={year == selectedYear ? "700" : "400"}
        style:font-size={year == selectedYear ? "16pt" : "13pt"}
      >
        {year}
      </div>
    {/if}
  </Button>
</div>
    `, properties: [{ name: "year", type: "number", description: "The year to display." }, { name: "handleYearClick", type: "function", description: "The function to call when a year is clicked." }] },
    { name: "labelSnippet", description: "A snippet for rendering a label for each year.", default: `
<div
  style:transition="all .1s"
  style:font-weight={year == selectedYear ? "700" : "400"}
  style:font-size={year == selectedYear ? "16pt" : "13pt"}
>
  {year}
</div>
    `, properties: [{ name: "year", type: "number", description: "The year to label." }] }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onclick", description: "Triggered when a year is clicked.", properties: [{ name: "year", type: "number", description: "The year that was clicked." }] },
    { name: "onchange", description: "Triggered when the selected year changes.", properties: [{ name: "year", type: "number | undefined", description: "The updated selected year." }] }
  ]}
></EventsViewer>
<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin-bottom: 20px;
  }
</style>