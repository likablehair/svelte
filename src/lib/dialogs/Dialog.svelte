<script lang="ts">
  import { browser } from "$app/env";
  import { beforeUpdate } from "svelte";
  export let open: boolean = false,
    overlayOpacity: string = "30%",
    overlayColor: string = "#282828"
  
  let zIndex: number = 50, 
    localOpen: boolean = open

  beforeUpdate(() => {
    if(open && localOpen != open) {
      let otherDialogs: NodeListOf<HTMLElement> = document.querySelectorAll("[data-dialog=true]")
      if(otherDialogs.length > 0) {
        let maxZIndex: number
        otherDialogs.forEach((dialog) => {
          if(!maxZIndex || maxZIndex < Number(dialog.style.zIndex))
            maxZIndex = Number(dialog.style.zIndex)
        })
        zIndex = maxZIndex + 2
      }

      document.body.style.overflow = 'hidden'
    } else if(!open) {
      if(browser) {
        let otherDialogs: NodeListOf<HTMLElement> = document.querySelectorAll("[data-dialog=true]")
        if(otherDialogs.length <= 1) {
          document.body.style.overflow = 'auto'
        }
      }
    }
    
    localOpen = open
  })

  function closeDialog() {
    open = false
    localOpen = false
  }

  function handleOverlayClick() {
    closeDialog()
  }
</script>

<div 
  data-dialog={localOpen}
  style:z-index={zIndex}
  style:--dialog-overlay-opacity={overlayOpacity}
  style:display="flex"
  style:align-items="center"
  style:justify-content="space-between"
  class="overlay-container"
  class:overlay-container-active={localOpen}
>
  <div
    style:background-color={overlayColor} 
    class="overlay"
    class:overlay-active={localOpen}
    on:click={handleOverlayClick}
    on:touchmove|preventDefault={() => {}}
    on:wheel|preventDefault={() => {}}
  ></div>
  {#if localOpen }
    <div
      style:position="absolute"
      style:top="0px"
      style:right="0px"
      style:z-index={zIndex + 1}
    >
      <slot name="top-right"></slot>
    </div>
    <div 
      style:z-index={zIndex + 1}
      on:click|stopPropagation
    >
      <slot name="center-left"></slot>
    </div>
    <div
      on:click|stopPropagation
      style:z-index={zIndex + 1}
    >
      <slot></slot>
    </div>
    <div
      style:z-index={zIndex + 1}
      on:click|stopPropagation
    >
      <slot name="center-right"></slot>
    </div>
  {/if}
</div>

<style>
  .overlay-container {
    height: 0;
    width: 0;
    position: fixed;
    top: 0px;
    left: 0px;
  }

  .overlay-container-active {
    height: 100vh;
    width: 100vw;
  }

  .overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0%;
  }

  .overlay-active {
    opacity: var(--dialog-overlay-opacity);
  }
</style>