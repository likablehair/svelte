<script lang="ts">
  import Dialog from '$lib/components/simple/dialogs/Dialog.svelte'
  import { createEventDispatcher, onMount } from 'svelte';
  import SearchBar from './SearchBar.svelte';
  import Keyboarder, { type CallbackFunction } from '$lib/utils/keyboarder';
  import SearchResults, { type Result } from './SearchResults.svelte';

  export let color: string = "rgb(113 113 122)",
    searchButtonRingColor: string = "rgba(24,24,27,.1)",
    searchButtonHoverRingColor: string = "rgba(24,24,27,.2)",
    searchButtonWidth: string = "100%",
    searchButtonMaxWidth: string = "28rem",
    searchButtonHeight: string = "2rem",
    searchButtonBackgroundColor: string = "white",
    searchButtonPadding: string = "0rem 0.75rem 0rem 0.5rem",
    searchButtonFontSize: string = ".875rem",
    searchButtonText: string = "Search",
    searchDialogOpened: boolean = false,
    transitionDuration: string = ".8s",
    searcher: (params: { searchText: string }) => Promise<Result[] | undefined> = () => Promise.resolve([])

    let searchBarInput: HTMLElement,
      searchText: string | undefined = undefined,
      searchResults: Result[] | undefined = undefined,
      searchLoading: boolean = false

    let dispatch = createEventDispatcher<{
      'toggle-search-dialog': {
        opened: boolean
      }
    }>()

    onMount(() => {
      let handler: CallbackFunction = (params) => {
        if((params.meta || params.ctrl) && params.key == 'k') {
          toggleSearchDialog()
        }
      }

      Keyboarder.on(handler)

      return () => {
        Keyboarder.off(handler)
      }
    })

    function handleKeydown(event: KeyboardEvent) {
      if(event.key == 'ArrowDown' || event.key == 'ArrowUp') event.preventDefault()
    }

    function toggleSearchDialog()  {
      searchDialogOpened = !searchDialogOpened
      if(searchDialogOpened) searchBarInput.focus()
      dispatch('toggle-search-dialog', { opened: searchDialogOpened })
    }

    async function search() {
      if(!!searchText) {
        searchLoading = true
        searchResults = await searcher({
          searchText
        })
        searchLoading = false
      }
    }
</script>

<div
  style:--global-search-text-field-ring-color={searchButtonRingColor}
  style:--global-search-text-field-hover-ring-color={searchButtonHoverRingColor}
  style:--global-search-text-field-color={color}
  style:--global-search-text-field-width={searchButtonWidth}
  style:--global-search-text-field-max-width={searchButtonMaxWidth}
  style:--global-search-text-field-height={searchButtonHeight}
  style:--global-search-text-field-background-color={searchButtonBackgroundColor}
  style:--global-search-text-field-padding={searchButtonPadding}
  style:--global-search-text-field-font-size={searchButtonFontSize}
>
  <slot 
    name="search-button"
    {toggleSearchDialog}
  >
    <button 
      on:click={toggleSearchDialog}
      class="search-like-button"
    >
      <slot name="search-button-icon">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          class="search-icon"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
          /></svg
        >
      </slot>
      <slot name="search-button-text">
        {searchButtonText}
      </slot>
      <slot name="search-button-shortcut">
        <kbd class="shortcut"><kbd class="shortcut">⌘</kbd><kbd class="shortcut">K</kbd></kbd>
      </slot>
    </button>
  </slot>
  <Dialog
    bind:open={searchDialogOpened}
    transition="scale"
    overlayBackdropFilter="blur(2px)"
    transitionDuration={transitionDuration}
  >
    <div
      style:max-width="90vw"
      style:width="600px"
      style:height="500px"
      style:display="flex"
      style:justify-content="center"
      on:click={() => searchDialogOpened = false}
      on:keypress={() => searchDialogOpened = false}
    >
      <div
        on:click|stopPropagation={() => { }}
        on:keypress|stopPropagation={() => { }}
        style:width="100%"
        style:height="fit-content"
      >
        <slot 
          name="search-bar"
          searchBarInput
          searchText
          search
        >
          <SearchBar
            bind:input={searchBarInput}
            bind:value={searchText}
            on:input={search}
            on:keydown={handleKeydown}
          ></SearchBar>
        </slot>
        {#if !!searchText}
          <slot 
            name="search-results"
            searchLoading
            searchResults
          >
            <SearchResults
              margin="-.5rem 0 0 0"
              borderRadius="0 0 .5rem .5rem"
              loading={searchLoading}
              results={searchResults}
              activeKeyboard
              on:select
            ></SearchResults>
          </slot>
        {/if}
      </div>
    </div>
  </Dialog>
</div>

<style>
  .search-like-button {
    --global-search-text-field-ring-real-color: var(--global-search-text-field-ring-color);
    box-shadow: inset 0 0 0 1px var(--global-search-text-field-ring-color);
    color: var(--global-search-text-field-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: var(--global-search-text-field-width);
    max-width: var(--global-search-text-field-max-width);
    height: var(--global-search-text-field-height);
    font-size: var(--global-search-text-field-font-size);
    line-height: 1.5rem;
    background-color: var(--global-search-text-field-background-color);
    border-radius: 9999px;
    padding: var(--global-search-text-field-padding);
    border: 0 solid #e5e7eb;
    cursor: pointer;
    transition-property: box-shadow;
    transition-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1);
    transition-duration: .5s;
  }

  .search-like-button:hover {
    box-shadow: inset 0 0 0 1px var(--global-search-text-field-hover-ring-color);
  }

  .search-icon {
    height: 1.25rem;
    width: 1.25rem;
    stroke: currentColor;
  }

  .shortcut {
    margin-left: auto;
    font-size: 1rem;
    color: var(--global-search-text-field-color);
    text-transform: none;
    font-family: ui-sans-serif,system-ui,-apple-system;
  }
</style>
