<script lang="ts">
  import '../../css/main.css'
  import './UnstableDividedSideBarLayout.css'
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte"
  import { createEventDispatcher } from "svelte";
  import { clickOutside } from '$lib/utils/clickOutside';

  let clazz: {
    container?: string,
    header?: string,
    mainSection?: string,
    overlay?: string
  } = {};
	export { clazz as class };

  /*
    Styles:

    --unstable-divided-side-bar-layout-content-padding
    --unstable-divided-side-bar-layout-side-bar-width
    --unstable-divided-side-bar-layout-side-bar-border-color
    --unstable-divided-side-bar-layout-side-bar-padding
    --unstable-divided-side-bar-layout-header-menu-height
    --unstable-divided-side-bar-layout-header-menu-border-color
    --unstable-divided-side-bar-layout-header-menu-padding
    --unstable-divided-side-bar-layout-inner-header-menu-background-color
    --unstable-divided-side-bar-layout-drawer-background-color
    --unstable-divided-side-bar-layout-drawer-width
  */

  export let drawerOpened: boolean = false,
    expandOn: 'hover' | 'click' | 'none' = 'hover'

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


  let sidebarExpanded: boolean = false
</script>

<MediaQuery let:mAndDown>
  <div
    class={clazz.container || ''}
  >
    <nav 
      class:opened-drawer={drawerOpened}
      class:opened={sidebarExpanded}
      class="header-toolbar"
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
    </nav>
    <header
      class:opened={drawerOpened || sidebarExpanded}
      on:mouseleave={() => {if(expandOn == 'hover') sidebarExpanded = false}}
      on:mouseenter={() => {if(expandOn == 'hover') sidebarExpanded = true}}
      on:click={() => {if(expandOn == 'click') sidebarExpanded = true}}
      on:keypress={() => {if(expandOn == 'click') sidebarExpanded = true}}
      use:clickOutside 
      on:clickoutside={() => {if(expandOn == 'click') sidebarExpanded = false}}
      class="side-bar {clazz.header}"
    >
      <div class="side-bar-content">
        <slot name="sidebar" hamburgerVisible={mAndDown}>
          Sidebar
        </slot>
      </div>
    </header>
    <div 
      class="main-section {clazz.mainSection || ''}"
      class:opened={sidebarExpanded}
    >
      <div 
        on:click={handleOverlayClick}
        on:keypress={handleOverlayClick}
        class:visible={drawerOpened}
        class="overlay {clazz.overlay || ''}"
      ></div>
      <div
        class="content"
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
    width: var(
      --unstable-divided-side-bar-layout-side-bar-width, 
      var(--unstable-divided-side-bar-layout-default-side-bar-width)
    );
    border-right: 1px solid var(
      --unstable-divided-side-bar-layout-side-bar-border-color,
      var(--unstable-divided-side-bar-layout-default-side-bar-border-color)
    );
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(
      --unstable-divided-side-bar-layout-side-bar-padding,
      var(--unstable-divided-side-bar-layout-default-side-bar-padding)
    );
    z-index: 10;
    overflow: auto;
    transition: all .2s cubic-bezier(.4,0,.2,1);
  }

  @media (min-width: 1024.1px) {
    .side-bar.opened {
      width: var(
        --unstable-divided-side-bar-layout-side-bar-hover-width, 
        var(--unstable-divided-side-bar-layout-default-side-bar-hover-width)
      );
    }
  }

  .overlay {
    display: none;
  }

  .content {
    padding: var(
      --unstable-divided-side-bar-layout-content-padding,
      var(--unstable-divided-side-bar-layout-default-content-padding)
    );
  }

  @media (max-width: 1024px) {
  	.side-bar {
      left: calc(0rem - var(
          --unstable-divided-side-bar-layout-drawer-width,
          var(--unstable-divided-side-bar-layout-default-drawer-width)
        )
      );
      right: auto;
      transition-property: left;
      transition-timing-function: cubic-bezier(.4,0,.2,1);
      transition-duration: .5s;
      top: var(--unstable-divided-side-bar-layout-header-menu-height,
        var(--unstable-divided-side-bar-layout-default-header-menu-height)
      );
      background-color: var(
        --unstable-divided-side-bar-layout-drawer-background-color,
        var(--unstable-divided-side-bar-layout-default-drawer-background-color)
      );
      bottom: 0;
      z-index: 30;
      width: var(
        --unstable-divided-side-bar-layout-drawer-width,
        var(--unstable-divided-side-bar-layout-default-drawer-width)
      );
      max-width: 100vw;
    }

    .side-bar.opened {
      left: 0;
    }

    .overlay {
      position: fixed;
      top: var(
        --unstable-divided-side-bar-layout-header-menu-height,
        var(--unstable-divided-side-bar-layout-default-header-menu-height)
      );
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
    height: var(
      --unstable-divided-side-bar-layout-header-menu-height,
      var(--unstable-divided-side-bar-layout-default-header-menu-height)
    );
    left: var(
      --unstable-divided-side-bar-layout-side-bar-width,
      var(--unstable-divided-side-bar-layout-default-side-bar-width)
    );
    border-bottom: 1px solid var(
      --unstable-divided-side-bar-layout-header-menu-border-color,
      var(--unstable-divided-side-bar-layout-default-header-menu-border-color)
    );
    backdrop-filter: blur(4px);
    background-color: var(
      --unstable-divided-side-bar-layout-inner-header-menu-background-color,
      var(--unstable-divided-side-bar-layout-default-inner-header-menu-background-color)
    );
    transition-property: background-color left;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: .2s;
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

  @media (min-width: 1024.1px) {
    .header-toolbar.opened {
      left: var(
        --unstable-divided-side-bar-layout-side-bar-hover-width, 
        var(--unstable-divided-side-bar-layout-default-side-bar-hover-width)
      );
    }
  }

  .main-section {
    padding-left: var(
      --unstable-divided-side-bar-layout-side-bar-width,
      var(--unstable-divided-side-bar-layout-default-side-bar-width)
    );
    padding-top: var(
      --unstable-divided-side-bar-layout-header-menu-height,
      var(--unstable-divided-side-bar-layout-default-header-menu-height,)
    );
    transition: all .2s cubic-bezier(.4,0,.2,1);
  }

  @media (max-width: 1024px) {
  	.main-section {
      padding-left: 0;
    }

    .blurred {
      backdrop-filter: blur(4px);
    }
  }

  @media (min-width: 1024.1px) {
    .main-section.opened {
      padding-left: var(
        --unstable-divided-side-bar-layout-side-bar-hover-width, 
        var(--unstable-divided-side-bar-layout-default-side-bar-hover-width)
      );
    }
  }

  .inner-menu {
    padding: var(
      --unstable-divided-side-bar-layout-header-menu-padding,
      var(--unstable-divided-side-bar-layout-default-header-menu-padding)
    );
    background-color: var(
      --unstable-divided-side-bar-layout-inner-header-menu-background-color,
      var(--unstable-divided-side-bar-layout-default-inner-header-menu-background-color)
    );
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