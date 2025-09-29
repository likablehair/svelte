<script lang="ts">
  import '../../../css/main.css'
  import './VerticalDraggableList.css'
  import { flip } from "svelte/animate";
  import { dndzone, type DndEvent } from "svelte-dnd-action";
	import { type Snippet } from "svelte"
  import { Icon } from "$lib";

  interface Props {
    items?: {
      id: string;
      name: string;
      icon?: string;
    }[];
    class?: string;
    itemSnippet?: Snippet<[{
      item: typeof items[number]
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

  function handleDndConsider(e: CustomEvent<DndEvent<{
      id: string;
      name: string;
  }>>) {
    items = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<{
      id: string;
      name: string;
  }>>) {
		items = e.detail.items;
    if(onchangeOrder){
      onchangeOrder({
        detail: {
          items
        }
      })
    }
	}
</script>


<section 
  use:dndzone={{items, flipDurationMs, dropTargetStyle: {border: '0px dashed #000'}}}
  onconsider={handleDndConsider} 
  onfinalize={handleDndFinalize}
>
	{#each items as item(item.id)}
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
            {@render itemSnippet({ item })}
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
</style>