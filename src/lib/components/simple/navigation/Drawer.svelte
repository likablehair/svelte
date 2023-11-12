<script lang="ts">
  import '../../../css/main.css'
  import './Drawer.css'
  import Navigator from "$lib/components/simple/navigation/Navigator.svelte";
  import type { Item } from "$lib/components/simple/navigation/Navigator.svelte";
    import { createEventDispatcher } from 'svelte';

  export let open = false,
    position: "left" | "top" | "right" | "bottom" = "left",
    overlay = true,
    items: Item[] = [];

  const dispatch = createEventDispatcher<{
    'close': {}
  }>()

  function handleClickOverlay() {
    open = false;
    overlay = false;
    dispatch('close')
  }

  $: if(open) {
    overlay = true
  }
</script>

<div
  style:position="fixed"
  class="drawer-container"
  class:left={position == 'left'}
  class:right={position == 'right'}
  class:top={position == 'top'}
  class:bottom={position == 'bottom'}
  class:opened={open}
  class:animate-left={position == "left"}
  class:animate-right={position == "right"}
  class:animate-bottom={position == "bottom"}
  class:animate-top={position == "top"}
>
  <slot {open}>
    <div
      style:display="flex"
      style:justify-content="center"
      style:align-items="center"
      style:margin-top={position == "left" || position == "right"
        ? "10px"
        : "0px"}
      style:height={position == "top" || position == "bottom"
        ? "100%"
        : "fit-content"}
    >
      <Navigator
        {items}
        vertical={position == "right" || position == "left"}
        on:item-click
      />
    </div>
  </slot>
</div>
{#if overlay}
  <div
    on:click={handleClickOverlay}
    on:keypress={handleClickOverlay}
    class="overlay"
    class:overlay-active={open}
    class:overlay-hidden={!open}
  />
{/if}

<style>
  .animate-left {
    transition: left var(--drawer-opening-speed, var(--drawer-default-opening-speed)) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-right {
    transition: right var(--drawer-opening-speed, var(--drawer-default-opening-speed)) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-bottom {
    transition: bottom var(--drawer-opening-speed, var(--drawer-default-opening-speed)) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-top {
    transition: top var(--drawer-opening-speed, var(--drawer-default-opening-speed)) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .drawer-container {
    z-index: var(--drawer-z-index, var(--drawer-default-z-index));
    background-color: var(
      --drawer-background-color,
      var(--drawer-default-background-color)
    );
    color: var(--drawer-color, var(--drawer-default-color));
    overflow: var(--drawer-overflow, var(--drawer-default-overflow));
    border-radius: var(--drawer-border-radius);
    margin: var(--drawer-margin);
  }

  .overlay {
    transition: all var(--drawer-overlay-speed, var(--drawer-default-overlay-speed)) cubic-bezier(0.4, 0, 0.2, 1);
    background-color: var(
      --drawer-overlay-background-color,
      var(--drawer-default-overlay-background-color)
    );
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100vw;
    height: 100vh;
  }

  .overlay-active {
    opacity: var(
      --drawer-overlay-opacity,
      var(--drawer-default-overlay-opacity)
    );
    z-index: calc(var(--drawer-z-index, var(--drawer-default-z-index)) - 1);
  }

  .overlay-hidden {
    opacity: 0%;
    z-index: -1;
  }

  .left {
    left: calc(0px - var(--drawer-space, var(--drawer-default-space)));
    width: var(--drawer-space, var(--drawer-default-space));
    bottom: 0px;
    top: 0px;
  }

  .left.opened {
    left: 0px;
  }

  .right {
    right: calc(0px - var(--drawer-space, var(--drawer-default-space)));
    width: var(--drawer-space, var(--drawer-default-space));
    bottom: 0px;
    top: 0px;
  }

  .right.opened {
    right: calc(0px);
  }

  .top {
    left: 0px;
    right: 0px;
    height: var(--drawer-space, var(--drawer-default-space));
    top: calc(0px - var(--drawer-space, var(--drawer-default-space)));
  }

  .top.opened {
    top: 0px;
  }

  .bottom {
    left: 0px;
    right: 0px;
    height: var(--drawer-space, var(--drawer-default-space));
    bottom: calc(0px - var(--drawer-space, var(--drawer-default-space)));
  }

  .bottom.opened {
    bottom: 0px;
  }
</style>
