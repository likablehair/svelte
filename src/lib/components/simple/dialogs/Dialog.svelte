<script lang="ts">
  import Teleporter from '$lib/utils/teleporter';

  import { BROWSER } from 'esm-env';
  import { beforeUpdate, onMount } from "svelte";
  export let open = false,
    overlayOpacity = "30%",
    overlayColor = "#282828";

  let zIndex = 50,
    localOpen: boolean = open,
    dialogElement: HTMLElement,
    teleportedUid: string | undefined = undefined;

  onMount(() => {
    if(!teleportedUid) {
      let tp = new Teleporter()
      teleportedUid = tp.attachNode(dialogElement)
    }

    return () => {
      if(!!teleportedUid) {
        let tp = new Teleporter()
        tp.destroyNode(teleportedUid)
      }
    }
  })

  beforeUpdate(() => {
    if (BROWSER) {
      if (open && localOpen != open) {
        let otherDialogs: NodeListOf<HTMLElement> =
          document.querySelectorAll("[data-dialog=true]");

        if (otherDialogs.length > 0) {
          let maxZIndex = 0;
          otherDialogs.forEach((dialog) => {
            let computedStyle = getComputedStyle(dialog)
            let currentZIndex = computedStyle.getPropertyValue('--dialog-z-index')
            if (!maxZIndex || maxZIndex < Number(currentZIndex))
              maxZIndex = Number(currentZIndex);
          });
          zIndex = maxZIndex + 2;
        }

        document.body.style.overflow = "hidden";
      } else if (!open) {
        let otherDialogs: NodeListOf<HTMLElement> =
          document.querySelectorAll("[data-dialog=true]");
        if (otherDialogs.length <= 1) {
          document.body.style.overflow = "auto";
        }
      }
    }

    localOpen = open;
  });

  function closeDialog() {
    open = false;
    localOpen = false;
  }

  function handleOverlayClick() {
    closeDialog();
  }
</script>

<div
  style:visibility="hidden"
>
  <div
    data-dialog={localOpen}
    style:--dialog-overlay-opacity={overlayOpacity}
    style:--dialog-z-index={zIndex}
    style:display="flex"
    style:align-items="center"
    style:justify-content="space-between"
    class="overlay-container"
    class:overlay-container-active={localOpen}
    bind:this={dialogElement}
  >
    <div
      style:background-color={overlayColor}
      class="overlay"
      class:overlay-active={localOpen}
      on:click={handleOverlayClick}
      on:keypress={handleOverlayClick}
      on:touchmove|preventDefault={() => {}}
      on:wheel|preventDefault={() => {}}
    />
    {#if localOpen}
      <div
        style:position="absolute"
        style:top="0px"
        style:right="0px"
        style:z-index={zIndex + 1}
      >
        <slot name="top-right" />
      </div>
      <div
        style:z-index={zIndex + 1}
        on:click|stopPropagation
        on:keypress|stopPropagation
      >
        <slot name="center-left" />
      </div>
      <div
        style:z-index={zIndex + 1}
        on:click|stopPropagation
        on:keypress|stopPropagation
      >
        <slot />
      </div>
      <div
        style:z-index={zIndex + 1}
        on:click|stopPropagation
        on:keypress|stopPropagation
      >
        <slot name="center-right" />
      </div>
    {/if}
  </div>
</div>

<style>
  .overlay-container {
    z-index: -200;
    height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0px;
    left: 0px;
  }

  .overlay-container-active {
    z-index: var(--dialog-z-index);
  }

  .overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0%;
    z-index: -200;
  }

  .overlay-active {
    z-index: inherit;
    opacity: var(--dialog-overlay-opacity);
  }
</style>
