<script lang="ts">
  import Teleporter from '$lib/utils/teleporter';
  import { BROWSER } from 'esm-env';
  import { onMount, type Snippet } from "svelte";
  import Keyboarder, { type CallbackFunction } from '$lib/utils/keyboarder';

  interface Props {
    open?: boolean;
    persistent?: boolean;
    transition?: 'fly-down' | 'fly-up' | 'fly-horizontal' | 'scale' | 'fade';
    _overlayOpacity?: string;
    _overlayColor?: string;
    _overlayBackdropFilter?: string;
    _transitionTimingFunction?: string;
    _transitionDuration?: string;
    topRightSnippet?: Snippet<[]>;
    centerLeftSnippet?: Snippet<[]>;
    centerRightSnippet?: Snippet<[]>;
    children?: Snippet<[]>;
  }

  let {
    open = $bindable(),
    persistent = false,
    transition = 'fly-up',
    _overlayOpacity = "30%",
    _overlayColor = "#282828",
    _overlayBackdropFilter,
    _transitionTimingFunction = 'cubic-bezier(0.075, 0.82, 0.165, 1)',
    _transitionDuration = '0.5s',
    topRightSnippet,
    centerLeftSnippet,
    centerRightSnippet,
    children,
  }: Props = $props()


  let zIndex = $state(50),
    localOpen: boolean = $state(open || false),
    dialogElement: HTMLElement,
    teleportedUid: string | undefined = undefined,
    hasBeenOpened: boolean = $state(false);

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

  $effect.pre(() => {
    if (BROWSER) {
      if (open && localOpen != open) {
        hasBeenOpened = true

        let otherDialogs: NodeListOf<HTMLElement> =
          document.querySelectorAll("[data-dialog=true]");

        let maxZIndex = 0;

        if (otherDialogs.length > 0) {
          otherDialogs.forEach((dialog) => {
            let computedStyle = getComputedStyle(dialog)
            let currentZIndex = computedStyle.getPropertyValue('--dialog-z-index')
            if (!maxZIndex || maxZIndex < Number(currentZIndex))
              maxZIndex = Number(currentZIndex);
          });
          zIndex = maxZIndex + 2;
        }

        let otherDrawers: NodeListOf<HTMLElement> =
          document.querySelectorAll("[data-drawer=true]");

        if (otherDrawers.length > 0) {
          otherDrawers.forEach((dialog) => {
            let computedStyle = getComputedStyle(dialog)
            let currentZIndex = computedStyle.getPropertyValue('--drawer-z-index')
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

    localOpen = open || false;
  });

  function closeDialog() {
    open = false;
    localOpen = false;
  }

  function handleOverlayClick() {
    if(persistent) return;
    closeDialog();
  }
</script>

<div
  style:visibility="hidden"
>
  <div
    data-dialog={localOpen}
    style:--dialog-overlay-opacity={_overlayOpacity}
    style:--dialog-transition-timing-function={_transitionTimingFunction}
    style:--dialog-transition-duration={_transitionDuration}
    style:--dialog-z-index={zIndex}
    style:display="flex"
    style:align-items="center"
    style:justify-content="space-between"
    style:backdrop-filter={localOpen ? _overlayBackdropFilter : 'none'}
    class="overlay-container"
    class:overlay-container-active={localOpen}
    class:overlay-container-deactive={!localOpen}
    class:hidden-behind={!localOpen}
    bind:this={dialogElement}
  >
    <div
      style:background-color={_overlayColor}
      class="overlay"
      class:overlay-active={localOpen}
      class:hidden-behind={!localOpen}
      onclick={handleOverlayClick}
      onkeypress={handleOverlayClick}
      ontouchmove={(e) => {
        e.preventDefault()
      }}
      onwheel={e => {
        e.preventDefault()
      }}
      role="presentation"
      tabindex="-1"
    ></div>
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
      class:hidden-far-behind={!localOpen}
    >
      {@render topRightSnippet?.()}
    </div>
    <div
      style:z-index={zIndex + 1}
      onclick={e => {
        e.stopPropagation()
      }}
      onkeypress={e => {
        e.stopPropagation()
      }}
      role="presentation"
      tabindex="-1"

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
      class:hidden-far-behind={!localOpen}
    >
      {@render centerLeftSnippet?.()}
    </div>
    <div
      style:z-index={zIndex + 1}
      style:position="relative"
      onclick={e => {
        e.stopPropagation()
      }}
      onkeypress={e => {
        e.stopPropagation()
      }}
      role="presentation"
      tabindex="-1"

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

      class:hidden={!localOpen}
      class:hidden-far-behind={!localOpen}
    >
      {@render children?.()}
    </div>
    <div
      style:z-index={zIndex + 1}
      onclick={e => {
        e.stopPropagation()
      }}
      onkeypress={e => {
        e.stopPropagation()
      }}
      role="presentation"
      tabindex="-1"

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
      class:hidden-far-behind={!localOpen}
    >
      {@render centerRightSnippet?.()}
    </div>
  </div>
</div>

<style>
  .overlay-container {
    height: 100dvh;
    width: 100dvw;
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

  .hidden-far-behind {
    z-index: -250 !important;
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
