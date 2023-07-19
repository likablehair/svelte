<script lang="ts">
  import '../../css/main.css'
  import './CollapsibleSideBarLayout.css'
  import { createEventDispatcher } from "svelte";
  import CollapsibleDivider from "../simple/common/CollapsibleDivider.svelte";
  import MediaQuery from "../simple/common/MediaQuery.svelte";
  import type { MenuItem } from "../simple/lists/SelectableMenuList.svelte";
  import SelectableMenuList from "../simple/lists/SelectableMenuList.svelte";
  import HeaderMenu from '../simple/navigation/HeaderMenu.svelte';

  export let drawerOpened: boolean = false,
    drawerCollapsed: boolean = false,
    menuItems: MenuItem[] = [],
    selectedMenuElementName: string | undefined = undefined,
    fullLogo: string | undefined = undefined,
    partialLogo: string | undefined = undefined

  let dispatch = createEventDispatcher<{
    'collapse': {
      collapsed: boolean
    },
    'menu-select': {
      menu: MenuItem
    }
  }>()

  function handleMenuSelect(event: CustomEvent<{
    item: MenuItem
  }>) {
    dispatch('menu-select', {
      menu: event.detail.item
    })
  }

  function handleCollpsabledDividerChange() {
    dispatch('collapse', {
      collapsed: drawerCollapsed
    })
  }
</script>

<MediaQuery let:mAndDown>
  <div class="container">
    <div 
      class="sidebar"
      class:collapsed={drawerCollapsed}
    >
      <div 
        class="logo-container"
        class:collapsed={drawerCollapsed}
      >
        <slot name="logo" collapsed={drawerCollapsed} mAndDown>
          <img src={drawerCollapsed ? partialLogo : fullLogo} alt="logo">
        </slot>
      </div>
      <SelectableMenuList
        items={menuItems}
        collapsed={drawerCollapsed}
        selected={selectedMenuElementName}
        on:select={handleMenuSelect}
      ></SelectableMenuList>
      <CollapsibleDivider
        bind:collapsed={drawerCollapsed}
        on:change={handleCollpsabledDividerChange}
      ></CollapsibleDivider>
      <div class="sidebar-footer">
        <slot name="sidebar-footer" collapsed={drawerCollapsed} drawer={false}></slot>
      </div>
    </div>
    <div class="header-menu">
      <HeaderMenu
        bind:openDrawer={drawerOpened}
        on:drawer-change
      >
        <svelte:fragment slot="title">
          <div class="header-logo-container">
            <img src={fullLogo} alt="logo">
          </div>
        </svelte:fragment>
        <div 
          slot="drawer" 
          style:padding="0px 10px 10px 0px"
          style:height="100%"
          style:display="flex"
          style:flex-direction="column"
        >
          <SelectableMenuList
            items={menuItems}
            collapsed={false}
            selected={selectedMenuElementName}
          ></SelectableMenuList>
          <div class="sidebar-footer">
            <slot name="sidebar-footer" collapsed={false} drawer={true}></slot>
          </div>
        </div>
      </HeaderMenu>
    </div>
    <main 
      class="page-content"
      class:collapsed={!drawerCollapsed}
      class:expanded={drawerCollapsed}
    >
      <slot></slot>
    </main>
  </div>
</MediaQuery>

<style>
  .sidebar {
    position: fixed;
    bottom: 0px;
    top: 0px;
    width: var(
      --collapsible-side-bar-layout-sidebar-width,
      var(--collapsible-side-bar-layout-default-sidebar-width)
    );
    transition: width .3s cubic-bezier(0.075, 0.82, 0.165, 1);
    display: flex;
    flex-direction: column;
  }

  .sidebar.collapsed {
    width: var(
      --collapsible-side-bar-layout-sidebar-collapsed-width,
      var(--collapsible-side-bar-layout-default-sidebar-collapsed-width)
    );
  }

  @media (max-width: 991.98px){
  	.sidebar {
      visibility: hidden;
    }

    .page-content {
      padding-top: 1rem;
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }

  @media (min-width: 992px){
  	.header-menu {
      visibility: hidden;
    }

    .page-content {
      margin-top: -3rem;
      transition: padding-left .3s cubic-bezier(0.075, 0.82, 0.165, 1);
    }

    .page-content.expanded {
      padding-left: 6rem
    }

    .page-content.collapsed {
      padding-left: 18rem
    }
  }

  .logo-container {
    padding-left: 16px;
    padding-top: 10px;
    padding-bottom: 10px;
    transition-property: width padding-left;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    transition-duration: var(--collapsible-side-bar-layout-collapse-transition-time);
    overflow: hidden;
  }

  .logo-container.collapsed {
    padding-left: 0px;
  }

  .logo-container img {
    height: var(
      --collapsible-side-bar-layout-logo-height,
      var(--collapsible-side-bar-layout-default-logo-height)
    );
  }

  .header-logo-container {
    display: flex;
    align-items: center;
  }

  .header-logo-container img {
    height: 3rem;
  }

  .sidebar-footer {
    flex-grow: 1;
  }
</style>