<script lang="ts">
  import { flip } from "svelte/animate";
  import { dndzone } from "svelte-dnd-action";
	import { createEventDispatcher } from "svelte"
  import { Icon } from "$lib";

	type Item = { [key: string]: any }
  let clazz: string = '';
  export { clazz as class }

  export let items: {
    id: string;
    name: string;
  }[] = [];

  const flipDurationMs = 300;

  function handleDndConsider(e: Item) {
    items = e.detail.items;
  }

  function handleDndFinalize(e: Item) {
		items = e.detail.items;
    dispatch("changeOrder", { items });
	}

  let dispatch = createEventDispatcher<{
    changeOrder: {
      items: {
        id: string;
        name: string;
      }[];
    };
  }>();

</script>


<section 
  use:dndzone={{items, flipDurationMs, dropTargetStyle: {border: '0px dashed #000'}}}
  on:consider={handleDndConsider} 
  on:finalize={handleDndFinalize}
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
        <slot name="item" {item}>
          {item.name}	
        </slot>
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