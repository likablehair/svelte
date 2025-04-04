<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import SearchBar from "$lib/components/composed/search/SearchBar.svelte";
</script>

<h1>SearchBar</h1>
<ComponentSubtitle>The question to all your answers.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <SearchBar></SearchBar>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "input", type: "HTMLElement", description: "The input element" },
    { name: "value", type: "string", description: "The current value of the input" },
    { name: "placeholder", type: "string", description: "The placeholder text for the input" },
    { name: "class", type: "{ container?: string, icon?: string, input?: string }", description: "Optional custom class names for the container, icon, and input elements" },
  ]}
  styleProps={[
    { name: "--search-bar-ring-color", type: "color", description: "The ring color of the search bar", default: "rgb(var(--global-color-contrast-100))" },
    { name: "--search-bar-background-color", type: "color", description: "The background color of the search bar", default: "rgb(var(--global-color-background-100))" },
    { name: "--search-bar-border-radius", type: "size", description: "The border radius of the search bar", default: "0.5rem" },
    { name: "--search-bar-height", type: "size", description: "The height of the search bar", default: "3rem" },
    { name: "--search-bar-padding", type: "size", description: "The padding inside the search bar", default: "0rem 1rem 0rem 1rem" },
    { name: "--search-bar-line-height", type: "size", description: "The line height of the text inside the search bar", default: "1.5rem" },
    { name: "--search-bar-font-size", type: "size", description: "The font size of the text inside the search bar", default: ".875rem" },
    { name: "--search-bar-max-width", type: "size", description: "The maximum width of the search bar" },
    { name: "--search-bar-width", type: "size", description: "The width of the search bar", default: "100%" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "iconSnippet", description: "The slot for rendering an icon inside the search bar", default: `
<svg
  viewBox="0 0 20 20"
  fill="none"
  aria-hidden="true"
  class="search-icon {clazz.icon}"
>
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
  />
</svg>
    ` },
    { name: "inputSnippet", description: "The slot for rendering custom content inside the input field", default: `
<input
  aria-autocomplete="both"
  aria-labelledby="search-content"
  id="search-content"
  autocomplete="off"
  autocorrect="off"
  autocapitalize="off"
  enterkeyhint="search"
  spellcheck="false"
  placeholder={placeholder}
  maxlength="512"
  tabindex="0"
  bind:this={input}
  bind:value={value}
  {oninput}
  {onchange}
  {onkeydown}
  {onfocus}
  {onblur}
  class="input {clazz.input}"
/>
    ` }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "oninput", description: "Triggered when the input value changes" },
    { name: "onchange", description: "Triggered when the input value changes and the user commits the change" },
    { name: "onkeydown", description: "Triggered when a key is pressed down in the input" },
    { name: "onfocus", description: "Triggered when the input gains focus" },
    { name: "onblur", description: "Triggered when the input loses focus" }
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