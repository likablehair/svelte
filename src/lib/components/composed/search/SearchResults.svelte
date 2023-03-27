<script lang="ts" context="module">
  export type Result = {
    title: string
    name: string | number,
    subtitle?: string
    url?: string,
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    data?: Record<string, any>
  };
</script>

<script lang="ts">
  import SelectableVerticalList from "$lib/components/simple/lists/SelectableVerticalList.svelte";


  export let maxWidth: string | undefined = undefined,
    width: string = "100%",
    height: string | undefined = undefined,
    maxHeight: string | undefined = undefined,
    margin: string | undefined = undefined,
    backgroundColor: string = "rgb(255 255 255/1)",
    noDataText: string = "Sorry, nothing found",
    loadingText: string = "Searching for references ...",
    borderColor: string = "rgb(228 228 231/1)",
    borderRadius: string | undefined = undefined,
    results: Result[] | undefined = [],
    loading: boolean = false,
    footer: boolean = true,
    activeKeyboard: boolean = false
</script>

<div 
  style:--search-results-width={width}
  style:--search-results-max-width={maxWidth}
  style:--search-results-height={height}
  style:--search-results-max-height={maxHeight}
  style:--search-results-margin={margin}
  style:--search-results-background-color={backgroundColor}
  style:--search-results-border-color={borderColor}
  style:--search-results-border-radius={borderRadius}
  class="container"
>
  {#if loading}
    <div class="loading-container">
      <slot name="loading">
        <span style:font-size=".875rem">{loadingText}</span>
      </slot>
    </div>
  {:else if !results || results.length == 0}
    <div
      class="no-data-container"
    >
      <slot name="no-data">
        <span style:font-size=".875rem">{noDataText}</span>
      </slot>
    </div>
  {:else}
    <div>
      <SelectableVerticalList
        elements={results.map((r) => {
          return {
            title: r.title,
            description: r.subtitle,
            name: r.name,
            data: r.data
          }
        })}
        activeKeyboard={activeKeyboard}
        on:focus
        on:select
      >
        <div 
          slot="description" 
          let:element
          style:margin-top=".5rem"
          style:opacity="60%"
        >
          {element.description}
        </div>
      </SelectableVerticalList>
    </div>
  {/if}
  {#if footer}  
    <div class="footer">
      <slot name="footer">
        <span
          style:font-size=".875rem"
        >
          <span 
            style:opacity=".5"
          >Search with</span> ❤️
        </span>
      </slot>
    </div>
  {/if}
</div>

<style>
  .container {
    width: var(--search-results-width);
    max-width: var(--search-results-max-width);
    height: var(--search-results-height);
    max-height: var(--search-results-max-height);
    background-color: var(--search-results-background-color);
    margin: var(--search-results-margin);
    border-top: 1px solid var(--search-results-border-color);
    border-radius: var(--search-results-border-radius);
  }

  .no-data-container, .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .footer {
    border-top: 1px solid var(--search-results-border-color);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 1rem;
    height: 2rem;
  }
</style>