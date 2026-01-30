<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import DatePickerTextField from "$lib/components/composed/forms/DatePickerTextField.svelte";
  import { DateTime } from "luxon";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";

  let date: Date | undefined = new Date()

  setTimeout(() => {
    date = DateTime.fromJSDate(date || new Date()).plus({ year: 1 }).toJSDate()
  }, 2000);
</script>

<h1>DatePickerTextField</h1>
<ComponentSubtitle>If you want a date, you'll have a date.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div
    style:display="flex"
    style:justify-content="center"
    style:flex-direction="column"
    style:align-items="center"
  >
    <div 
      style:margin-bottom="16px"
    >
      {date}
    </div>
    <div class="h-flex">
      <DatePickerTextField type='dateRange'  />
      <DatePickerTextField 
        bind:selectedDate={date} 
        --calendar-day-width=30px
        --calendar-day-height=30px
        --calendar-day-border-radius=50%
        --calendar-grid-gap=1px
      />
    </div>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "menuOpened", type: "boolean", description: "Controls the visibility of the menu.", default: "false" },
    { name: "openingId", type: "string", description: "The unique identifier for the menu opener.", default: "'date-picker-text-field'" },
    { name: "pattern", type: "string", description: "The date format pattern.", default: "'dd/MM/yyyy'" },
    { name: "selectedMonth", type: "number", description: "The selected month.", default: "new Date().getMonth()" },
    { name: "selectedYear", type: "number", description: "The selected year.", default: "new Date().getFullYear()" },
    { name: "visibleMonth", type: "number", description: "The month currently visible in the picker.", default: "$bindable(selectedMonth)" },
    { name: "visibleYear", type: "number", description: "The year currently visible in the picker.", default: "$bindable(selectedYear)" },
    { name: "type", type: "'singleDate' | 'dateRange'", description: "Choose either a single date or a date range.", default: "singleDate" },
    { name: "selectedDate", type: "Date | undefined", description: "The currently selected date.", default: "$bindable(undefined)" },
    { name: "selectedDateTo", type: "Date | undefined", description: "The second currently selected date for date ranges.", default: "$bindable(undefined)" },
    { name: "placeholder", type: "string", description: "Placeholder text for the input field.", default: "undefined" },
    { name: "placeholderTo", type: "string", description: "Placeholder text for the second input field.", default: "undefined" },
    { name: "mobileDialog", type: "boolean", description: "Determines if the date picker uses a dialog on mobile.", default: "true" },
    { name: "maxYearInRange", type: "number", description: "Maximum year allowed in the date picker range.", default: "2100" },
    { name: "minYearInRange", type: "number", description: "Minimum year allowed in the date picker range.", default: "1970" },
    { name: "disabled", type: "boolean", description: "If true, the date picker is disabled.", default: "false" },
    { name: "flipOnOverflow", type: "boolean", description: "Determines if the menu flips on overflow.", default: "true" },
    { name: "class", type: "{ activator?: string, textfield?: ComponentProps<typeof SimpleTextField>['class'] }", description: "Custom class names for styling.", default: "{}" },
  ]}
  styleProps={[
  ]}
/>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: "activatorSnippet",
      description: "Snippet for customizing the activator element of the date picker.",
      default: `
<SimpleTextField
  bind:value={mask.value}
  onfocus={() => handleTextFieldFocus(mAndDown)}
  onkeydown={handleInputChange}
  bind:input={inputElement}
  {placeholder}
  class={clazz.textfield}
  {disabled}
  {appendInnerSnippet}
  {prependSnippet}
  {appendSnippet}
>
  {#snippet prependInnerSnippet({ iconSize, prependInnerIcon })}
    {#if prependInnerInternalSnippet}
      {@render prependInnerInternalSnippet({ prependInnerIcon, iconSize })}
    {:else}
      <Icon
        name="mdi-calendar"
        onclick={() => menuOpened = !menuOpened}
        tabindex={-1}
      ></Icon>
    {/if}
  {/snippet}
</SimpleTextField>
      `,
      properties: [
        { name: "mask", type: "InputMask", description: "The input mask for the date picker." },
        { name: "handleTextFieldFocus", type: "function", description: "The function that handles the focus event for the text field." },
        { name: "handleInputChange", type: "function", description: "The function that handles the change event for the input field." },
        { name: "inputElement", type: "HTMLElement | undefined", description: "The input element for the date picker." },
        { name: "placeholder", type: "string | undefined", description: "The placeholder text for the input field." },
        { name: "disabled", type: "boolean", description: "Determines if the date picker is disabled." }
      ]
    },
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
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "ondayClick", description: "Triggered when a day is clicked in the date picker.", properties: [{ name: "dateStat", type: "DateStat", description: "The date statistics for the clicked day." }] },
    { name: "oninput", description: "Triggered when the input value changes.", properties: [{ name: "datetime", type: "Date | undefined", description: "The selected date or undefined if no date is selected." }, { name: "id", type: '"from" | "to"', description: "The selected date for range date pickers." }] },
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

  .h-flex {
    display: flex;
    gap: 8px
  }
</style>
