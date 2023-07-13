<script lang="ts">
  import '../../../css/main.css'
  import './HeaderMenu.css'
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import Drawer from "$lib/components/simple/navigation/Drawer.svelte";
  import { createEventDispatcher } from 'svelte';

  let dispatch = createEventDispatcher<{
    'drawer-change': {
      opened: boolean
    }
  }>()

  export let title = "",
    hideOnScroll = true,
    initialRemoveShadow = false,
    color: string | undefined = undefined,
    mobileMenu = true,
    zIndex = 25;

  let scrollY: number,
    lastScrollY: number,
    visible = true;
  function handleScroll() {
    if (hideOnScroll) {
      if (scrollY > lastScrollY) {
        visible = false;
      } else {
        visible = true;
      }
    }

    lastScrollY = scrollY;
  }

  export let openDrawer = false;
  function toggleDrawer() {
    openDrawer = !openDrawer;
    dispatch('drawer-change', {
      opened: openDrawer
    })
  }
</script>

<svelte:window bind:scrollY on:scroll={handleScroll} />

<Drawer
  bind:open={openDrawer}
  on:item-click
>
  {#if !!$$slots.drawer}
    <slot name="drawer" />
  {/if}
</Drawer>
<nav
  style:color
  style:z-index={zIndex}
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
    <slot name="prepend" {toggleDrawer} {openDrawer}>
      <div
        style:width="fit-content"
        style:margin-left="10px"
        style:margin-right="10px"
        class:hide-on-desktop={!mobileMenu}
      >
        <Button 
          buttonType="icon" 
          icon="mdi-menu" 
          on:click={toggleDrawer} 
          --button-default-background-color="transparent"
        />
      </div>
    </slot>
  </div>
  <div style:flex-grow="1" style:margin-left="4px" style:align-items="center">
    <slot name="title">
      <span style:font-size="24px" style:line-height="32px">{title}</span>
    </slot>
  </div>
  <slot name="append" />
</nav>

<style>
  .header-menu-container {
    width: var(--header-menu-width, 100vw);
    position: sticky;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    height: var(--header-menu-height, 56px);
  }

  .shadow-md {
    box-shadow: 5px 10px 15px -5px rgb(var(--global-color-background-200));
  }

  .-top-14 {
    top: var(--header-menu-height, 56px);
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

  @media (min-width: 768px) {
    .hide-on-desktop {
      visibility: hidden !important;
      display: none !important;
    }
  }
</style>
