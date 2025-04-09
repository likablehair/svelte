<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import { FilterEditor } from "$lib";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";

  let labelsMapper = {
    equal: { extended: 'equal to', short: 'equal' },
    like: { short: 'includes' },
    ilike: { short: 'includes' },
    contains: { short: 'contains' },
    greater: { short: 'greater', extended: 'greater than' },
    lower: { short: 'lower', extended: 'lower than' },
    between: { short: 'between', extended: 'is between' },
    different: { short: 'different', extended: 'different from' }
  }
</script>

<h1>Filters</h1>
<ComponentSubtitle>Make it easy, make it filter.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <FilterEditor
    filter={{
      type: "string",
      label: "Name",
      value: "John",
      name: 'nome',
      column: 'column',
      mode: "contains",
      advanced: true
    }}
    {labelsMapper}
    lang="en"
    
  />

  <FilterEditor
    filter={{
      type: "select",
      label: "Category",
      values: [
        { value: "books", label: "Books" },
        { value: "games", label: "Games" },
      ],
      items: [
        { value: "books", label: "Books" },
        { value: "games", label: "Games" },
        { value: "movies", label: "Movies" }
      ],
      mode: "different",
      column: 'columen',
      name: 'name',
      view: "autocomplete",
      advanced: true
    }}
    {labelsMapper}
    mobile={true}
    lang="en"
/>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "filter", type: "Filter", description: "The filter currently being edited", default: "undefined" },
    { name: "lang", type: "'en' | 'it'", description: "Language for labels", default: "'en'" },
    { name: "betweenFromLabel", type: "string", description: "Label for 'from' field in between mode", default: "'From' or 'Da'" },
    { name: "betweenToLabel", type: "string", description: "Label for 'to' field in between mode", default: "'To' or 'A'" },
    { name: "labelsMapper", type: "LabelMapper", description: "Label mapper for filter mode translations", default: "undefined" },
    { name: "forceApplyValid", type: "boolean", description: "Allows applying even if invalid", default: "false" },
    { name: "editFilterMode", type: "'one-edit' | 'multi-edit'", description: "Filter editing mode", default: "'one-edit'" },
    { name: "tmpFilter", type: "Filter", description: "Temporary filter state", default: "undefined" },
    { name: "mobile", type: "boolean", description: "If true, component adapts for mobile display", default: "false" }
  ]}
  styleProps={[
    {
      name: "--filters-button-cancel-background-color",
      type: "color",
      description: "Background color of the cancel button.",
      default: "transparent"
    },
    {
      name: "--filters-button-cancel-color",
      type: "color",
      description: "Text color of the cancel button.",
      default: "rgb(var(--global-color-primary-400))"
    },
    {
      name: "--filters-wrapper-width",
      type: "size",
      description: "Width of the filter wrapper container.",
      default: "auto"
    }
  ]}
/>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: "customSnippet",
      description: "Renders a custom field for 'custom' filter types",
      properties: [
        { name: "filter", type: "Filter | undefined", description: "Current filter being edited" }
      ]
    },
    {
      name: "filterActionsSnippet",
      description: "Custom rendering for action buttons or footer",
      properties: [
        { name: "applyFilterDisabled", type: "boolean", description: "Whether the apply button should be disabled" },
        { name: "filter", type: "Filter | undefined", description: "Current filter being edited" }
      ]
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: "onchange",
      description: "Triggered when filter values change",
      properties: [
        { name: "filter", type: "Filter | undefined", description: "The updated filter" }
      ]
    },
    {
      name: "onclick",
      description: "Triggered on click on the container"
    },
    {
      name: "onkeypress",
      description: "Triggered on key press within the filter editor"
    }
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
