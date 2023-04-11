<script lang="ts">
  import Navigator from "$lib/components/simple/navigation/Navigator.svelte";
  import type { Item } from "$lib/components/simple/navigation/Navigator.svelte";

  export let open = false,
    position: "left" | "top" | "right" | "bottom" = "left",
    space = "200px",
    openingSpeed = "0.3s",
    overlaySpeed = "0.2s",
    color: string | undefined = undefined,
    overlay = true,
    backgroundColor: string | undefined = undefined,
    overlayColor = "#282828",
    overlayOpacity = "30%",
    zIndex = 30,
    items: Item[] = [];

  let height: string | undefined = undefined,
    width: string | undefined = undefined,
    top: string | undefined = undefined,
    bottom: string | undefined = undefined,
    left: string | undefined = undefined,
    right: string | undefined = undefined;

  function handleClickOverlay() {
    open = false;
  }

  $: if (position == "left") {
    height = "100vh";
    width = space;
    top = "0px";
    bottom = undefined;
    right = undefined;

    if (open) {
      left = `0px`;
    } else {
      left = `-${space}`;
    }
  } else if (position == "right") {
    height = "100vh";
    width = space;
    top = "0px";
    bottom = undefined;
    left = "auto";

    if (open) {
      right = `0px`;
    } else {
      right = `calc(0vw - ${space})`;
    }
  } else if (position == "top") {
    height = space;
    width = "100vw";
    bottom = undefined;
    left = "0px";
    right = undefined;

    if (open) {
      top = `0px`;
    } else {
      top = `-${space}`;
    }
  } else if (position == "bottom") {
    height = space;
    width = "100vw";
    top = "auto";
    left = "0px";
    right = undefined;

    if (open) {
      bottom = `0px`;
    } else {
      bottom = `calc(0vh - ${space})`;
    }
  }
</script>

<div
  style:--drawer-opening-speed={openingSpeed}
  style:position="fixed"
  style:height
  style:width
  style:top
  style:bottom
  style:left
  style:right
  style:background-color={backgroundColor}
  style:z-index={zIndex}
  style:color
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
    style:z-index={open ? zIndex - 1 : -5}
    style:position="fixed"
    style:top="0px"
    style:left="0px"
    style:width="100vw"
    style:height="100vh"
    style:background-color={overlayColor}
    style:--drawer-overlay-opacity={overlayOpacity}
    style:--drawer-overlay-speed={overlaySpeed}
    class="overlay"
    class:overlay-active={open}
    class:overlay-hidden={!open}
  />
{/if}

<style>
  .animate-left {
    transition: left var(--drawer-opening-speed) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-right {
    transition: right var(--drawer-opening-speed) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-bottom {
    transition: bottom var(--drawer-opening-speed) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-top {
    transition: top var(--drawer-opening-speed) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .overlay {
    transition: all var(--drawer-overlay-speed) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .overlay-active {
    opacity: var(--drawer-overlay-opacity);
  }

  .overlay-hidden {
    opacity: 0%;
  }
</style>
