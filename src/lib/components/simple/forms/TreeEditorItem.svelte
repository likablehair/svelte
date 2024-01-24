<script lang="ts">
  import Sortable from 'sortablejs';
  import { onMount, type ComponentProps } from "svelte";
  import type TreeEditor from './TreeEditor.svelte';
  import Icon from '../media/Icon.svelte';
  import Button from '../buttons/Button.svelte';
  import { slide } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import type { Item } from './TreeEditor.svelte';

  let dispatch = createEventDispatcher<{
    'change': {
      ev: Sortable.SortableEvent
    },
    'end': {
      ev: Sortable.SortableEvent
    }
  }>()

  export let title: string,
    id: number | string,
    subtitle: string | undefined = undefined,
    group: string,
    animationDuration: number = 150,
    expanded: boolean | undefined = true,
    subItems: Item[] = [],
    sortable: Sortable | undefined = undefined

  let subItemList: HTMLElement,
    mounted: boolean = false

  onMount(() => {
    mounted = true
    initSortable()
  })

  function initSortable() {
    if(!mounted) return

    sortable = Sortable.create(subItemList, {
      group: group,
      handle: '.handle',
      animation: animationDuration,
      ghostClass: 'ghost-drag-element',
      onEnd(ev) {
        dispatch('end', { ev })
      },
      onChange(ev) {
        dispatch('change', { ev })
      },
      onUpdate(ev) {
      }
    })
  }

  $: if(!!subItems) initSortable()
</script>

<li 
  class="tree-editor-item-container" 
  data-sortable-title={title}
  data-sortable-id={id}
>
  <div class="card-container">
    <div class="handle">
      <Icon
        name="mdi-dots-grid"
      ></Icon>
    </div>
    <div class="button-container" class:reversed={expanded}>
      <Button
        buttonType="text"
        on:click={() => expanded = !expanded}
      >
        <Icon
          name="mdi-chevron-down"
        ></Icon>
      </Button>
    </div>
    {title}
  </div>
  <ul 
    class="list-container" 
    bind:this={subItemList}
  >
    {#if expanded && !!subItems}
      {#each subItems as subItem}
        <svelte:self
          id={subItem.id}
          title={subItem.title}
          group={group}
          animationDuration={animationDuration}
          bind:subItems={subItem.children}
          bind:sortable={subItem.sortable}
        ></svelte:self>
      {/each}
    {/if}
  </ul>
</li>

<style>
  ul {
    min-height: 10px;
    list-style: none;
  }

  .card-container {
    width: 100%;
    display: flex;
    align-items: center;
    font-size: 1.2rem;
    font-weight: 700;
    border-radius: 12px;
    min-height: 20px;
    padding: 16px;
    box-shadow: rgb(var(--global-color-contrast-200), .3) 0px 4px 6px;;
  }

  :global(.ghost-drag-element > .card-container) {
    background-color: rgb(var(--global-color-primary-500), .3);
    opacity: 30%;
  }

  :global(.ghost-drag-element > .list-container) {
    opacity: 30%;
  }

  .handle {
    margin-right: 8px;
    cursor: grab;
    transition: all .3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .button-container {
    margin-right: 12px;
    transition: all .3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .button-container.reversed {
    transform: rotate(-90deg);
  }
</style>