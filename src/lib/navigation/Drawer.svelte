<script lang="ts">
  import Navigator from '$lib/navigation/Navigator.svelte'
  import type { Item } from '$lib/navigation/Navigator.svelte'

  export let open: boolean = false,
    position: 'left' | 'top' | 'right' | 'bottom' = 'left',
    space: string = '200px',
    openingSpeed: string = '0.3s',
    overlaySpeed: string = '0.2s',
    overlay: boolean = true,
    backgroundColor: string = undefined,
    overlayColor: string = '#282828',
    overlayOpacity: string = '30%',
    zIndex: number = 30,
    items: Item[] = []

  let height: string = undefined,
    width: string = undefined,
    top: string = undefined,
    bottom: string = undefined,
    left: string = undefined,
    right: string = undefined

  function handleClickOverlay() {
    open = false
  }

  $: if(position == 'left') {
    height = '100vh'
    width = space
    top = '0px'
    bottom = undefined
    right = undefined

    if(open) {
      left = `0px`
    } else {
      left = `-${space}`
    }
  } else if(position == 'right') {
    height = '100vh'
    width = space
    top = '0px'
    bottom = undefined
    left = 'auto'

    if(open) {
      right = `0px`
    } else {
      right = `calc(0vw - ${space})`
    }
  } else if(position == 'top') {
    height = space
    width = '100vw'
    bottom = undefined
    left = '0px'
    right = undefined

    if(open) {
      top = `0px`
    } else {
      top = `-${space}`
    }
  } else if(position == 'bottom') {
    height = space
    width = '100vw'
    top = 'auto'
    left = '0px'
    right = undefined

    if(open) {
      bottom = `0px`
    } else {
      bottom = `calc(0vh - ${space})`
    }
  }

</script>

<div
  style:--drawer-opening-speed={openingSpeed}
  style:position="absolute"
  style:height={height}
  style:width={width}
  style:top={top}
  style:bottom={bottom}
  style:left={left}
  style:right={right}
  style:background-color={backgroundColor}
  style:z-index={zIndex}
  class:animate-left={position == 'left'}
  class:animate-right={position == 'right'}
  class:animate-bottom={position == 'bottom'}
  class:animate-top={position == 'top'}
>
  <slot {open}>
    <div
      style:display="flex"
      style:justify-content="center"
      style:align-items="center"
      style:margin-top={position == 'left' || position == 'right' ? '10px' : '0px'}
      style:height={position == 'top' || position == 'bottom' ? '100%' : 'fit-content'}
    >
      <Navigator
        items={items}
        vertical={position == 'right' || position == 'left'}
        on:item-click
      ></Navigator>
    </div>
  </slot>
</div>
{#if overlay}
  <div
    on:click={handleClickOverlay}
    style:z-index={open ? zIndex - 1 : -5}
    style:position="absolute"
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
  ></div>
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