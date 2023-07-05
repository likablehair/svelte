<script lang="ts" context="module">
  type Divider = {
    divider: true,
    marginTop?: string,
    marginBottom?: string,
    marginRight?: string
  }

  type Item = {
    name: string | number,
    label: string,
    icon: string,
    disabled?: boolean,
    divider?: undefined | false
  }

  export type MenuItem = Divider | Item;
</script>

<script lang="ts">
  import './SelectableMenuList.css'
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { createEventDispatcher } from 'svelte';

  let dispatch = createEventDispatcher<{
    'select': {
      item: Item
    }
  }>()

  export let collapsed: boolean = false,
    items: MenuItem[] = [],
    selected: string | number | undefined = undefined

  function handleItemClick(item: Item) {
    if(item.disabled) return

    selected = item.name
    dispatch('select', {
      item
    })
  }
</script>

<div
  class="menu-container"
  class:collapsed={collapsed}
>
  <ul>
    {#each items as item}
      {#if !item.divider }
        <li
          class="menu-row"
          aria-label={item.label}
          class:selected={!!selected && item.name === selected}
          class:disabled={item.disabled}
          on:click={() => { if(!item.divider) handleItemClick(item) }}
          on:keypress={() => { if(!item.divider) handleItemClick(item) }}
        >
          <div class="menu-icon">
            <Icon name={item.icon}></Icon>
          </div>
          <div class="menu-name">{item.label}</div>
        </li>
      {:else}
        <div
          style:margin-top={item.marginTop}
          style:margin-bottom={item.marginBottom}
          style:margin-right={item.marginRight}
          class="divider"
        ></div>
      {/if}
    {/each}
  </ul>
</div>

<style>
  ul {
    list-style: none;
    padding-left: 1rem;
    position: relative;
    line-height: 1rem;
    display: flex;
    flex-direction: column;
    gap: var(
      --selectable-menu-list-spacing,
      var(--selectable-menu-list-default-spacing)
    );
  }

  .menu-row {
    display: flex;
    gap: var(
      --selectable-menu-list-icon-gap,
      var(--selectable-menu-list-default-icon-gap)
    );
    cursor: pointer;
  }

  .menu-row.disabled {
    opacity: 50%;
    cursor: not-allowed;
  }

  .menu-row.selected {
    color: var(
      --selectable-menu-list-selected-color,
      var(--selectable-menu-list-default-selected-color)
    )
  }

  .divider {
    height: var(
      --selectable-menu-list-divider-height,
      var(--selectable-menu-list-default-divider-height)
    );
    background-color: var(
      --selectable-menu-list-divider-background-color,
      var(--selectable-menu-list-default-divider-background-color)
    );
  }
</style>