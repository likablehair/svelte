<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import DatePicker from "$lib/components/simple/dates/DatePicker.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
</script>

<h1>DatePicker</h1>
<ComponentSubtitle>Day to change, day to stick to the habits.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <DatePicker type='dateRange'></DatePicker>
  <DatePicker skipTabs disabled></DatePicker>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "selectedYear", type: "number", description: "The currently selected year.", default: "new Date().getFullYear()" },
    { name: "selectedMonth", type: "number", description: "The currently selected month.", default: "new Date().getMonth()" },
    { name: "type", type: "'singleDate' | 'dateRange'", description: "Choose either a single date or a date range.", default: "singleDate" },
    { name: "selectedDate", type: "Date", description: "The currently selected date.", default: "undefined" },
    { name: "selectedDateTo", type: "Date", description: "The currently selected date to for date ranges.", default: "undefined" },
    { name: "visibleMonth", type: "number", description: "The currently visible month in the calendar.", default: "selectedMonth" },
    { name: "visibleYear", type: "number", description: "The currently visible year in the calendar.", default: "selectedYear" },
    { name: "view", type: "'year' | 'month' | 'day'", description: "The current view mode of the date picker.", default: "'day'" },
    { name: "locale", type: "Locale", description: "The locale used for month names and date formatting.", default: "'it'" },
    { name: "selectableYears", type: "number[]", description: "The years that can be selected in the year view.", default: "[...Array(150).keys()].map((i) => i + (new Date().getFullYear() - 75))" },
    { name: "skipTabs", type: "boolean", description: "Whether to skip tab navigation.", default: "false" },
    { name: "disabled", type: "boolean", description: "Whether the date picker is disabled.", default: "false" },
    { name: "fillOpenRange", type: "boolean", description: "Treats the previous or next days for ranges as in-range.", default: "false" },
    { name: "class", type: "{ container?: string, header?: string, selectorRow?: string }", description: "Custom CSS class names for the date picker container, header, and selector row.", default: "undefined" },
  ]}
  styleProps={[
    { name: "--date-picker-height", type: "size", description: "The height of the date picker.", default: "400px" },
    { name: "--date-picker-width", type: "size", description: "The width of the date picker.", default: "100%" },
    { name: "--date-picker-header-background-color", type: "color", description: "The background color of the date picker header.", default: "rgb(var(--global-color-primary-600))" },
    { name: "--date-picker-header-color", type: "color", description: "The text color of the date picker header.", default: "rgb(var(--global-color-grey-50))" },
    { name: "--date-picker-box-shadow", type: "shadow", description: "The box shadow of the date picker.", default: "0 4px 6px -1px rgb(var(--global-color-contrast-300), .1), 0 2px 4px -2px rgb(var(--global-color-contrast-300), .1)" },
    { name: "--date-picker-overflow", type: "visibility", description: "The overflow behavior of the date picker.", default: "hidden" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      description: 'Label inside the header of the calendar',
      name: 'headerLabelSnippet',
      default: `
{#if !!selectedDate && !selectedDateTo}
  {dateToString(selectedDate, "dayAndMonth", locale)}
{:else if !!selectedDate && !!selectedDateTo}
  {dateToString(selectedDate, "dayAndMonth", locale)} - {dateToString(selectedDateTo, "dayAndMonth", locale)}
{/if}
`,
      properties: [
        {
          name: 'dateString',
          type: 'string',
          description: 'From date'
        },
        {
          name: 'dateToString',
          type: 'string',
          description: 'To date'
        },
      ]
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onyearClick", description: "Triggered when a year is clicked.", properties: [{ name: "year", type: "number", description: "The selected year" }] },
    { name: "onmonthClick", description: "Triggered when a month is clicked.", properties: [{ name: "month", type: "number", description: "The selected month" }] },
    { name: "ondayClick", description: "Triggered when a day is clicked.", properties: [{ name: "dateStat", type: "DateStat", description: "The date statistics for the selected day" }, { name: "selected", type: "boolean", description: "Indicates if the day is selected" }, { name: "extraMonth", type: "boolean", description: "Indicates if the day is from an extra month" }] }
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