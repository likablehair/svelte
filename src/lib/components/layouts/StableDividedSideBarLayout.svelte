<script lang="ts">
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte"
  import { createEventDispatcher } from "svelte";

  export let sideBarWidth: string = "18rem",
    sideBarBorderColor: string = "hsl(0deg 0% 39.85% / 50%)",
    sideBarPadding: string = "1rem 1.5rem 2rem 1.5rem",
    headerMenuHeight: string = "3.5rem",
    headerMenuBorderColor: string = "hsl(0deg 0% 39.85% / 50%)",
    headerMenuPadding: string = "0rem 2rem 0rem 2rem",
    padding: string = "1rem 2rem 1rem 2rem",
    innerHeaderMenuBackgroundColor: string = "rgb(255 255 255/0.5)",
    drawerBackgroundColor: string = "white",
    drawerWidth: string = "24rem",
    drawerOpened: boolean = false

  let dispatch = createEventDispatcher<{
    'drawer-change': {
      opened: boolean
    },
  }>()

  function toggleMenu() {
    drawerOpened = !drawerOpened
    dispatch('drawer-change', { opened: drawerOpened })
  }

  function handleOverlayClick() {
    drawerOpened = false
    dispatch('drawer-change', { opened: drawerOpened })
  }
</script>

<MediaQuery let:mAndDown>
  <div
    style:--stable-divider-side-bar-layout-side-bar-width={sideBarWidth}
    style:--stable-divider-side-bar-layout-side-bar-border-color={sideBarBorderColor}
    style:--stable-divider-side-bar-layout-side-bar-padding={sideBarPadding}
    style:--stable-divider-side-bar-layout-header-menu-height={headerMenuHeight}
    style:--stable-divider-side-bar-layout-header-menu-border-color={headerMenuBorderColor}
    style:--stable-divider-side-bar-layout-header-menu-padding={headerMenuPadding}
    style:--stable-divider-side-bar-layout-inner-header-menu-background-color={innerHeaderMenuBackgroundColor}
    style:--stable-divider-side-bar-layout-drawer-background-color={drawerBackgroundColor}
    style:--stable-divider-side-bar-layout-drawer-width={drawerWidth}
  >
    <header 
      class="side-bar"
      class:opened={drawerOpened}
    >
      <div 
        class="header-toolbar"
        class:opened-drawer={drawerOpened}
      >
        <slot name="menu">
          <div class="inner-menu">
            {#if mAndDown}
              <div style:margin-right="2rem">
                <Icon 
                  name="mdi-menu" 
                  click
                  on:click={toggleMenu}
                ></Icon>
              </div>
            {/if}
            <slot name="inner-menu" hamburgerVisible={mAndDown}>
              Menu
            </slot>
          </div>
        </slot>
      </div>
      <div class="side-bar-content">
        <slot name="sidebar" hamburgerVisible={mAndDown}>
          Sidebar
        </slot>
      </div>
    </header>
    <div class="main-section">
      <div 
        class="overlay"
        on:click={handleOverlayClick}
        on:keypress={handleOverlayClick}
        class:visible={drawerOpened}
      ></div>
      <div
        style:padding={padding}
        class:blurred={drawerOpened}
      >
        <slot>Content</slot>
      </div>
    </div>
  </div>
</MediaQuery>


<style>
  .side-bar {
    position: fixed;
    width: var(--stable-divider-side-bar-layout-side-bar-width);
    border-right: 1px solid var(--stable-divider-side-bar-layout-side-bar-border-color);
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--stable-divider-side-bar-layout-side-bar-padding);
    z-index: 10;
  }

  .overlay {
    display: none;
  }

  @media (max-width: 1024px) {
  	.side-bar {
      left: calc(0rem - var(--stable-divider-side-bar-layout-drawer-width));
      right: auto;
      transition-property: left;
      transition-timing-function: cubic-bezier(.4,0,.2,1);
      transition-duration: .5s;
      top: var(--stable-divider-side-bar-layout-header-menu-height);
      background-color: var(--stable-divider-side-bar-layout-drawer-background-color);
      bottom: 0;
      z-index: 30;
      width: var(--stable-divider-side-bar-layout-drawer-width);
      max-width: 100vw;
    }

    .side-bar.opened {
      left: 0;
    }

    .overlay {
      position: fixed;
      top: var(--stable-divider-side-bar-layout-header-menu-height);
      left: 0;
      bottom: 0;
      right: 0;
      z-index: -100;
      transition-property: backdrop-filter;
      transition-timing-function: cubic-bezier(.4,0,.2,1);
      transition-duration: .15s;
      display: block;
    }

    .overlay.visible {
      background-color: hsla(240,5%,65%,.2);
      backdrop-filter: blur(4px);
      z-index: 20;
    }
  }

  .header-toolbar {
    position: fixed;
    height: var(--stable-divider-side-bar-layout-header-menu-height);
    left: var(--stable-divider-side-bar-layout-side-bar-width);
    border-bottom: 1px solid var(--stable-divider-side-bar-layout-header-menu-border-color);
    backdrop-filter: blur(4px);
    background-color: var(--stable-divider-side-bar-layout-inner-header-menu-background-color);
    transition-property: background-color;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: .5s;
    right: 0;
    top: 0;
  }

  @media (max-width: 1024px) {
  	.header-toolbar {
      left: 0;
    }

    .header-toolbar.opened-drawer {
      background-color: inherit;
    }

    .header-toolbar:hover {
      background-color: inherit;
    }
  }

  .main-section {
    padding-left: var(--stable-divider-side-bar-layout-side-bar-width);
    padding-top: var(--stable-divider-side-bar-layout-header-menu-height);
  }

  @media (max-width: 1024px) {
  	.main-section {
      padding-left: 0;
    }

    .blurred {
      backdrop-filter: blur(4px);
    }
  }

  .inner-menu {
    padding: var(--stable-divider-side-bar-layout-header-menu-padding);
    background-color: var(--stable-divider-side-bar-layout-inner-header-menu-background-color);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  * {
    box-sizing: border-box;
    border: 0 solid #e5e7eb;
  }

</style>