<script lang="ts">
  import Teleporter from '$lib/utils/teleporter';
  import { BROWSER } from 'esm-env';
  import { beforeUpdate, onMount } from "svelte";
  import Keyboarder, { type CallbackFunction } from '$lib/utils/keyboarder';

  export let open = false,
    overlayOpacity = "30%",
    overlayColor = "#282828",
    overlayBackdropFilter: string | undefined = undefined,
    transition: 'fly-down' | 'fly-up' | 'fly-horizontal' | 'scale' | 'fade' = 'fly-up',
    transitionTimingFunction: string = 'cubic-bezier(0.075, 0.82, 0.165, 1)',
    transitionDuration: string = '0.5s'

  let zIndex = 50,
    localOpen: boolean = open,
    dialogElement: HTMLElement,
    teleportedUid: string | undefined = undefined,
    hasBeenOpened: boolean = false;

  onMount(() => {
    if(!teleportedUid) {
      let tp = new Teleporter()
      teleportedUid = tp.attachNode(dialogElement)
    }

    let keyboarderHandler: CallbackFunction = (params) => {
      if(params.key == 'Escape' && localOpen) closeDialog()
    }
    Keyboarder.on(keyboarderHandler)

    return () => {
      if(!!teleportedUid) {
        let tp = new Teleporter()
        tp.destroyNode(teleportedUid)
      }

      Keyboarder.off(keyboarderHandler)
    }
  })

  beforeUpdate(() => {
    if (BROWSER) {
      if (open && localOpen != open) {
        hasBeenOpened = true

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
    style:--dialog-transition-timing-function={transitionTimingFunction}
    style:--dialog-transition-duration={transitionDuration}
    style:--dialog-z-index={zIndex}
    style:display="flex"
    style:align-items="center"
    style:justify-content="space-between"
    style:backdrop-filter={localOpen ? overlayBackdropFilter : 'none'}
    class="overlay-container"
    class:overlay-container-active={localOpen}
    class:overlay-container-deactive={!localOpen}
    class:hidden-behind={!localOpen && !hasBeenOpened}
    bind:this={dialogElement}
  >
    <div
      style:background-color={overlayColor}
      class="overlay"
      class:overlay-active={localOpen}
      class:hidden-behind={!localOpen && !hasBeenOpened}
      on:click={handleOverlayClick}
      on:keypress={handleOverlayClick}
      on:touchmove|preventDefault={() => {}}
      on:wheel|preventDefault={() => {}}
    />
    <div
      style:position="absolute"
      style:top="0px"
      style:right="0px"
      style:z-index={zIndex + 1}

      class:fly-down-in={transition == 'fly-down' && localOpen}
      class:fly-down-out={transition == 'fly-down' && !localOpen && hasBeenOpened}

      class:fly-up-in={transition == 'fly-up' && localOpen}
      class:fly-up-out={transition == 'fly-up' && !localOpen && hasBeenOpened}

      class:fly-horizontal-in={transition == 'fly-horizontal' && localOpen}
      class:fly-horizontal-out={transition == 'fly-horizontal' && !localOpen && hasBeenOpened}

      class:scale-in={transition == 'scale' && localOpen}
      class:scale-out={transition == 'scale' && !localOpen && hasBeenOpened}

      class:fade-in={transition == 'fade' && localOpen}
      class:fade-out={transition == 'fade' && !localOpen && hasBeenOpened}

      class:hidden={!localOpen && !hasBeenOpened}
    >
      <slot name="top-right" />
    </div>
    <div
      style:z-index={zIndex + 1}
      on:click|stopPropagation
      on:keypress|stopPropagation

      class:fly-down-in={transition == 'fly-down' && localOpen}
      class:fly-down-out={transition == 'fly-down' && !localOpen && hasBeenOpened}

      class:fly-up-in={transition == 'fly-up' && localOpen}
      class:fly-up-out={transition == 'fly-up' && !localOpen && hasBeenOpened}

      class:fly-horizontal-in={transition == 'fly-horizontal' && localOpen}
      class:fly-horizontal-out={transition == 'fly-horizontal' && !localOpen && hasBeenOpened}

      class:scale-in={transition == 'scale' && localOpen}
      class:scale-out={transition == 'scale' && !localOpen && hasBeenOpened}

      class:fade-in={transition == 'fade' && localOpen}
      class:fade-out={transition == 'fade' && !localOpen && hasBeenOpened}

      class:hidden={!localOpen && !hasBeenOpened}
    >
      <slot name="center-left" />
    </div>
    <div
      style:z-index={zIndex + 1}
      on:click|stopPropagation
      on:keypress|stopPropagation

      class:fly-down-in={transition == 'fly-down' && localOpen}
      class:fly-down-out={transition == 'fly-down' && !localOpen && hasBeenOpened}

      class:fly-up-in={transition == 'fly-up' && localOpen}
      class:fly-up-out={transition == 'fly-up' && !localOpen && hasBeenOpened}

      class:fly-horizontal-in={transition == 'fly-horizontal' && localOpen}
      class:fly-horizontal-out={transition == 'fly-horizontal' && !localOpen && hasBeenOpened}

      class:scale-in={transition == 'scale' && localOpen}
      class:scale-out={transition == 'scale' && !localOpen && hasBeenOpened}

      class:fade-in={transition == 'fade' && localOpen}
      class:fade-out={transition == 'fade' && !localOpen && hasBeenOpened}

      class:hidden={!localOpen && !hasBeenOpened}
    >
      <slot />
    </div>
    <div
      style:z-index={zIndex + 1}
      on:click|stopPropagation
      on:keypress|stopPropagation

      class:fly-down-in={transition == 'fly-down' && localOpen}
      class:fly-down-out={transition == 'fly-down' && !localOpen && hasBeenOpened}

      class:fly-up-in={transition == 'fly-up' && localOpen}
      class:fly-up-out={transition == 'fly-up' && !localOpen && hasBeenOpened}

      class:fly-horizontal-in={transition == 'fly-horizontal' && localOpen}
      class:fly-horizontal-out={transition == 'fly-horizontal' && !localOpen && hasBeenOpened}

      class:scale-in={transition == 'scale' && localOpen}
      class:scale-out={transition == 'scale' && !localOpen && hasBeenOpened}

      class:fade-in={transition == 'fade' && localOpen}
      class:fade-out={transition == 'fade' && !localOpen && hasBeenOpened}

      class:hidden={!localOpen && !hasBeenOpened}
    >
      <slot name="center-right" />
    </div>
  </div>
</div>

<style>
  .overlay-container {
    height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0px;
    left: 0px;
    transition-property: backdrop-filter;
    transition-duration: var(--dialog-transition-duration);
    transition-timing-function: var(--dialog-transition-timing-function);
  }

  .overlay-container-active {
    animation: z-index-showing var(--dialog-transition-timing-function) calc(var(--dialog-transition-duration) - 0.2s) forwards;
  }

  .overlay-container-deactive {
    animation: z-index-hiding var(--dialog-transition-timing-function) calc(var(--dialog-transition-duration) - 0.2s) forwards;
  }

  @keyframes z-index-hiding {
    0% {
      z-index: var(--dialog-z-index);
    }
    99% {
      z-index: var(--dialog-z-index);
    }
    to {
      z-index: -200;
    }
  }

  @keyframes z-index-showing {
    0% {
      z-index: -200;
    }
    1% {
      z-index: var(--dialog-z-index);
    }
    100% {
      z-index: var(--dialog-z-index);
    }
  }

  .overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    transition: opacity var(--dialog-transition-duration) var(--dialog-transition-timing-function);
    opacity: 0%;
  }

  .overlay-active {
    z-index: inherit;
    opacity: var(--dialog-overlay-opacity);
  }

  .hidden {
    opacity: 0;
  }

  .hidden-behind {
    z-index: -200 !important;
  }

  /* Fly down animation */

  .fly-down-in {
    animation: fly-down-in-kf var(--dialog-transition-timing-function) var(--dialog-transition-duration) forwards;
  }

  .fly-down-out {
    animation: fly-down-out-kf var(--dialog-transition-timing-function) var(--dialog-transition-duration) forwards;
  }

  @keyframes fly-down-in-kf {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fly-down-out-kf {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-20px);
      opacity: 0;
    }
  }

  /* Fly up animation */

  .fly-up-in {
    animation: fly-up-in-kf var(--dialog-transition-timing-function) var(--dialog-transition-duration) forwards;
  }

  .fly-up-out {
    animation: fly-up-out-kf var(--dialog-transition-timing-function) var(--dialog-transition-duration) forwards;
  }

  @keyframes fly-up-in-kf {
    from {
      transform: translateY(+20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fly-up-out-kf {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(+20px);
      opacity: 0;
    }
  }

  /* Fly horizontal animation */

  .fly-horizontal-in {
    animation: fly-horizontal-in-kf var(--dialog-transition-timing-function) var(--dialog-transition-duration) forwards;
  }

  .fly-horizontal-out {
    animation: fly-horizontal-out-kf var(--dialog-transition-timing-function) var(--dialog-transition-duration) forwards;
  }

  @keyframes fly-horizontal-in-kf {
    from {
      transform: translateX(-20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes fly-horizontal-out-kf {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(+20px);
      opacity: 0;
    }
  }

  /* Scale animation */

  .scale-in {
    animation: scale-in-kf var(--dialog-transition-timing-function) var(--dialog-transition-duration) forwards;
  }

  .scale-out {
    animation: scale-out-kf var(--dialog-transition-timing-function) var(--dialog-transition-duration) forwards;
  }

  @keyframes scale-in-kf {
    from {
      transform: scale(0.7);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes scale-out-kf {
    from {
      transform: scale(1);
      opacity: 1;
    }
    to {
      transform: scale(0.7);
      opacity: 0;
    }
  }

  /* Fade animation */

  .fade-in {
    animation: fade-in-kf var(--dialog-transition-timing-function) var(--dialog-transition-duration) forwards;
  }

  .fade-out {
    animation: fade-out-kf var(--dialog-transition-timing-function) var(--dialog-transition-duration) forwards;
  }

  @keyframes fade-in-kf {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fade-out-kf {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
</style>
