<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import GlobalSearchTextField from "$lib/components/composed/search/GlobalSearchTextField.svelte";
</script>

<h1>GlobalSearchTextField</h1>
<ComponentSubtitle>TextField global friendly.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <GlobalSearchTextField></GlobalSearchTextField>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "searchButtonText", type: "string", description: "Text displayed on the search button", default: "Search" },
    { name: "searchDialogOpened", type: "boolean", description: "Controls if the search dialog is opened", default: "false" },
    { name: "transitionDuration", type: "string", description: "Duration of the transition for the dialog", default: ".8s" },
    { name: "class", type: "{ container?: string, button?: string, shortcut?: string }", description: "Optional custom class names for container, button, and shortcut elements" },
    { name: "searcher", type: "(params: { searchText: string }) => Promise<Result<Data>[] | undefined>", description: "Function to perform the search request", default: "() => Promise.resolve([])" },
  ]}
  styleProps={[
    { name: "global-search-text-field-ring-color", type: "color", description: "Ring color for the search text field", default: "rgb(var(--global-color-contrast-200), .5)" },
    { name: "global-search-text-field-hover-ring-color", type: "color", description: "Ring color on hover for the search text field", default: "rgb(var(--global-color-contrast-300))" },
    { name: "global-search-text-field-color", type: "color", description: "Text color inside the search text field", default: "rgb(var(--global-color-contrast-600))" },
    { name: "global-search-text-field-width", type: "size", description: "Width of the search text field", default: "100%" },
    { name: "global-search-text-field-max-width", type: "size", description: "Max width of the search text field", default: "28rem" },
    { name: "global-search-text-field-height", type: "size", description: "Height of the search text field", default: "2rem" },
    { name: "global-search-text-field-background-color", type: "color", description: "Background color of the search text field", default: "rgb(var(--global-color-background-100))" },
    { name: "global-search-text-field-padding", type: "size", description: "Padding inside the search text field", default: "0rem 0.75rem 0rem 0.5rem" },
    { name: "global-search-text-field-font-size", type: "size", description: "Font size for the search text field", default: ".875rem" },
    { name: "global-search-text-field-border-radius", type: "size", description: "Border radius for the search text field", default: "9999px" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "searchButtonSnippet", description: "Slot for rendering the search button", default: `
<button 
  onclick={toggleSearchDialog}
  class="search-like-button {clazz.button || ''}"
>
  {#if searchButtonIconSnippet}
    {@render searchButtonIconSnippet({ toggleSearchDialog })}
  {:else}
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      class="search-icon"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
      />
    </svg>
  {/if}
  {#if searchButtonTextSnippet}
    {@render searchButtonTextSnippet()}
  {:else}
    {searchButtonText}
  {/if}
  {#if searchButtonShortcutSnippet}
    {@render searchButtonShortcutSnippet()}
  {:else}
    <kbd class="shortcut {clazz.shortcut || ''}"><kbd class="shortcut">⌘</kbd><kbd class="shortcut">K</kbd></kbd>
  {/if}
</button>
    ` },
    { name: "searchButtonIconSnippet", description: "Slot for rendering the icon in the search button", default: `
<svg
  viewBox="0 0 20 20"
  fill="none"
  aria-hidden="true"
  class="search-icon"
  ><path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
  />
</svg>
    ` },
    { name: "searchButtonTextSnippet", description: "Slot for rendering custom text inside the search button", default: "{searchButtonText}" },
    { name: "searchButtonShortcutSnippet", description: "Slot for rendering custom shortcut inside the search button", default: '<kbd class="shortcut {clazz.shortcut || ""}"><kbd class="shortcut">⌘</kbd><kbd class="shortcut">K</kbd></kbd>' },
    { name: "searchBarSnippet", description: "Slot for rendering the search bar", default: `
<SearchBar
  bind:input={searchBarInput}
  bind:value={searchText}
  oninput={search}
  onkeydown={handleKeydown}
  onfocus={() => searchBarFocused = true}
  onblur={() => searchBarFocused = false}
></SearchBar>
    ` },
    { name: "searchResultsSnippet", description: "Slot for rendering the search results", default: `
<SearchResults
  --search-results-margin="-.5rem 0 0 0"
  --search-results-border-radius="0 0 .5rem .5rem"
  loading={searchLoading}
  results={searchResults}
  activeKeyboard={searchBarFocused}
  {onselect}
></SearchResults>
    ` },
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onselect", description: "Triggered when an element is selected.", properties: [{ name: "element", type: "Element", description: "The selected element." }] },
    { name: "ontoggleSearchDialog", description: "Triggered when the search dialog is toggled", properties: [{ name: "opened", type: "boolean", description: "Indicates if the search dialog is opened" }] },
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