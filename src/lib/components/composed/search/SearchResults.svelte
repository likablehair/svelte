<script lang="ts" module>
  export type Result<Data = Record<string, any>> = {
    title: string
    name: string | number,
    subtitle?: string
    url?: string,
    data?: Data
  };
</script>

<script lang="ts" generics="Data">
  import '../../../css/main.css'
  import './SearchResults.css'
  import SelectableVerticalList from "$lib/components/simple/lists/SelectableVerticalList.svelte";
  import type { ComponentProps, Snippet } from 'svelte';

  interface Props {
    noDataText?: string;
    loadingText?: string;
    results?: Result<Data>[];
    loading?: boolean;
    footer?: boolean;
    activeKeyboard?: boolean;
    class?: {
      container?: string,
      loading?: string,
      noData?: string,
      results?: string
    }
    loadingSnippet?: Snippet<[]>
    noDataSnippet?: Snippet<[]>
    footerSnippet?: Snippet<[]>
    onfocus?: ComponentProps<typeof SelectableVerticalList<Data>>['onfocus']
    onselect?: ComponentProps<typeof SelectableVerticalList<Data>>['onselect']
  }

  let {
    noDataText = "Sorry, nothing found",
    loadingText = "Searching for references ...",
    results = $bindable([]),
    loading = false,
    footer = true,
    activeKeyboard = false,
    class: clazz = {},
    footerSnippet,
    loadingSnippet,
    noDataSnippet,
    onfocus,
    onselect,
  }: Props = $props();
</script>

<div 
  class="container {clazz.container || ''}"
>
  {#if loading}
    <div class="loading-container {clazz.loading || ''}">
      {#if loadingSnippet}
        {@render loadingSnippet()}
      {:else}
        <span style:font-size=".875rem">{loadingText}</span>
      {/if}
    </div>
  {:else if !results || results.length == 0}
    <div
      class="no-data-container {clazz.noData || ''}"
    >
      {#if noDataSnippet}
        {@render noDataSnippet()}
      {:else}
        <span style:font-size=".875rem">{noDataText}</span>
      {/if}
    </div>
  {:else}
    <div class={clazz.results || ''}>
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
        {onfocus}
        {onselect}
      >
        {#snippet descriptionSnippet({ element })}
          <div
            style:margin-top=".5rem"
            style:opacity="60%"
          >
            {element.description} 
          </div>
        {/snippet}
      </SelectableVerticalList>
    </div>
  {/if}
  {#if footer}  
    <div class="footer">
      {#if footerSnippet}
        {@render footerSnippet()}
      {:else}
        <span
          style:font-size=".875rem"
        >
          <span 
            style:opacity=".5"
          >Search with</span> ❤️
        </span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .container {
    width: var(
      --search-results-width,
      var(--search-results-default-width)
    );
    max-width: var(
      --search-results-max-width,
      var(--search-results-default-max-width)
    );
    height: var(
      --search-results-height,
      var(--search-results-default-height)
    );
    max-height: var(
      --search-results-max-height,
      var(--search-results-default-max-height)
    );
    background-color: var(
      --search-results-background-color,
      var(--search-results-default-background-color)
    );
    margin: var(
      --search-results-margin,
      var(--search-results-default-margin)
    );
    border-top: 1px solid var(
      --search-results-border-color,
      var(--search-results-default-border-color)
    );
    border-radius: var(
      --search-results-border-radius,
      var(--search-results-default-border-radius)
    );
  }

  .no-data-container, .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .footer {
    border-top: 1px solid var(
      --search-results-border-color,
      var(--search-results-default-border-color)
    );
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 1rem;
    height: 2rem;
  }
</style>