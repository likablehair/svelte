<script lang="ts" context="module">
  export type Tab = {
    name: string,
    label: string,
    icon?: string
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte'

  export let tabs: Tab[]  = [],
    selected: string = undefined,
    mandatory: boolean = true,
    width: string = undefined,
    color: string = "rgb(51 65 85)",
    bookmarkColor: string = undefined;

  let tabButtons: object = {}
  onMount(() => {
    if(mandatory && !selected && tabs.length > 0) selected = tabs[0].name

    if(!!selected) {
      setBookmarkPosition()
    }
  })

  let bookmarkWidth: number = 0, bookmarkLeft: number = 0
  function handleTabClick(clickedTab: Tab) {
    selected = clickedTab.name

    setBookmarkPosition()
  }

  function setBookmarkPosition() {
    let tabButton: HTMLElement = tabButtons[selected]
    bookmarkWidth = tabButton.offsetWidth - 10
    bookmarkLeft = tabButton.offsetLeft + 5
  }
</script>

<div 
  style:position="relative"
  style:display="flex"
  style:flex-wrap="nowrap"
  style:overflow="auto"
  style:width={width}
>
  {#each tabs as tab}
    <div 
      style:word-break="keep-all"
      style:white-spaces="nowrap"
      style:-webkit-tap-highlight-color="rgba(0,0,0,0)"
      style:cursor="pointer"
      style:margin-left="12px"
      style:margin-right="12px"
      style:padding="8px"
      style:--tab-switcher-color={color}
      class:selected-tab={tab.name == selected}
      on:click={() => handleTabClick(tab)}
      bind:this={tabButtons[tab.name]}
    >
      {tab.label}
    </div>
  {/each}
  <span
    style:left={bookmarkLeft + 'px'}
    style:width={bookmarkWidth + 'px'}
    style:--tab-switcher-bookmark-color={bookmarkColor || color}
    class="bookmark"
  ></span>
  <span 
    style:width={width}
    class="horizontal-guide"
  ></span>
</div>

<style>
  .selected-tab {
    color: var(--tab-switcher-color, rgb(51 65 85));
  }
  
  .horizontal-guide {
    position: absolute;
    z-index: 5;
    bottom: 0px;
    height: 1px;
    background-color: var(--tab-switcher-color, rgb(51 65 85));
    opacity: 20%;
  }

  .bookmark {
    position: absolute;
    bottom: 0px;
    height: 2px;
    border-radius: 0.125rem;
    z-index: 10;
    background-color: var(--tab-switcher-bookmark-color, var(--tab-switcher-color, rgb(51 65 85)));
    transition: left 400ms, width 400ms;
  }

</style>