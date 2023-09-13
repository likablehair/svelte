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
    _minWidth: string | undefined = undefined,
    _overflow = "auto",
    _boxShadow: string | undefined = undefined,
    _borderRadius: string | undefined = undefined,
    _activatorGap: number = 5

  export let open = false,
    refreshPosition = false,
    activator: HTMLElement | undefined = undefined,
    anchor: "bottom" | "bottom-center" | "right-center" = "bottom",
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
    menuElement: HTMLElement | undefined = undefined,
    flipOnOverflow: boolean = false,
    stayInViewport: boolean = false,
    openingId: string | undefined = undefined;

  let zIndex = 50,
    currentUid: string = createId(),
    closeController: HTMLElement;

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
          _top = activatorTop + window.scrollY + activatorHeight + _activatorGap;
          _left = activatorLeft + window.scrollX;
        } else if (anchor == "bottom-center") {
          let { left: activatorLeft, top: activatorTop } =
            params.activator.getBoundingClientRect();
          let activatorHeight = params.activator.offsetHeight;
          let activatorWidth = params.activator.offsetWidth;
          let menuWidth = params.menuElement.offsetWidth;

          _top = activatorTop + window.scrollY + activatorHeight + _activatorGap;
          _left = activatorLeft + window.scrollX;
          if (menuWidth > activatorWidth) {
            _left = _left - (menuWidth - activatorWidth) / 2;
          } else {
            _left = _left + (activatorWidth - menuWidth) / 2;
          }
        } else if (anchor == 'right-center') {
          let { left: activatorLeft, top: activatorTop } =
            params.activator.getBoundingClientRect();
          let activatorHeight = params.activator.offsetHeight;
          let activatorWidth = params.activator.offsetWidth;
          let menuWidth = params.menuElement.offsetWidth;
          let menuHeight = params.menuElement.offsetHeight;

          _top = activatorTop + window.scrollY + (activatorHeight / 2) - (menuHeight / 2);
          _left = activatorLeft + window.scrollX + activatorWidth + _activatorGap;
          // if (menuWidth > activatorWidth) {
          //   _left = _left - (menuWidth - activatorWidth) / 2;
          // } else {
          //   _left = _left + (activatorWidth - menuWidth) / 2;
          // }
        }
      }

      if(flipOnOverflow && !!params.activator) {
        if (
          window.innerHeight + window.scrollY <
          (_top || 0) + (menuElement?.offsetHeight || 0)
        ) {
          let { top: activatorTop } = params.activator.getBoundingClientRect();
          _top = activatorTop + window.scrollY - _activatorGap - (menuElement?.offsetHeight || 0)
        }

        if (
          window.innerWidth + window.scrollX <
          (_left || 0) + (menuElement?.offsetWidth || 0)
        ) {
          let { left: activatorLeft } = params.activator.getBoundingClientRect();
          _left = activatorLeft + window.scrollX - _activatorGap - (menuElement?.offsetWidth || 0)
        }
      }

      if(stayInViewport) {
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

      if(!!positionedAncestor) {
        let { left: positionedAncestorLeft, top: positionedAncestorTop } = positionedAncestor.getBoundingClientRect();

        if(!_left) _left = 0
        if(!_top) _top = 0


        _left = _left - (positionedAncestorLeft)
        _top = _top - (positionedAncestorTop)
      }
    }
  }

  $: if (open) {
    if(!!openingId) {
      const controllers = document.querySelectorAll(`[data-operation="close"][data-opening-id="${openingId}"]`)
      for(let k = 0; k < controllers.length; k += 1) {
        if(controllers[k] !== closeController) {
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          })

          controllers[k].dispatchEvent(clickEvent)
        }
      }
    }

    let otherMenus: NodeListOf<HTMLElement> =
      document.querySelectorAll("[data-menu]");
    let otherDialogs: NodeListOf<HTMLElement> =
      document.querySelectorAll("[data-dialog]");

    let maxZIndex: number | undefined = undefined;
    if (otherDialogs.length > 0) {
      otherDialogs.forEach((dialog) => {
        if (!maxZIndex || maxZIndex < Number(dialog.style.zIndex))
          maxZIndex = Number(dialog.style.zIndex);
      });
    }

    if (otherMenus.length > 0) {
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
    window.addEventListener("mousedown", () => {
      open = false;
    });

    window.addEventListener("touchstart", () => {
      open = false;
    });

    if (activator) {
      activator.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });

      activator.addEventListener("touchstart", (event) => {
        event.stopPropagation();
      });
    }

    menuElement.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });

    menuElement.addEventListener("touchstart", (event) => {
      event.stopPropagation();
    });
  }


  let positionedAncestor: HTMLElement | undefined = undefined

  $: if(!!menuElement && !!activator) {
    let elem = getPositionedAncestor(menuElement.parentElement)
    positionedAncestor = elem == null ? undefined : elem
    calculateMenuPosition({menuElement, activator})
  }

  function getPositionedAncestor(elem: HTMLElement | null): HTMLElement | null {
    if (!elem) return null
    if (['fixed', 'absolute'].includes(getComputedStyle(elem).position)) return elem
    return getPositionedAncestor(elem.parentElement)
  }

  function handleCloseControllerClick() {
    open = false
  }

  function handleWindowScrollOrResize() {
    if(open && !!menuElement && !!activator) calculateMenuPosition({ menuElement, activator })
  }

  function handleMenuClick(e: MouseEvent, zIndex: number) {
    let otherMenus: NodeListOf<HTMLElement> = document.querySelectorAll(`[data-menu]`)
    otherMenus.forEach(m => {
      let uid = m.getAttribute('data-uid')
      if(uid !== currentUid && Number(m.style.zIndex) > zIndex) {
        let controller = document.querySelector(`[data-operation="close"][data-uid="${uid}"]`)
        if(!!controller) {
          const clickEvent = new MouseEvent('click', {
              bubbles: false,
              cancelable: true,
              view: window
            })
          controller.dispatchEvent(clickEvent)
        }
      }
    })
  }

</script>

<svelte:window on:scroll={handleWindowScrollOrResize} on:resize={handleWindowScrollOrResize} ></svelte:window>

<div
  class="controller"
  data-operation="close"
  data-opening-id={openingId}
  data-uid={currentUid}
  on:click={handleCloseControllerClick}
  on:keypress={handleCloseControllerClick}
  bind:this={closeController}
></div>
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
    style:min-width={_minWidth}
    style:overflow={_overflow}
    in:inAnimation={inAnimationConfig}
    out:outAnimation={outAnimationConfig}
    on:click={(e) => handleMenuClick(e, zIndex)}
    on:keydown
  >
    <slot />
  </div>
{/if}

<style>
  .controller {
    visibility: hidden;
  }
</style>
