<script lang="ts">
  import { createId } from '@paralleldrive/cuid2';

  import {
    fly,
    type FadeParams,
    type FlyParams,
    type SlideParams,
    type TransitionConfig,
  } from "svelte/transition";

  export let _top: number | undefined = undefined,
    _left: number | undefined = undefined,
    _width: string = 'auto',
    _height: string = 'auto',
    _maxHeight: string | undefined = undefined,
    _overflow = "auto",
    _boxShadow: string | undefined = undefined,
    _borderRadius: string | undefined = undefined

  export let open = false,
    refreshPosition = false,
    activator: HTMLElement | undefined = undefined,
    anchor: "bottom" | "bottom-center" = "bottom",
    closeOnClickOutside = false,
    inAnimation: (
      node: Element,
      params?: SlideParams | FlyParams | FadeParams
    ) => TransitionConfig = fly,
    inAnimationConfig: SlideParams | FlyParams | FadeParams = {
      duration: 100,
      y: 10,
    },
    outAnimation: (
      node: Element,
      params?: SlideParams | FlyParams | FadeParams
    ) => TransitionConfig = fly,
    outAnimationConfig: SlideParams | FlyParams | FadeParams = {
      duration: 100,
      y: 10,
    },
    menuElement: HTMLElement | undefined = undefined;

  let zIndex = 50,
    currentUid: string = createId();

  function calculateMenuPosition(params: {
    activator: HTMLElement;
    menuElement: HTMLElement;
  }) {
    if (params.menuElement) {
      if (params.activator) {
        if (anchor == "bottom") {
          let { left: activatorLeft, top: activatorTop } =
            params.activator.getBoundingClientRect();
          let activatorHeight = params.activator.offsetHeight;
          _top = activatorTop + window.scrollY + activatorHeight;
          _left = activatorLeft + window.scrollX;
        } else if (anchor == "bottom-center") {
          let { left: activatorLeft, top: activatorTop } =
            params.activator.getBoundingClientRect();
          let activatorHeight = params.activator.offsetHeight;
          let activatorWidth = params.activator.offsetWidth;
          let menuWidth = params.menuElement.offsetWidth;

          _top = activatorTop + window.scrollY + activatorHeight;
          _left = activatorLeft + window.scrollX;
          if (menuWidth > activatorWidth) {
            _left = _left - (menuWidth - activatorWidth) / 2;
          } else {
            _left = _left + (activatorWidth - menuWidth) / 2;
          }
        }
      }

      if (
        window.innerWidth + window.scrollX <
        (_left || 0) + (menuElement?.offsetWidth || 0)
      ) {
        _left = Math.max(
          window.innerWidth + window.scrollX - (menuElement?.offsetWidth || 0),
          0
        );
      }
    }
  }

  $: if (open) {
    let otherMenus: NodeListOf<HTMLElement> =
      document.querySelectorAll("[data-menu=true]");
    let otherDialogs: NodeListOf<HTMLElement> =
      document.querySelectorAll("[data-dialog=true]");

    let maxZIndex: number | undefined = undefined;
    if (otherDialogs.length > 0) {
      otherDialogs.forEach((dialog) => {
        if (!maxZIndex || maxZIndex < Number(dialog.style.zIndex))
          maxZIndex = Number(dialog.style.zIndex);
      });
    }

    if (otherMenus.length > 0) {
      let maxZIndex: number;
      otherMenus.forEach((menu) => {
        if (!maxZIndex || maxZIndex < Number(menu.style.zIndex))
          maxZIndex = Number(menu.style.zIndex);
      });
    }

    if (!!activator && !!menuElement)
      calculateMenuPosition({ activator, menuElement });

    if (maxZIndex) zIndex = maxZIndex + 2;
  }
  $: if (!!_width && !!activator && !!menuElement) {
    calculateMenuPosition({ activator, menuElement });
  }
  $: if (refreshPosition && !!activator && !!menuElement) {
    calculateMenuPosition({ activator, menuElement });
    refreshPosition = false;
  }
  $: if (closeOnClickOutside && !!menuElement) {
    window.addEventListener("click", () => {
      open = false;
    });

    window.addEventListener("touchstart", () => {
      open = false;
    });

    if (activator) {
      activator.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      activator.addEventListener("touchstart", (event) => {
        event.stopPropagation();
      });
    }

    menuElement.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    menuElement.addEventListener("touchstart", (event) => {
      event.stopPropagation();
    });
  }

</script>

{#if open}
  <div
    bind:this={menuElement}
    data-menu
    data-uid={currentUid}
    style:z-index={zIndex}
    style:position="absolute"
    style:top={_top + "px"}
    style:box-shadow={_boxShadow}
    style:border-radius={_borderRadius}
    style:left={_left + "px"}
    style:height={_height}
    style:max-height={_maxHeight}
    style:width={_width}
    style:overflow={_overflow}
    in:inAnimation={inAnimationConfig}
    out:outAnimation={outAnimationConfig}
  >
    <slot />
  </div>
{/if}
