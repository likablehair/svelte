<script lang="ts" module>
  export type Tab = {
    name: string;
    label: string;
    icon?: string;
  };
</script>

<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import './TabSwitcher.css'
  import { BROWSER } from 'esm-env';
  import Icon from "../media/Icon.svelte";

  interface Props {
    tabs?: Tab[];
    selected?: string;
    mandatory?: boolean;
    class?: {
      container?: string,
      tabs?: string,
      selected?: string,
      bookmark?: string,
      guide?: string
    }
    ontabClick?: (event: {
      detail: {
        nativeEvent: MouseEvent;
        tab: Tab;
      }
    }) => void
    ontabKeypress?: (event: {
      detail: {
        nativeEvent: KeyboardEvent;
        tab: Tab;
      }
    }) => void
    appendSnippet?: Snippet<[]>
  }

  let {
    tabs = [],
    selected = $bindable(undefined),
    mandatory = true,
    class: clazz = {},
    ontabClick,
    ontabKeypress,
    appendSnippet,
  }: Props = $props();

  let tabButtons: Record<string, HTMLElement> = {};
  onMount(() => {
    if (mandatory && !selected && tabs.length > 0) selected = tabs[0].name;

    if (selected) {
      setBookmarkPosition();
    }
  });

  $effect(() => {
    setBookmarkPosition();
  });

  let bookmarkWidth = $state(0),
    bookmarkLeft = $state(0);

  function handleTabClick(clickedTab: Tab, nativeEvent: MouseEvent) {
    selected = clickedTab.name;
    setBookmarkPosition();
    if(ontabClick) {
      ontabClick({
        detail: {
          nativeEvent,
          tab: clickedTab
        }
      })
    }
  }

  function handleTabKeypress(clickedTab: Tab, nativeEvent: KeyboardEvent) {
    selected = clickedTab.name;
    setBookmarkPosition();
    if(ontabKeypress) {
      ontabKeypress({
        detail: {
          nativeEvent,
          tab: clickedTab
        }
      })
    }
  }

  function setBookmarkPosition() {
    if(BROWSER) {
      let tabButton: HTMLElement | undefined = selected
        ? tabButtons[selected]
        : undefined;
  
      if (tabButton) {
        bookmarkWidth = tabButton.offsetWidth - 10;
        bookmarkLeft = tabButton.offsetLeft + 5;
      }
    }
  }

  $effect(() => { if(!!selected) setBookmarkPosition() }) 
</script>

<div
  class="{clazz.container || ''} tabs-container"
>
  {#each tabs as tab}
    <div
      role="presentation"
      class:selected-tab={tab.name == selected}
      class="tab-label {clazz.tabs || ''} {tab.name == selected ? clazz.selected || '' : ''}"
      onclick={(event) => handleTabClick(tab, event)}
      onkeypress={(event) => handleTabKeypress(tab, event)}
      bind:this={tabButtons[tab.name]}
    >
      {#if !!tab.icon}
        <Icon name={tab.icon}></Icon>
      {/if}
      {tab.label}
    </div>
  {/each}
  {#if appendSnippet}
    <div
      style:flex-grow="1"
      style:display="flex"
      style:justify-content="flex-end"
    >
      {@render appendSnippet()}
    </div>
  {/if}
  <span
    style:left={bookmarkLeft + "px"}
    style:width={bookmarkWidth + "px"}
    class="{clazz.bookmark || ''} bookmark"
  ></span>
  <span
    class="{clazz.guide || ''} horizontal-guide"
  ></span>
</div>

<style>
  .tabs-container {
    position: relative;
    display: flex;
    flex-wrap: nowrap;
    overflow: auto;
    gap: var(
      --tab-switcher-gap,
      var(--tab-switcher-default-gap)
    );
    width: var(
      --tab-switcher-width,
      var(--tab-switcher-default-width)
    );
  }

  .selected-tab {
    color: var(
      --tab-switcher-selected-color,
      var(--tab-switcher-default-selected-color)
    );
  }

  .horizontal-guide {
    position: absolute;
    z-index: 5;
    bottom: 0px;
    height: 1px;
    background-color: var(
      --tab-switcher-guide-color,
      var(--tab-switcher-default-guide-color)
    );
    opacity: 20%;
    width: var(
      --tab-switcher-width,
      var(--tab-switcher-default-width)
    );
  }

  .tab-label {
    word-break: keep-all;
    white-space: nowrap;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
    cursor: pointer;
    padding: 8px;
  }

  .bookmark {
    position: absolute;
    bottom: 0px;
    height: 2px;
    border-radius: 0.125rem;
    z-index: 10;
    background-color: var(
      --tab-switcher-bookmark-color,
      var(--tab-switcher-default-bookmark-color)
    );
    transition: left 400ms, width 400ms;
  }
</style>
