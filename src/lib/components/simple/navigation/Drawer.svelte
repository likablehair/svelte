<script lang="ts">
  import '../../../css/main.css'
  import './Drawer.css'
  import Navigator from "$lib/components/simple/navigation/Navigator.svelte";
  import type { Item } from "$lib/components/simple/navigation/Navigator.svelte";
  import { onMount, type ComponentProps, type Snippet } from 'svelte';
  import Teleporter from '$lib/utils/teleporter';
  import Keyboarder, { type CallbackFunction } from '$lib/utils/keyboarder';
  import { BROWSER } from 'esm-env';

  interface Props {
    open?: boolean;
    position?: "left" | "top" | "right" | "bottom";
    overlay?: boolean;
    closeOnClickOutside?: boolean;
    items?: Item[];
    teleportedUid?: string;
    _space?: string;
    _openingSpeed?: string;
    _backgroundColor?: string;
    _color?: string;
    _overflow?: string;
    _borderRadius?: string;
    _margin?: string;
    _overlaySpeed?: string;
    _overlayBackgroundColor?: string;
    _overlayOpacity?: string;
    onclose?: () => void
    onitemClick?: ComponentProps<typeof Navigator>['onitemClick']
    children?: Snippet<[]>
  }

  let {
    open = $bindable(false),
    position = $bindable("left"),
    overlay = $bindable(false),
    closeOnClickOutside = true,
    items = [],
    teleportedUid = undefined,
    _space = undefined,
    _openingSpeed = undefined,
    _backgroundColor = undefined,
    _color = undefined,
    _overflow = undefined,
    _borderRadius = undefined,
    _margin = undefined,
    _overlaySpeed = undefined,
    _overlayBackgroundColor = undefined,
    _overlayOpacity = undefined,
    onclose,
    children,
    onitemClick,
  }: Props = $props();

  let drawerElement: HTMLElement,
    localOpen: boolean = $state(false)

  onMount(() => {
    if(!teleportedUid) {
      // let oldCssVars = {
      //   '--drawer-space': getComputedStyle(drawerElement).getPropertyValue('--drawer-space')
      // }

      let tp = new Teleporter()
      teleportedUid = tp.attachNode(drawerElement)

      // drawerElement.style.setProperty('--drawer-space', oldCssVars['--drawer-space'])
    }

    let keyboarderHandler: CallbackFunction = (params) => {
      if(params.key == 'Escape' && open) closeDrawer()
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

  function closeDrawer() {
    open = false;
    overlay = false;
    if(onclose) {
      onclose()
    }
  }

  function handleClickOverlay() {
    if(closeOnClickOutside) {
      open = false;
      overlay = false;
      if(onclose) {
        onclose()
      }
    }
  }

  let zIndex: number = $state(50)
  $effect.pre(() => {
    if(BROWSER && open && localOpen !== open) {
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

      overlay = true
      localOpen = true
    } else if(BROWSER && !open && localOpen !== open) {
      localOpen = false
    }
  })
</script>

<div
  class="drawer-container"
  bind:this={drawerElement}
  data-drawer={localOpen}
  style:--drawer-space={_space}
  style:--drawer-opening-speed={_openingSpeed}
  style:--drawer-background-color={_backgroundColor}
  style:--drawer-color={_color}
  style:--drawer-overflow={_overflow}
  style:--drawer-border-radius={_borderRadius}
  style:--drawer-margin={_margin}
  style:--drawer-overlay-speed={_overlaySpeed}
  style:--drawer-overlay-background-color={_overlayBackgroundColor}
  style:--drawer-overlay-opacity={_overlayOpacity}
  style:--drawer-z-index={zIndex}
>
  <div
    style:position="fixed"
    class="drawer-container"
    class:left={position == 'left'}
    class:right={position == 'right'}
    class:top={position == 'top'}
    class:bottom={position == 'bottom'}
    class:opened={localOpen}
    class:animate-left={position == "left"}
    class:animate-right={position == "right"}
    class:animate-bottom={position == "bottom"}
    class:animate-top={position == "top"}
    style:z-index={zIndex + 1}
  >
    {#if children}
      {@render children()}
    {:else}
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
          {onitemClick}
        />
      </div>
    {/if}
  </div>
  {#if overlay}
    <div
      onclick={handleClickOverlay}
      onkeypress={handleClickOverlay}
      class="overlay"
      class:overlay-active={localOpen}
      class:overlay-hidden={!localOpen}
      style:z-index={zIndex}
      role="button"
      tabindex="0"
    ></div>
  {/if}
</div>

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
  }

  .overlay-hidden {
    opacity: 0%;
    display: none;
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
