<script lang="ts">
  import '../../css/main.css'
  import './StableDividedSideBarLayout.css'
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte"
  import { createEventDispatcher } from "svelte";

  let clazz: {
    container?: string,
    header?: string,
    mainSection?: string,
    overlay?: string
  } = {};
	export { clazz as class };

  /*
    Styles:

    --stable-divided-side-bar-layout-content-padding
    --stable-divided-side-bar-layout-side-bar-width
    --stable-divided-side-bar-layout-side-bar-border-color
    --stable-divided-side-bar-layout-side-bar-padding
    --stable-divided-side-bar-layout-header-menu-height
    --stable-divided-side-bar-layout-header-menu-border-color
    --stable-divided-side-bar-layout-header-menu-padding
    --stable-divided-side-bar-layout-inner-header-menu-background-color
    --stable-divided-side-bar-layout-drawer-background-color
    --stable-divided-side-bar-layout-drawer-width
  */

  export let drawerOpened: boolean = false

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
    class={clazz.container || ''}
  >
    <header 
      class:opened={drawerOpened}
      class="side-bar {clazz.header}"
    >
      <div 
        class:opened-drawer={drawerOpened}
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
      </div>
      <div class="side-bar-content">
        <slot name="sidebar" hamburgerVisible={mAndDown}>
          Sidebar
        </slot>
      </div>
    </header>
    <div class="main-section {clazz.mainSection || ''}">
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
      --stable-divided-side-bar-layout-side-bar-width, 
      var(--stable-divided-side-bar-layout-default-side-bar-width)
    );
    border-right: 1px solid var(
      --stable-divided-side-bar-layout-side-bar-border-color,
      var(--stable-divided-side-bar-layout-default-side-bar-border-color)
    );
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(
      --stable-divided-side-bar-layout-side-bar-padding,
      var(--stable-divided-side-bar-layout-default-side-bar-padding)
    );
    z-index: 10;
  }

  .overlay {
    display: none;
  }

  .content {
    padding: var(
      --stable-divided-side-bar-layout-content-padding,
      var(--stable-divided-side-bar-layout-default-content-padding)
    );
  }

  @media (max-width: 1024px) {
  	.side-bar {
      left: calc(0rem - var(
          --stable-divided-side-bar-layout-drawer-width,
          var(--stable-divided-side-bar-layout-default-drawer-width)
        )
      );
      right: auto;
      transition-property: left;
      transition-timing-function: cubic-bezier(.4,0,.2,1);
      transition-duration: .5s;
      top: var(--stable-divided-side-bar-layout-header-menu-height,
        var(--stable-divided-side-bar-layout-default-header-menu-height)
      );
      background-color: var(
        --stable-divided-side-bar-layout-drawer-background-color,
        var(--stable-divided-side-bar-layout-default-drawer-background-color)
      );
      bottom: 0;
      z-index: 30;
      width: var(
        --stable-divided-side-bar-layout-drawer-width,
        var(--stable-divided-side-bar-layout-default-drawer-width)
      );
      max-width: 100vw;
    }

    .side-bar.opened {
      left: 0;
    }

    .overlay {
      position: fixed;
      top: var(
        --stable-divided-side-bar-layout-header-menu-height,
        var(--stable-divided-side-bar-layout-default-header-menu-height)
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
      --stable-divided-side-bar-layout-header-menu-height,
      var(--stable-divided-side-bar-layout-default-header-menu-height)
    );
    left: var(
      --stable-divided-side-bar-layout-side-bar-width,
      var(--stable-divided-side-bar-layout-default-side-bar-width)
    );
    border-bottom: 1px solid var(
      --stable-divided-side-bar-layout-header-menu-border-color,
      var(--stable-divided-side-bar-layout-default-header-menu-border-color)
    );
    backdrop-filter: blur(4px);
    background-color: var(
      --stable-divided-side-bar-layout-inner-header-menu-background-color,
      var(--stable-divided-side-bar-layout-default-inner-header-menu-background-color)
    );
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
    padding-left: var(
      --stable-divided-side-bar-layout-side-bar-width,
      var(--stable-divided-side-bar-layout-default-side-bar-width)
    );
    padding-top: var(
      --stable-divided-side-bar-layout-header-menu-height,
      var(--stable-divided-side-bar-layout-default-header-menu-height,)
    );
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
    padding: var(
      --stable-divided-side-bar-layout-header-menu-padding,
      var(--stable-divided-side-bar-layout-default-header-menu-padding)
    );
    background-color: var(
      --stable-divided-side-bar-layout-inner-header-menu-background-color,
      var(--stable-divided-side-bar-layout-default-inner-header-menu-background-color)
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