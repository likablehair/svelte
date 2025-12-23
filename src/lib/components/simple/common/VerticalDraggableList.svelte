<script lang="ts" generics="Item extends { id: string, name: string }">
  import '../../../css/main.css'
  import './VerticalDraggableList.css'
  import { flip } from "svelte/animate";
  import { dndzone, type DndEvent } from "svelte-dnd-action";
	import { type Snippet } from "svelte"
  import { Icon } from "$lib";

  interface Props {
    items?: Item[];
    disableFirstItem?: boolean;
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
    disableFirstItem,
    itemSnippet,
    onchangeOrder,
  }: Props = $props();

  const flipDurationMs = 300;

  let firstItem = $derived.by(() => disableFirstItem ? items[0] : undefined),
    internalItems = $derived.by(() => disableFirstItem ? items.slice(1) : items);

  function handleDndConsider(e: CustomEvent<DndEvent<Item>>) {
    items = [
      ...(firstItem ? [firstItem] : []),
      ...e.detail.items
    ]
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<Item>>) {
		items = [
      ...(firstItem ? [firstItem] : []),
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

{#if firstItem}
  <div class="item-container cursor-not-allowed {clazz}">
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
        {@render itemSnippet({ item: firstItem, index: 0 })}
      {:else}
        {firstItem.name}
      {/if}
    </div>
  </div>
{/if}

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
            {@render itemSnippet({ item, index: disableFirstItem ? index + 1 : index })}
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
</style>