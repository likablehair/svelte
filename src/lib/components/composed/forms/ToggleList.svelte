<script module lang="ts">
  export type Item<Data = any> = {
    value: string | number;
    label?: string | number;
    data?: Data;
  };
</script>

<script lang="ts" generics="Data">
  import '../../../css/main.css'
  import Chip from "$lib/components/simple/navigation/Chip.svelte";

  type ItemData = Item<Data>
  interface Props {
    values?: ItemData[];
    items: ItemData[];
    multiple?: boolean;
    disabled?: boolean;
    onchange?: (event: {
      detail: {
        unselect: ItemData | undefined;
        select: ItemData | undefined;
        selection: ItemData[];
      }
    }) => void
  }

  let {
    values = $bindable([]),
    items,
    multiple = true,
    disabled = false,
    onchange,
  }: Props = $props();

  function select(item: ItemData) {
    const alreadyPresent =
      values.findIndex((i) => i.value === item.value) != -1;

    if (!alreadyPresent) {
      if (multiple) values = [...values, item];
      else values = [item];

      if(onchange) {
        onchange({
          detail: {
            unselect: undefined,
            select: item,
            selection: values,
          }
        })
      }
    }
  }

  function unselect(item: ItemData) {
    values = values.filter((i) => i.value != item.value);

    if(onchange) {
      onchange({
        detail: {
          unselect: item,
          select: undefined,
          selection: values,
        }
      })
    }
  }

  function toggle(item: ItemData) {
    const alreadyPresent =
      values.findIndex((i) => i.value === item.value) != -1;

    if (alreadyPresent) unselect(item);
    else select(item);
  }
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
            onclick={() => toggle(item)}
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
