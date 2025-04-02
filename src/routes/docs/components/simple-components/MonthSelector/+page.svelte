<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import MonthSelector from "$lib/components/simple/dates/MonthSelector.svelte";
</script>

<h1>MonthSelector</h1>
<ComponentSubtitle>Just a month selector</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <MonthSelector></MonthSelector>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "selectedMonth", type: "number | undefined", description: "The currently selected month (0-11).", default: "undefined" },
    { name: "locale", type: "Locale", description: "The locale for month names (default is 'it').", default: "'it'" },
    { name: "class", type: "{ buttons?: string, container?: string, }", description: "Custom CSS class for the buttons and container.", default: "undefined" }
  ]}
  styleProps={[
    { name: "--month-selector-height", type: "size", description: "The height of the month selector.", default: "100%" },
    { name: "--month-selector-width", type: "size", description: "The width of the month selector.", default: "100%" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "selectorSnippet", description: "A snippet for rendering the selector button for each month.", default: `
<Button
  --button-background-color={monthIndex == selectedMonth ? "rgb(var(--global-color-primary-500))" : "trasparent"}
  --button-hover-background-color={monthIndex == selectedMonth ? "var(--button-background-color)" : "rgb(var(--global-color-primary-500), .2)"}
  --button-color={monthIndex == selectedMonth ?  "rgb(var(--global-color-grey-50))" : undefined}
  --button-font-weight="500"
  class={clazz.buttons}
  buttonType="text"
  onclick={() => handleMonthClick(monthIndex)}
>
  {#if labelSnippet}
    {@render labelSnippet({ month: monthIndex, monthName: getMonthName(monthIndex, locale) })}
  {:else}
    {getMonthName(monthIndex, locale)}
  {/if}
</Button>`, 
    properties: [{ name: "month", type: "number", description: "The month index (0-11)." }, { name: "monthName", type: "string", description: "The localized name of the month." }] },
    { name: "labelSnippet", description: "A snippet for rendering a label for each month.", default: `
{getMonthName(monthIndex, locale)}
    `, properties: [{ name: "month", type: "number", description: "The month index (0-11)." }, { name: "monthName", type: "string", description: "The localized name of the month." }] }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onclick", description: "Triggered when a month is clicked.", properties: [{ name: "monthIndex", type: "number", description: "The index of the clicked month (0-11)." }] }
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