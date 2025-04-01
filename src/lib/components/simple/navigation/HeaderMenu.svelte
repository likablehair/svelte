<script lang="ts">
  import '../../../css/main.css'
  import './HeaderMenu.css'
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import { Drawer } from '$lib';
  import type { ComponentProps, Snippet } from 'svelte';

  interface Props {
    openDrawer?: boolean
    title?: string;
    hideOnScroll?: boolean;
    initialRemoveShadow?: boolean;
    color?: string;
    mobileMenu?: boolean;
    zIndex?: number;
    ondrawerChange?: (event: {
      detail: {
        opened: boolean
      }
    }) => void
    drawerSnippet?: Snippet<[]>
    titleSnippet?: Snippet<[]>
    appendSnippet?: Snippet<[]>
    prependSnippet?: Snippet<[{
      toggleDrawer: () => void,
      openDrawer: boolean
    }]>
    onitemClick?: ComponentProps<typeof Drawer>['onitemClick']
  }

  let {
    openDrawer = $bindable(false),
    title = "",
    hideOnScroll = true,
    initialRemoveShadow = false,
    color = undefined,
    mobileMenu = true,
    zIndex = 25,
    ondrawerChange,
    drawerSnippet,
    appendSnippet,
    prependSnippet,
    titleSnippet,
    onitemClick,
  }: Props = $props();

  let scrollY: number | undefined = $state(),
    lastScrollY: number,
    visible = $state(true);
  function handleScroll() {
    if(scrollY){
      if (hideOnScroll) {
        if (scrollY > lastScrollY) {
          visible = false;
        } else {
          visible = true;
        }
      }

      lastScrollY = scrollY;
    }
  }

  function toggleDrawer() {
    openDrawer = !openDrawer;
    if(ondrawerChange) {
      ondrawerChange({
        detail: {
          opened: openDrawer
        }
      })
    }
  }
</script>

<svelte:window bind:scrollY on:scroll={handleScroll} />

<Drawer
  bind:open={openDrawer}
  {onitemClick}
>
  {@render drawerSnippet?.()}
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
    {#if prependSnippet}
      {@render prependSnippet({ toggleDrawer, openDrawer })}
    {:else}
      <div
        style:width="fit-content"
        style:margin-left="10px"
        style:margin-right="10px"
        class:hide-on-desktop={!mobileMenu}
      >
        <Button 
          buttonType="icon" 
          icon="mdi-menu" 
          onclick={toggleDrawer} 
          --button-default-background-color="transparent"
        />
      </div>
    {/if}
  </div>
  <div style:flex-grow="1" style:margin-left="4px" style:align-items="center">
    {#if titleSnippet}
      {@render titleSnippet()}
    {:else}
      <span style:font-size="24px" style:line-height="32px">{title}</span>
    {/if}
  </div>
  {@render appendSnippet?.()}
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

  .hide-on-desktop {
    visibility: visible !important;
  }

  @media (min-width: 768px) {
    .hide-on-desktop {
      visibility: hidden !important;
      display: none !important;
    }
  }
</style>
