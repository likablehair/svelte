<script lang="ts">
  import { flip } from "svelte/animate";
  import { dndzone, type DndEvent } from "svelte-dnd-action";
	import { type Snippet } from "svelte"
  import { Icon } from "$lib";

  interface Props {
    items?: {
      id: string;
      name: string;
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
      style="margin-bottom: 12px;"
    > 
      <div
        class="item-container {clazz}"
      >
        <Icon
          name="mdi-drag" 
        />
        {#if itemSnippet}
          {@render itemSnippet({ item })}
        {:else}
          {item.name}	
        {/if}
      </div>
		</div>
	{/each}
</section>

<style>
  .item-container {
    display: grid;
    gap: 12px;
    padding: 8px;
    cursor: move;
    grid-template-columns: 10px auto;
  }
</style>