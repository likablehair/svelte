<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import CollapsibleDivider from "../simple/common/CollapsibleDivider.svelte";
    import Icon from "../simple/media/Icon.svelte";
    import MediaQuery from "../simple/common/MediaQuery.svelte";

    type MenuElement = {
      id: string,
      name: string,
      icon: string
    }

    type Spacer = {
      divider: boolean,
      marginTop: string,
      marginBottom: string
    }

    type MenuItem = MenuElement | Spacer

    export let _pagePadding: string = "20px 0 0 30px",
      _menuElementMarginBottom: string = "30px",
      _menuElementFontSize: string = "1.1rem",
      _menuElementFontWeight: string = "400",
      _menuColor: string = "#454444",
      _selectedMenuColor: string = "#0b66cc",
      _expandedSideBarWidth: string = "16rem",
      _collapsedSideBarWidth: string = "4.6rem",
      _headerHeight: string = "80px",
      _collapseTransitionTime: string = "0.4s",
      _sideBarBackgroundColor: string = "white",
      _overlayColor: string = "hsla(240,5%,65%,.2)",
      _headerBackgroundColor: string = "#FFFF",
      _dividersColor: string = '#d2d2d2'

    export let drawerOpened: boolean = false,
      drawerCollapsed: boolean = false,
      menuItems: MenuItem[] = [],
      menuIconsSize: number = 16,
      selectedMenuElementId: string | undefined = undefined,
      fullLogo: string | undefined = undefined,
      partialLogo: string | undefined = undefined,
      openedHeader: boolean = false

    let dispatch = createEventDispatcher<{
      'collapse': {
        collapsed: boolean
      },
      'drawer-change': {
        opened: boolean
      },
      'menu-click': {
        menu: MenuElement
      }
    }>()

    function toggleMenu() {
      drawerOpened = !drawerOpened
      dispatch('drawer-change', { opened: drawerOpened })
    }

    function toggleExpansion() {
      drawerCollapsed = !drawerCollapsed
    }

    function handleMenuClick(menu: MenuItem) {
      if('id' in menu) {
        selectedMenuElementId = menu.id
        dispatch('menu-click', { menu: menu })
      }
    }

    function handleOverlayClick() {}

    $: if(drawerOpened) drawerCollapsed = false
</script>

<MediaQuery let:mAndDown>
  <div
    style:--collapsible-side-bar-layout-expanded-width={_expandedSideBarWidth}
    style:--collapsible-side-bar-layout-header-height={openedHeader || mAndDown ? _headerHeight : "0px"}
    style:--collapsible-side-bar-layout-collapsed-width={_collapsedSideBarWidth}
    style:--collapsible-side-bar-layout-collapse-transition-time={_collapseTransitionTime}
    style:--collapsible-side-bar-layout-menu-element-margin-bottom={_menuElementMarginBottom}
    style:--collapsible-side-bar-layout-menu-element-font-size={_menuElementFontSize}
    style:--collapsible-side-bar-layout-menu-element-font-weight={_menuElementFontWeight}
    style:--collapsible-side-bar-layout-menu-color={_menuColor}
    style:--collapsible-side-bar-layout-selected-menu-color={_selectedMenuColor}
    style:--collapsible-side-bar-layout-sidebar-background-color={_sideBarBackgroundColor}
    style:--collapsible-side-bar-layout-overlay-color={_overlayColor}
    style:--collapsible-side-bar-layout-header-background-color={_headerBackgroundColor}
    style:--collapsible-side-bar-layout-divider-color={_dividersColor}
  >
    <header
      class="side-bar"
      class:collapsed={drawerCollapsed}
      class:opened={drawerOpened}
    >
      <div
        class="header-toolbar"
        class:collapsed={drawerCollapsed}
        class:opened={drawerOpened}
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
            {#if openedHeader || mAndDown}
              <slot name="inner-menu" hamburgerVisible={mAndDown}>
                Menu
              </slot>
            {/if}
          </div>
        </slot>
      </div>
      <div
        class="side-bar-content"
        class:collapsed={drawerCollapsed}
      >
        <slot name="sidebar-header" hamburgerVisible={mAndDown} collapsed={drawerCollapsed}>
          {#if !!fullLogo && !!partialLogo && !mAndDown}
            <div class="logo-container" class:collapsed={drawerCollapsed}>
              <img src={drawerCollapsed ? partialLogo : fullLogo} alt="logo">
            </div>
          {/if}
        </slot>
        <slot name="sidebar-main" hamburgerVisible={mAndDown} collapsed={drawerCollapsed}>
          <div
            class="menu-container"
            class:collapsed={drawerCollapsed}
          >
            <div
              class="menu"
              class:collapsed={drawerCollapsed}
            >
              {#each menuItems as menu}
                {#if 'id' in menu}
                  <div
                    class="menu-row"
                    class:selected={menu.id === selectedMenuElementId}
                    on:click={() => handleMenuClick(menu)}
                    on:keypress
                  >
                    <div class="menu-icon"><Icon name={menu.icon} size={menuIconsSize}></Icon></div>
                    <div class="menu-name">{menu.name}</div>
                  </div>
                {:else}
                  <div
                    style:margin-top={menu.marginTop}
                    style:margin-bottom={menu.marginBottom}
                    style:margin-right="14px"
                    class:divider={menu.divider}
                    class="menu-row"
                  >
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </slot>
        <CollapsibleDivider
          bind:collapsed={drawerCollapsed}
          disabled={mAndDown}
          _circleColor={_dividersColor}
          _dividerColor={_dividersColor}
          _iconColor={_dividersColor}
        ></CollapsibleDivider>
        <slot name="sidebar-footer" hamburgerVisible={mAndDown} collapsed={drawerCollapsed}></slot>
      </div>
    </header>
    <div
      class="main-section"
      class:collapsed={drawerCollapsed}
    >
      <div
        class="overlay"
        on:click={handleOverlayClick}
        on:keypress={handleOverlayClick}
        class:visible={drawerOpened}
      ></div>
      <div
        style:padding={_pagePadding}
        class:blurred={drawerOpened}
      >
        <slot>Content</slot>
      </div>
    </div>
  </div>
</MediaQuery>


<style>

  .divider {
    height: 1px;
    background-color: var(--collapsible-side-bar-layout-divider-color);
  }

  .logo-container {
    padding-left: 16px;
    padding-top: 10px;
    transition-property: width padding-left;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: var(--collapsible-side-bar-layout-collapse-transition-time);
  }

  .logo-container.collapsed {
    padding-left: 8px;
  }

  .logo-container img {
    height: calc(var(--collapsible-side-bar-layout-collapsed-width) - 20px);
  }

  .side-bar {
    padding-left: 5px;
    padding-top: 5px;
    position: fixed;
    width: var(--collapsible-side-bar-layout-expanded-width);
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    transition-property: width padding-left;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: var(--collapsible-side-bar-layout-collapse-transition-time);
    overflow: hidden;
    white-space: nowrap;
    background-color: var(--collapsible-side-bar-layout-sidebar-background-color);
  }

  .side-bar.collapsed {
    width: var(--collapsible-side-bar-layout-collapsed-width);
  }

  .header-toolbar {
    padding-right: 20px;
    position: fixed;
    height: var(--collapsible-side-bar-layout-header-height);
    left: calc(5px + var(--collapsible-side-bar-layout-expanded-width));
    transition-property: left;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: var(--collapsible-side-bar-layout-collapse-transition-time);
    right: 0;
    top: 0;
  }

  .header-toolbar.collapsed {
    left: calc(5px + var(--collapsible-side-bar-layout-collapsed-width));
  }

  .main-section {
    padding-left: var(--collapsible-side-bar-layout-expanded-width);
    padding-top: var(--collapsible-side-bar-layout-header-height);
    transition-property: padding-left;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: var(--collapsible-side-bar-layout-collapse-transition-time);
  }

  .main-section.collapsed {
    padding-left: var(--collapsible-side-bar-layout-collapsed-width);
  }

  .menu {
    width: auto;
    margin-top: 40px;
    margin-bottom: 20px;
  }

  .menu-container {
    padding-left: 30px;
    padding-right: 30px;
    transition-property: padding-left padding-right;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: var(--collapsible-side-bar-layout-collapse-transition-time);
  }

  .menu-container.collapsed {
    padding-left: 22px;
    padding-right: 14px;
  }

  .menu .menu-name {
    transition-property: opacity width;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: var(--collapsible-side-bar-layout-collapse-transition-time);
    padding-left: 20px;
    width: 100%;
    font-size: var(--collapsible-side-bar-layout-menu-element-font-size);
    font-weight: var(--collapsible-side-bar-layout-menu-element-font-weight);
  }

  .menu-icon {
    display: flex;
    justify-content: center;
    margin-left: 0;
  }

  .menu.collapsed .menu-name {
    width: 0px;
    padding-left: 0px;
    opacity: 0;
  }

  .menu-row {
    display: flex;
    margin-bottom: var(--collapsible-side-bar-layout-menu-element-margin-bottom);
    cursor: pointer;
    color: var(--collapsible-side-bar-layout-menu-color)
  }

  .menu-row.selected {
    color: var(--collapsible-side-bar-layout-selected-menu-color);
  }

  .inner-menu {
    padding-left: 20px;
    background-color: var(--collapsible-side-bar-layout-header-background-color);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  @media (max-width: 1024px) {
    .side-bar {
      left: calc(0rem - var(--collapsible-side-bar-layout-expanded-width));
      right: auto;
      transition-property: left;
      transition-timing-function: cubic-bezier(.4,0,.2,1);
      transition-duration: var(--collapsible-side-bar-layout-collapse-transition-time);
      top: var(--collapsible-side-bar-layout-header-height);
      background-color: var(--collapsible-side-bar-layout-sidebar-background-color);
      bottom: 0;
      z-index: 30;
      width: var(--collapsible-side-bar-layout-expanded-width);
      max-width: 100vw;
    }

    .side-bar.opened {
      left: 0;
    }

    .overlay {
      position: fixed;
      top: var(--collapsible-side-bar-layout-header-height);
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
      background-color: var(--collapsible-side-bar-layout-overlay-color);
      backdrop-filter: blur(4px);
      z-index: 20;
    }

    .header-toolbar {
      left: 0;
    }

    .header-toolbar.collapsed {
      left: 0;
    }

    .header-toolbar.opened {
      background-color: inherit;
    }

    .header-toolbar:hover {
      background-color: inherit;
    }

    .main-section {
      padding-left: 0;
    }

    .main-section.collapsed {
      padding-left: 0;
    }

    .blurred {
      backdrop-filter: blur(4px);
    }
  }
</style>