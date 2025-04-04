<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import SearchResults from "$lib/components/composed/search/SearchResults.svelte";
</script>

<h1>SearchResults</h1>
<ComponentSubtitle>The answers to all your questions.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <SearchResults
    results={[
      {
        title: "JavaScript Documentation",
        name: "js-docs",
        subtitle: "The official documentation for JavaScript",
        data: { author: "Mozilla", year: 2025 }
      },
      {
        title: "Svelte Tutorial",
        name: "svelte-tutorial",
        subtitle: "Learn how to build apps with Svelte",
        data: { difficulty: "Beginner", language: "English" }
      },
      {
        title: "TypeScript Handbook",
        name: "ts-handbook",
        subtitle: "Comprehensive guide to TypeScript",
        data: { version: "4.5", author: "Microsoft" }
      },
      {
        title: "React Docs",
        name: "react-docs",
        subtitle: "Official React documentation",
        data: { language: "English", community: "Large" }
      },
      {
        title: "Vue.js Guide",
        name: "vue-guide",
        subtitle: "Vue.js official guide for building applications",
        data: { version: "3.2", community: "Active" }
      }
    ]}
  ></SearchResults>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "noDataText", type: "string", description: "Text displayed when no data is found.", default: "\"Sorry, nothing found\"" },
    { name: "loadingText", type: "string", description: "Text displayed when loading.", default: "\"Searching for references ...\"" },
    { name: "results", type: "Result<Data>[]", description: "Array of results to display.", default: "[]" },
    { name: "loading", type: "boolean", description: "Controls the loading state.", default: "false" },
    { name: "footer", type: "boolean", description: "Controls the visibility of the footer.", default: "true" },
    { name: "activeKeyboard", type: "boolean", description: "Enables keyboard navigation.", default: "false" },
    { name: "class", type: "{ container?: string, loading?: string, noData?: string, results?: string }", description: "Custom CSS classes for styling.", default: "{}" },
  ]}
  styleProps={[
    { name: "search-results-width", type: "size", description: "Width of the search results container", default: "100%" },
    { name: "search-results-max-width", type: "size", description: "Maximum width of the search results container" },
    { name: "search-results-height", type: "size", description: "Height of the search results container" },
    { name: "search-results-max-height", type: "size", description: "Maximum height of the search results container" },
    { name: "search-results-background-color", type: "color", description: "Background color of the search results container", default: "rgb(var(--global-color-background-100))" },
    { name: "search-results-margin", type: "size", description: "Margin around the search results container" },
    { name: "search-results-border-color", type: "color", description: "Border color of the search results container", default: "rgb(var(--global-color-background-300))" },
    { name: "search-results-border-radius", type: "size", description: "Border radius of the search results container" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: "footerSnippet",
      description: "Slot for custom content to be placed in the footer.",
      default: `
<span
  style:font-size=".875rem"
>
  <span 
    style:opacity=".5"
  >Search with</span> ❤️
</span>
      `,
    },
    {
      name: "loadingSnippet",
      description: "Slot for custom content to be shown during the loading state.",
      default: `
<span style:font-size=".875rem">{loadingText}</span>
      `,
    },
    {
      name: "noDataSnippet",
      description: "Slot for custom content to be shown when no data is available.",
      default: "<span style:font-size='.875rem'>{noDataText}</span>",
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onselect", description: "Triggered when an element is selected.", properties: [{ name: "element", type: "Element", description: "The selected element." }] },
    { name: "onfocus", description: "Triggered when an element gains focus.", properties: [{ name: "element", type: "Element", description: "The focused element." }] },
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin-bottom: 20px;
  }
</style>