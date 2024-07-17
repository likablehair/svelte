<script lang="ts">
  import '../../css/main.css'
  import './UnstableDividedSideBarLayout.css'
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte"
  import { createEventDispatcher } from "svelte";
  import { clickOutside } from '$lib/utils/clickOutside';
  import ColorInvertedSelector, { type Option } from '../simple/lists/ColorInvertedSelector.svelte';
  import { sidebarOpened } from '$lib/stores/layouts/unstableSidebarOpened';

  let clazz: {
    container?: string,
    header?: string,
    mainSection?: string,
    overlay?: string
  } = {};
	export { clazz as class };

  export let drawerOpened: boolean = false,
    expandOn: 'hover' | 'click' | 'none' = 'hover',
    options: Option[] = [],
    selectedIndex: number | undefined = undefined,
    sidebarExpanded: boolean = false

  let dispatch = createEventDispatcher<{
    'drawer-change': {
      opened: boolean
    },
    'menu-select': {
      option: Option
    }
  }>()

  function toggleMenu() {
    drawerOpened = !drawerOpened
    dispatch('drawer-change', { opened: drawerOpened })
  }

  function handleOverlayClick() {
    drawerOpened = false
    dispatch('drawer-change', { opened: drawerOpened })
  }

  function handleMenuSelection(option: Option) {
    sidebarExpanded = false
    drawerOpened = false
    dispatch('drawer-change', { opened: drawerOpened })
    dispatch('menu-select', {
      option: option
    })
  }

  $: $sidebarOpened = sidebarExpanded
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
      class:opened={(mAndDown && drawerOpened) || sidebarExpanded}
      on:mouseleave={() => {if(expandOn == 'hover') sidebarExpanded = false}}
      on:mouseenter={() => {if(expandOn == 'hover') sidebarExpanded = true}}
      on:click={() => {if(expandOn == 'click' && !mAndDown) sidebarExpanded = true}}
      on:keypress={() => {if(expandOn == 'click' && !mAndDown) sidebarExpanded = true}}
      use:clickOutside 
      on:clickoutside={() => {if(expandOn == 'click') sidebarExpanded = false}}
      class="side-bar {clazz.header || ''}"
      role="presentation"
      tabindex="-1"
    >
      <div class="side-bar-content">
        <slot name="sidebar" hamburgerVisible={mAndDown} {sidebarExpanded}>
          <div class="sidebar-container">
            <div class="logo-and-menu">
              <slot name="logo" hamburgerVisible={mAndDown} {sidebarExpanded}>
                <div class="logo">logo</div>
              </slot>
              <slot name="menu" hamburgerVisible={mAndDown} {sidebarExpanded}>
                <div 
                  class="menu-container"
                  class:expanded={sidebarExpanded}
                >
                  <ColorInvertedSelector
                    options={options}
                    selectedIndex={selectedIndex}
                    --color-inverted-selector-default-background-color="transparent"
                    --color-inverted-selector-default-font-size="1.2rem"
                    --color-inverted-selector-default-icon-gap="1.2rem"
                    --color-inverted-selector-default-element-height="3rem"
                    --color-inverted-selector-default-element-padding="8px 8px 8px 11px"
                    --color-inverted-selector-default-element-border-radius="16px"
                    --color-inverted-selector-default-selected-font-weight="400"
                    --icon-default-size="1.3rem"
                    deletable={false}
                    on:select={(e) => handleMenuSelection(e.detail.option)}
                  >
                    <svelte:fragment slot="before-prepend" let:option let:index>
                      <slot name="before-prepend" {option} {index}></slot>
                    </svelte:fragment>
                    <svelte:fragment slot="after-prepend" let:option let:index>
                      <slot name="after-prepend" {option} {index}></slot>
                    </svelte:fragment>
                  </ColorInvertedSelector>
                </div>
              </slot>
            </div>
            <slot name="user" hamburgerVisible={mAndDown} {sidebarExpanded}>
            </slot>
          </div>
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
        role="presentation"
        tabindex="-1"
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
    border-right: var(
      --unstable-divided-side-bar-layout-side-bar-border,
      var(--unstable-divided-side-bar-layout-default-side-bar-border)
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
    overflow: clip;
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
      transition-property: all;
      transition-timing-function: cubic-bezier(.4,0,.2,1);
      transition-duration: .15s;
      display: block;
    }

    .overlay.visible {
      background-color: rgb(var(--global-color-grey-900), .5);
      backdrop-filter: blur(4px);
      z-index: 20;
    }
  }

  .header-toolbar {
    position: var(
      --unstable-divided-side-bar-layout-header-menu-position,
      var(--unstable-divided-side-bar-layout-default-header-menu-position)
    );
    height: var(
      --unstable-divided-side-bar-layout-header-menu-height,
      var(--unstable-divided-side-bar-layout-default-header-menu-height)
    );
    left: var(
      --unstable-divided-side-bar-layout-side-bar-width,
      var(--unstable-divided-side-bar-layout-default-side-bar-width)
    );
    border-bottom: var(
      --unstable-divided-side-bar-layout-header-menu-border,
      var(--unstable-divided-side-bar-layout-default-header-menu-border)
    );
    backdrop-filter: var(
      --unstable-divided-side-bar-layout-header-menu-backdrop-filter,
      var(--unstable-divided-side-bar-layout-default-header-menu-backdrop-filter)
    );
    background-color: var(
      --unstable-divided-side-bar-layout-inner-header-menu-background-color,
      rgb(var(--unstable-divided-side-bar-layout-default-inner-header-menu-background-color), .5)
    );
    transition-property: background-color left;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: .2s;
    right: 0;
    top: 0;
    z-index: 10;
  }
  

  @media (max-width: 1024px) {
    .header-toolbar {
      left: 0;
    }

    .header-toolbar.opened-drawer {
      background-color: var(
        --unstable-divided-side-bar-layout-inner-header-menu-background-color,
        rgb(var(--unstable-divided-side-bar-layout-default-inner-header-menu-background-color))
      );
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
      --unstable-divided-side-bar-layout-content-padding-left,
      var(
        --unstable-divided-side-bar-layout-side-bar-width,
        var(--unstable-divided-side-bar-layout-default-side-bar-width)
      )
    );
    padding-top: var(
      --unstable-divided-side-bar-layout-content-padding-top,
      var(
        --unstable-divided-side-bar-layout-header-menu-height,
        var(--unstable-divided-side-bar-layout-default-header-menu-height,)
      )
    );
    transition: all .2s cubic-bezier(.4,0,.2,1);
  }

  .menu-container {
    transition: padding .2s cubic-bezier(0.075, 0.82, 0.165, 1);
  }

  @media (max-width: 1024px) {
    .main-section {
      padding-left: 0;
    }

    .blurred {
      backdrop-filter: blur(4px);
    }

    .sidebar-container {
      height: calc(100dvh - 3.5rem);
    }

    .logo {
      display: none;
    }
  }

  @media (min-width: 1024.1px) {
    .main-section.opened {
      padding-left: var(
        --unstable-divided-side-bar-layout-side-bar-hover-width, 
        var(--unstable-divided-side-bar-layout-default-side-bar-hover-width)
      );
    }

    .menu-container.expanded {
      padding: 1rem;
    }

    .sidebar-container {
      height: 100dvh;
    }
  }

  .inner-menu {
    padding: var(
      --unstable-divided-side-bar-layout-header-menu-padding,
      var(--unstable-divided-side-bar-layout-default-header-menu-padding)
    );
    background-color: var(
      --unstable-divided-side-bar-layout-inner-header-menu-background-color,
      rgb(var(--unstable-divided-side-bar-layout-default-inner-header-menu-background-color), .5)
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

  .sidebar-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: space-between;
  }

  .logo-and-menu {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .logo {
    height: 3.5rem;
  }
</style>