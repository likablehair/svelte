<script context="module" lang="ts">
  export type Item = {
    title: string,
    name: string,
    url?: string,
    detail?: object
  }
</script>

<script lang="ts">
  export let items: Item[] = [],
    color: string = undefined,
    vertical: boolean = false,
    space: string = '20px'

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{
    "item-click": {
      item: Item,
    }
  }>()

  function handleItemClick(item: Item) {
    dispatch('item-click', { item })
  }
</script>

<div 
  style:display="flex"
  style:flex-direction={vertical ? 'column' : 'row'}
>
  {#each items as item}
    <div 
      style:width="fit-content"
      style:margin-right={!vertical ? space : undefined}
      style:margin-bottom={vertical ? space : undefined}
      style:color={color}
      class="link bar-link"
      on:click={() => handleItemClick(item)}
    >
      {item.title}
    </div>
  {/each}
</div>

<style>
  .link {
    cursor: pointer;
    font-size: 18px;
    position: relative;
    white-space: nowrap;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
  }

  .link::before,
  .link::after {
    position: absolute;
    width: 100%;
    height: 1.5px;
    background: currentColor;
    top: 100%;
    left: 0;
    pointer-events: none;
  }

  .link::before {
    content: '';
  }

  .bar-link::before {
    transform-origin: 100% 50%;
    transform: scale3d(0, 1, 1);
    transition: transform 0.3s;
  }

  .bar-link:hover::before {
    transform-origin: 0% 50%;
    transform: scale3d(1, 1, 1);
  }
</style>
