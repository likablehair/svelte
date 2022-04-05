<script lang="ts">
  import type { Item } from "./Navigator.svelte"

  export let title: string = "",
    items: Item[] = [],
    hideOnScroll: boolean = true,
    initialRemoveShadow: boolean = false,
    initialBackgroundColor: string = undefined,
    backgroundColor: string = 'white',
    color: string = undefined,
    mobileMenu: boolean = true

  let scrollY, lastScrollY, visible = true
  function handleScroll() {
    if(hideOnScroll) {
      if(scrollY > lastScrollY) {
        visible = false
      } else {
        visible = true
      }
    }

    lastScrollY = scrollY
  }

  export let openDrawer = false
  function toggleDrawer() {
    openDrawer = !openDrawer
  }


  let localBackgroundColor: string = undefined 
  $: if(scrollY == 0 && !!initialBackgroundColor)
    localBackgroundColor = initialBackgroundColor
  else
    localBackgroundColor = backgroundColor

  import Navigator from './Navigator.svelte'
  import Button from '$lib/buttons/Button.svelte'
  import Drawer from '$lib/navigation/Drawer.svelte'
</script>

<svelte:window
  bind:scrollY={scrollY}
  on:scroll={handleScroll}
></svelte:window>

{#if mobileMenu }
  <Drawer
    bind:open={openDrawer}
    backgroundColor={backgroundColor}
    items={items}
    on:item-click
  ></Drawer>
{/if}
<nav
  style:color={color}
  style:background-color={localBackgroundColor}
  style:position="sticky"
  style:display="flex"
  style:flex-wrap="wrap"
  style:align-items="center"
  style:height="56px"
  class="transition-all header-menu-container"
  class:-top-14={!visible}
  class:top-0={visible}
  class:shadow-md={!initialRemoveShadow || scrollY != 0}
>
  <div 
    style:height="56px"
    style:flex="none"
    style:display="flex"
    style:align-items="center"
  >
    <slot 
      name="prepend" 
      toggleDrawer={toggleDrawer} 
      openDrawer={openDrawer}
    >
      {#if mobileMenu}
        <div 
          style:width="fit-content"
          style:margin-left="10px"
          style:margin-right="10px"
          class="hide-on-desktop"
        >
          <Button
            type="icon"
            icon="mdi-menu"
            on:click={toggleDrawer}
          ></Button>
        </div>
      {/if}
    </slot>
  </div>
  <div 
    style:flex-grow="1"
    style:margin-left="4px"
  >
    <slot name="title">
      <span 
        style:font-size="24px"
        style:line-height="32px"
      >{title}</span>
    </slot>
  </div>
  <div>
    <slot name="menu-desktop">
      <div class="hide-on-mobile">
        <Navigator
          items={items}
          on:item-click
        ></Navigator>
      </div>
    </slot>
  </div>
  <slot name="append"></slot>
</nav>

<style>
  .header-menu-container {
    width: var(--width, 100vw)
  }

  .shadow-md {
    --shadow-color: #000;
    --ring-inset: inset;
    --ring-offset-width: 0px;
    --ring-color: rgb(255 255 255/0.1);
    --ring-offset-shadow: var(--ring-inset) 0 0 0 calc(1px + var(--ring-offset-width)) var(--ring-color);
    --ring-shadow: 0 0 #0000;
    --shadow: 0 0 #0000;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-colored: 0 4px 6px -1px var(--shadow-color), 0 2px 4px -2px var(--shadow-color);
    box-shadow: var(--ring-offset-shadow, 0 0 #0000), var(--ring-shadow, 0 0 #0000), var(--shadow);
  }

  .-top-14 {
    top: -56px;
  }

  .top-0 {
    top: 0;
  }

  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }

  .hide-on-mobile {
    visibility: visible !important;
  }

  .hide-on-desktop {
    visibility: visible !important;
  }

  @media (max-width: 767.98px) {
    .hide-on-mobile {
      visibility: hidden !important;
      display: none !important;
    }
  }

  @media (min-width: 768px){
    .hide-on-desktop {
      visibility: hidden !important;
      display: none !important;
    }
  }
</style>