<script lang="ts">
  import { createId } from '@paralleldrive/cuid2';

  import {
    fly,
    type FadeParams,
    type FlyParams,
    type SlideParams,
    type TransitionConfig,
  } from "svelte/transition";

  import { sidebarOpened } from '$lib/stores/layouts/unstableSidebarOpened';

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
          _top = activatorTop + activatorHeight + _activatorGap;
          _left = activatorLeft;

          let { top: fixedParentTop, left: fixedParentLeft, fixedParent, validStickyParent } = getParentInstanceFromViewport(activator?.parentElement);
          if(!!fixedParent) {
            _top = _top - fixedParentTop
            _left = _left - fixedParentLeft
          } else if(!validStickyParent && !fixedParent) {
            _top = _top + window.scrollY
            _left = _left + window.scrollX
          }

        } else if (anchor == "bottom-center") {
          let { left: activatorLeft, top: activatorTop } =
            params.activator.getBoundingClientRect();
          let activatorHeight = params.activator.offsetHeight;
          let activatorWidth = params.activator.offsetWidth;
          let menuWidth = params.menuElement.offsetWidth;
          _top = activatorTop + activatorHeight + _activatorGap;
          _left = activatorLeft;

          let { top: fixedParentTop, left: fixedParentLeft, fixedParent, validStickyParent } = getParentInstanceFromViewport(activator?.parentElement);
          if(!!fixedParent) {
            _top = _top - fixedParentTop
            _left = _left - fixedParentLeft
          } else if(!validStickyParent && !fixedParent) {
            _top = _top + window.scrollY
            _left = _left + window.scrollX
          }

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
          let menuHeight = params.menuElement.offsetHeight;
          let { top: fixedParentTop, left: fixedParentLeft } = getParentInstanceFromViewport(activator?.parentElement);

          _top = activatorTop + window.scrollY + (activatorHeight / 2) - (menuHeight / 2) - fixedParentTop;
          _left = activatorLeft + window.scrollX + activatorWidth + _activatorGap - fixedParentLeft;
        }
      }

      if(flipOnOverflow && !!params.activator) {
        let { top: activatorTopDistance } = params.activator.getBoundingClientRect()
        if (window.innerHeight < activatorTopDistance + (menuElement?.offsetHeight || 0) + ((menuElement?.offsetHeight || 0) * 0.1)) {
          _top = getTopDistance(params.activator) - _activatorGap - (menuElement?.offsetHeight || 0)
        }

        if (
          anchor == 'right-center' &&
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

        _left = _left - (positionedAncestorLeft + window.scrollX)
        _top = _top - (positionedAncestorTop + window.scrollY)

        if(!!activator) {
          let { validStickyParent, fixedParent } = getParentInstanceFromViewport(activator?.parentElement)
          if(!!validStickyParent || !!fixedParent) {
            _left = _left + window.scrollX
            _top = _top + window.scrollY
          }
        }
      }
    }
  }

  function getTopDistance(elem: HTMLElement): number {
    let positionedAncestor = getPositionedAncestor(elem)
    if(!!positionedAncestor) {
      let top: number = parseInt(getComputedStyle(positionedAncestor).top)
      return (isNaN(top) ? 0 : top) + elem.offsetTop - calcScrollY(elem)
    }
    return window.scrollY + elem.getBoundingClientRect().top
  }

  function calcScrollY(elem: HTMLElement): number {
    let parent = elem.parentElement
    let scroll = 0
    while(!!parent) {
      scroll += parent.scrollTop
      let parentPosition = getComputedStyle(parent).position
      if(parentPosition === 'absolute' || parentPosition === 'fixed') break
      parent = parent.parentElement
    }
    return scroll
  }


  $: if (open) {
    if(!!activator) {
      let parent = activator.parentElement
      while(!!parent) {
        let parentPosition = getComputedStyle(parent).position
        parent.addEventListener('scroll', refreshMenuPosition)
        if(parentPosition == 'absolute' || parentPosition == 'fixed') break
        parent = parent.parentElement
      }
    }

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
    setTimeout(() => {
      if(!!activator && !!menuElement)
        calculateMenuPosition({ activator, menuElement });
    }, 1)
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
    if (['fixed', 'absolute', 'sticky'].includes(getComputedStyle(elem).position)) return elem
    return getPositionedAncestor(elem.parentElement)
  }

  function handleCloseControllerClick() {
    open = false
  }

  function getParentInstanceFromViewport(activatorParent: HTMLElement | undefined | null): {
    top: number
    left: number
    fixedParent?: HTMLElement,
    validStickyParent?: HTMLElement
  } {
    let top = 0
    let left = 0
    let fixedParent: HTMLElement | undefined = undefined
    let stickyParent: HTMLElement | undefined = !!activatorParent && getComputedStyle(activatorParent).position === 'sticky' ? activatorParent : undefined
    let isStickyValid: boolean = false

    while(!!activatorParent && activatorParent.nodeName.toLowerCase() !== 'html' && activatorParent.nodeName.toLowerCase() !== 'body') {
      const currentParent = activatorParent.parentElement
      if(!currentParent) break

      const computedStyle = getComputedStyle(currentParent)
      const position = computedStyle.position;
      const display = computedStyle.display;

      if((position === 'fixed' || position === 'absolute') && display === "flex") {
        const boundingClientRect = activatorParent.getBoundingClientRect();
        top = top + boundingClientRect.top
        left = left + boundingClientRect.left
        fixedParent = activatorParent
      }

      if(position === 'sticky') {
        stickyParent = activatorParent
      }

      if(position === 'relative' && !!stickyParent) {
        isStickyValid = true
      }

      activatorParent = activatorParent.parentElement

    }
    return { top, left, fixedParent, validStickyParent: isStickyValid ? stickyParent : undefined }
  }

  function refreshMenuPosition() {
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

  // TODO find a better way to update menu positions with animations
  $: if($sidebarOpened !== undefined) setTimeout(refreshMenuPosition, 300)
</script>

<svelte:window on:scroll={refreshMenuPosition} on:resize={refreshMenuPosition} ></svelte:window>

<div
  class="controller"
  data-operation="close"
  data-opening-id={openingId}
  data-uid={currentUid}
  on:click={handleCloseControllerClick}
  on:keypress={handleCloseControllerClick}
  bind:this={closeController}
  role="presentation"
  tabindex="-1"
></div>
{#if open}
  <div
    role="presentation"
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
    in:inAnimation|local={inAnimationConfig}
    out:outAnimation|local={outAnimationConfig}
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
