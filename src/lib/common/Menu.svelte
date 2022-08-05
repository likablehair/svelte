<script lang="ts">
  import { v4 as uuidv4 } from 'uuid';
  import { 
    fly, 
    type FadeParams, 
    type FlyParams, 
    type SlideParams, 
    type TransitionConfig 
  } from 'svelte/transition'

  export let open: boolean = false,
    top: number = undefined,
    left: number = undefined,
    width: string,
    height: string,
    maxHeight: string = undefined,
    overflow: string = "auto",
    refreshPosition: boolean = false,
    boxShadow: string = undefined,
    borderRadius: string = undefined,
    activator: HTMLElement = undefined,
    anchor: 'bottom' | 'bottom-center' = 'bottom',
    closeOnClickOutside: boolean = false,
    inAnimation: (node: Element, params?: SlideParams | FlyParams | FadeParams) => TransitionConfig = fly,
    inAnimationConfig: SlideParams | FlyParams | FadeParams = {
      duration: 100,
      y: 10
    },
    outAnimation: (node: Element, params?: SlideParams | FlyParams | FadeParams) => TransitionConfig = fly,
    outAnimationConfig: SlideParams | FlyParams | FadeParams = {
      duration: 100,
      y: 10
    },
    menuElement: HTMLElement = undefined

  let zIndex = 50, 
    currentUid: string = uuidv4()


  function calculateMenuPosition(params: { activator: HTMLElement, menuElement: HTMLElement }) {
    if(!!params.menuElement) {
      if(!!params.activator) {
        if(anchor == 'bottom') {
          let { left: activatorLeft, top: activatorTop } = params.activator.getBoundingClientRect()
          let activatorHeight = params.activator.offsetHeight
          top = activatorTop + window.scrollY + activatorHeight
          left = activatorLeft + window.scrollX
        } else if(anchor == 'bottom-center') {
          let { left: activatorLeft, top: activatorTop } = params.activator.getBoundingClientRect()
          let activatorHeight = params.activator.offsetHeight
          let activatorWidth = params.activator.offsetWidth
          let menuWidth = params.menuElement.offsetWidth
          top = activatorTop + window.scrollY + activatorHeight
          left = activatorLeft + window.scrollX
          if(menuWidth > activatorWidth) {
            left = left - ((menuWidth - activatorWidth) / 2)
          } else {
            left = left - ((activatorWidth - menuWidth) / 2)
          }
        }
      }

      if((window.innerWidth + window.scrollX) < (left + menuElement.offsetWidth)) {
        left = Math.max((window.innerWidth + window.scrollX) - menuElement.offsetWidth, 0)
      }
    }
  }

  $: if(open) {
    let otherMenus: NodeListOf<HTMLElement> = document.querySelectorAll("[data-menu=true]")
    let otherDialogs: NodeListOf<HTMLElement> = document.querySelectorAll("[data-dialog=true]")
    
    let maxZIndex: number = undefined
    if(otherDialogs.length > 0) {
      otherDialogs.forEach((dialog) => {
        if(!maxZIndex || maxZIndex < Number(dialog.style.zIndex))
          maxZIndex = Number(dialog.style.zIndex)
      })
    }

    if(otherMenus.length > 0) {
      let maxZIndex: number
      otherMenus.forEach((menu) => {
        if(!maxZIndex || maxZIndex < Number(menu.style.zIndex))
          maxZIndex = Number(menu.style.zIndex)
      })
    }

    calculateMenuPosition({ activator, menuElement })

    if(!!maxZIndex) zIndex = maxZIndex + 2
  }
  $: if(!!width) {
    calculateMenuPosition({ activator, menuElement})
  }
  $: if(refreshPosition) {
    calculateMenuPosition({ activator, menuElement})
    refreshPosition = false
  }
  $: if(closeOnClickOutside && !!menuElement) {
    window.addEventListener('click', (event) => {
      open = false
    })

    if(!!activator) {
      activator.addEventListener('click', (event) => {
        event.stopPropagation()
      })  
    }

    menuElement.addEventListener('click', (event) => {
      event.stopPropagation()
    })
  }
</script>

{#if open}  
  <div
    bind:this={menuElement}
    data-menu
    data-uid={currentUid}
    style:z-index={zIndex}
    style:position="absolute"
    style:top={top + "px"}
    style:box-shadow={boxShadow}
    style:border-radius={borderRadius}
    style:left={left + "px"}
    style:height={height}
    style:max-height={maxHeight}
    style:width={width}
    style:overflow={overflow}
    in:inAnimation={inAnimationConfig}
    out:outAnimation={outAnimationConfig}
  >
    <slot></slot>
  </div>
{/if}