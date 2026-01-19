<script lang="ts" generics="Item extends { id: string, name: string, pinned?: boolean }">
  import '../../../css/main.css'
  import './VerticalDraggableList.css'
  import { flip } from "svelte/animate";
  import { dndzone, type DndEvent } from "svelte-dnd-action";
	import { type Snippet } from "svelte"
  import { Icon } from "$lib";

  interface Props {
    items?: Item[];
    class?: string;
    itemSnippet?: Snippet<[{
      item: typeof items[number],
      index: number
    }]>
    onchangeOrder?: (event: {
      detail: {
        items: typeof items
      }
    }) => void
  }

  let { 
    items = [],
    class: clazz = '',
    itemSnippet,
    onchangeOrder,
  }: Props = $props();

  const flipDurationMs = 300;

  let pinnedItems = $derived.by(() => items.filter(item => item.pinned)),
    internalItems = $derived.by(() => items.filter(item => !item.pinned));

  function handleDndConsider(e: CustomEvent<DndEvent<Item>>) {
    items = [
      ...pinnedItems,
      ...e.detail.items
    ]
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<Item>>) {
		items = [
      ...pinnedItems,
      ...e.detail.items
    ]
    if(onchangeOrder){
      onchangeOrder({
        detail: {
          items
        }
      })
    }
	}
</script>

{#each pinnedItems as item, index (item.id)}
  <div 
    class="item-container pinned cursor-not-allowed {clazz}"
    class:pinned-top={index === 0}
    class:pinned-bottom={index === pinnedItems.length - 1}
  >
    <div
      style:grid-cols=1
    >
      <Icon
        name="mdi-drag" 
      />
    </div>
    <div
      style:grid-cols=2
    >
      {#if itemSnippet}
        {@render itemSnippet({ item, index })}
      {:else}
        {item.name}
      {/if}
    </div>
  </div>
{/each}

<section 
  use:dndzone={{items: internalItems, flipDurationMs, dropTargetStyle: {border: '0px dashed #000'}}}
  onconsider={handleDndConsider} 
  onfinalize={handleDndFinalize}
>
	{#each internalItems as item, index (item.id)}
		<div
      animate:flip="{{duration: flipDurationMs}}"
    > 
      <div class="item-container {clazz}">
        <div
          style:grid-cols=1
        >
          <Icon
            name="mdi-drag" 
          />
        </div>
        <div
          style:grid-cols=2
        >
          {#if itemSnippet}
            {@render itemSnippet({ item, index: pinnedItems.length + index })}
          {:else}
            {item.name}
          {/if}
        </div>
      </div>
		</div>
	{/each}
</section>

<style>
  .item-container {
    display: grid;
    gap: 12px;
    padding: var(
      --vertical-draggable-list-item-padding,
      var(--vertical-draggable-list-default-item-padding)
    );
    cursor: move;
    grid-template-columns: 10px auto;
  }

  .cursor-not-allowed {
    cursor: not-allowed;
  }

  .pinned {
    background-color: var(
      --vertical-draggable-list-pinned-items-background-color,
      var(--vertical-draggable-list-default-pinned-items-background-color)
    );
    border-radius: 0; 
  }

  .pinned-top {
    border-top-left-radius: var(
      --vertical-draggable-list-pinned-items-border-radius,
      var(--vertical-draggable-list-default-pinned-items-border-radius)
    );
    border-top-right-radius: var(
      --vertical-draggable-list-pinned-items-border-radius,
      var(--vertical-draggable-list-default-pinned-items-border-radius)
    );
  }

  .pinned-bottom {
    border-bottom-left-radius: var(
      --vertical-draggable-list-pinned-items-border-radius,
      var(--vertical-draggable-list-default-pinned-items-border-radius)
    );
    border-bottom-right-radius: var(
      --vertical-draggable-list-pinned-items-border-radius,
      var(--vertical-draggable-list-default-pinned-items-border-radius)
    );
  }
</style>