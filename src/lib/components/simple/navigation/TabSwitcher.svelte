<script lang="ts" context="module">
  export type Tab = {
    name: string;
    label: string;
    icon?: string;
  };
</script>

<script lang="ts">
  import { afterUpdate, onMount } from "svelte";
  import './TabSwitcher.css'

  let clazz: {
    container?: string,
    tabs?: string,
    selected?: string,
    bookmark?: string,
    guide?: string
  } = {};
	export { clazz as class };

  export let tabs: Tab[] = [],
    selected: string | undefined = undefined,
    mandatory = true

  let tabButtons: Record<string, HTMLElement> = {};
  onMount(() => {
    if (mandatory && !selected && tabs.length > 0) selected = tabs[0].name;

    if (selected) {
      setBookmarkPosition();
    }
  });

  afterUpdate(() => {
    setBookmarkPosition();
  });

  import { createEventDispatcher } from "svelte";
  import Icon from "../media/Icon.svelte";
  const dispatch = createEventDispatcher<{
    "tab-click": {
      nativeEvent: MouseEvent;
      tab: Tab;
    };
    "tab-keypress": {
      nativeEvent: KeyboardEvent;
      tab: Tab;
    };
  }>();

  let bookmarkWidth = 0,
    bookmarkLeft = 0;

  function handleTabClick(clickedTab: Tab, nativeEvent: MouseEvent) {
    selected = clickedTab.name;
    setBookmarkPosition();
    dispatch("tab-click", {
      nativeEvent: nativeEvent,
      tab: clickedTab,
    });
  }

  function handleTabKeypress(clickedTab: Tab, nativeEvent: KeyboardEvent) {
    selected = clickedTab.name;
    setBookmarkPosition();
    dispatch("tab-keypress", {
      nativeEvent: nativeEvent,
      tab: clickedTab,
    });
  }

  function setBookmarkPosition() {
    let tabButton: HTMLElement | undefined = selected
      ? tabButtons[selected]
      : undefined;

    if (tabButton) {
      bookmarkWidth = tabButton.offsetWidth - 10;
      bookmarkLeft = tabButton.offsetLeft + 5;
    }
  }
</script>

<div
  class="{clazz.container || ''} tabs-container"
>
  {#each tabs as tab}
    <div
      class:selected-tab={tab.name == selected}
      class="tab-label {clazz.tabs || ''} {tab.name == selected ? clazz.selected || '' : ''}"
      on:click={(event) => handleTabClick(tab, event)}
      on:keypress={(event) => handleTabKeypress(tab, event)}
      bind:this={tabButtons[tab.name]}
    >
      {#if !!tab.icon}
        <Icon name={tab.icon}></Icon>
      {/if}
      {tab.label}
    </div>
  {/each}
  {#if $$slots.append}
    <div
      style:flex-grow="1"
      style:display="flex"
      style:justify-content="flex-end"
    >
      <slot name="append" />
    </div>
  {/if}
  <span
    style:left={bookmarkLeft + "px"}
    style:width={bookmarkWidth + "px"}
    class="{clazz.bookmark || ''} bookmark"
  />
  <span
    class="{clazz.guide || ''} horizontal-guide"
  />
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
