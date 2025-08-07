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
    appendSnippet,
  }: Props = $props();

  let tabButtons: Record<string, HTMLElement> = $state({});
  onMount(() => {
    if (mandatory && !selected && tabs.length > 0) selected = tabs[0].name;
  });

  function handleTabClick(clickedTab: Tab, nativeEvent: MouseEvent) {
    selected = clickedTab.name;
    if(ontabClick) {
      ontabClick({
        detail: {
          nativeEvent,
          tab: clickedTab
        }
      })
    }
  }
</script>

<div
  class="{clazz.container || ''} tabs-container"
>
  {#each tabs as tab}
    <button
      class:selected-tab={tab.name == selected}
      class="tab-label {clazz.tabs || ''} {tab.name == selected ? clazz.selected || '' : ''}"
      onclick={(event) => handleTabClick(tab, event)}
      bind:this={tabButtons[tab.name]}
    >
      {#if !!tab.icon}
        <Icon name={tab.icon}></Icon>
      {/if}
      {tab.label}
    </button>
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

  button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;
    outline: none;  
  }

  button:focus {
    outline: none;
  }

  .selected-tab {
    color: var(
      --tab-switcher-selected-color,
      var(--tab-switcher-default-selected-color)
    );
  }

  .selected-tab::after {
    content: '';
    position: absolute;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: 2px;
    background-color: var(
      --tab-switcher-bookmark-color,
      var(--tab-switcher-default-bookmark-color)
    );
  }

  .horizontal-guide {
    position: absolute;
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
    position: relative;
  }
</style>
