<script context="module" lang="ts">
  export type Item = {
    value: string | number;
    label?: string | number;
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    data?: any;
  };
</script>

<script lang="ts">
  import '../../../css/main.css'

  export let values: Item[] = [],
    items: Item[],
    multiple = true,
    disabled = false

  let dispatch = createEventDispatcher<{
    change: {
      unselect: Item | undefined;
      select: Item | undefined;
      selection: Item[];
    }
  }>();


  function select(item: Item) {
    const alreadyPresent =
      values.findIndex((i) => i.value === item.value) != -1;

    if (!alreadyPresent) {
      if (multiple) values = [...values, item];
      else values = [item];

      dispatch("change", {
        unselect: undefined,
        select: item,
        selection: values,
      });
    }
  }

  function unselect(item: Item) {
    values = values.filter((i) => i.value != item.value);

    dispatch("change", {
      unselect: item,
      select: undefined,
      selection: values,
    });
  }

  function toggle(item: Item) {
    const alreadyPresent =
      values.findIndex((i) => i.value === item.value) != -1;

    if (alreadyPresent) unselect(item);
    else select(item);
  }

  import Chip from "$lib/components/simple/navigation/Chip.svelte";
  import { createEventDispatcher } from "svelte";
</script>

<svelte:window />

<div
  class="toggle-container"
  class:disabled
>
    <div
      class="selection-container"
    >
      {#each (items || []) as item}
        <div class="chip">
          <Chip
            outlined={values.findIndex(i => i.value === item.value) === -1}
            on:click={() => toggle(item)}
            buttonTabIndex={0}
            truncateText
            --button-focus-color="red"
          >
            {item.label}
          </Chip>
        </div>
      {/each}
    </div>
</div>


<style>
  .selection-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    transition: all .1s;
  }

  .toggle-container {
    opacity: 100%;
    width: var(--toggle-list-width, auto);
    max-width: var(--toggle-list-max-width, auto);
    height: var(--toggle-list-heigth, auto);
  }

  .toggle-container.disabled {
    opacity: 50%;
  }

  .chip {
    --chip-default-outlined-color: var(--toggle-list-unselected-color, var(--chip-default-background-color));
  }


</style>
