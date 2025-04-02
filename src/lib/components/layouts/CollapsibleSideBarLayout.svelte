<script lang="ts">
  import '../../css/main.css'
  import './CollapsibleSideBarLayout.css'
  import CollapsibleDivider from "../simple/common/CollapsibleDivider.svelte";
  import MediaQuery from "../simple/common/MediaQuery.svelte";
  import type { MenuItem } from "../simple/lists/SelectableMenuList.svelte";
  import SelectableMenuList from "../simple/lists/SelectableMenuList.svelte";
  import HeaderMenu from '../simple/navigation/HeaderMenu.svelte';
  import type { ComponentProps, Snippet } from 'svelte';

  interface Props {
    drawerOpened?: boolean;
    drawerCollapsed?: boolean;
    menuItems?: MenuItem[];
    selectedMenuElementName?: string;
    fullLogo?: string;
    partialLogo?: string;
    oncollapse?: (event: {
      detail: {
        collapsed: boolean
      }
    }) => void
    onmenuSelect?: (event: {
      detail: {
        menu: MenuItem
      }
    }) => void
    sidebarFooterSnippet?: Snippet<[{ 
      collapsed: boolean, 
      drawer: boolean 
    }]>
    children?: Snippet<[]>
    logoSnippet?: Snippet<[{
      collapsed: boolean,
      mAndDown: boolean
    }]>
    ondrawerChange?: ComponentProps<typeof HeaderMenu>['ondrawerChange']
  }

  let {
    drawerOpened = $bindable(false),
    drawerCollapsed = $bindable(false),
    menuItems = [],
    selectedMenuElementName = $bindable(undefined),
    fullLogo = undefined,
    partialLogo = undefined,
    oncollapse,
    onmenuSelect,
    sidebarFooterSnippet,
    children,
    logoSnippet,
    ondrawerChange,
  }: Props = $props();

  function handleMenuSelect(event: Parameters<NonNullable<ComponentProps<typeof SelectableMenuList>['onselect']>>[0]) {
    if(onmenuSelect) {
      onmenuSelect({
        detail: {
          menu: event.detail.item
        }
      })
    }
  }

  function handleCollpsabledDividerChange() {
    if(oncollapse) {
      oncollapse({
        detail: {
          collapsed: drawerCollapsed
        }
      })
    }
  }
</script>

<MediaQuery>
  {#snippet defaultSnippet({ mAndDown})}
    <div>
      <div 
        class="sidebar"
        class:collapsed={drawerCollapsed}
      >
        <div 
          class="logo-container"
          class:collapsed={drawerCollapsed}
        >
          {#if logoSnippet}
            {@render logoSnippet({ collapsed: drawerCollapsed, mAndDown })}
          {:else}
            <img src={drawerCollapsed ? partialLogo : fullLogo} alt="logo">
          {/if}
        </div>
        <SelectableMenuList
          items={menuItems}
          collapsed={drawerCollapsed}
          selected={selectedMenuElementName}
          onselect={handleMenuSelect}
        ></SelectableMenuList>
        <CollapsibleDivider
          bind:collapsed={drawerCollapsed}
          onchange={handleCollpsabledDividerChange}
        ></CollapsibleDivider>
        <div class="sidebar-footer">
          {@render sidebarFooterSnippet?.({ collapsed: drawerCollapsed, drawer: false })}
        </div>
      </div>
      <div class="header-menu">
        <HeaderMenu
          bind:openDrawer={drawerOpened}
          {ondrawerChange}
        >
          {#snippet titleSnippet()}
            <div class="header-logo-container">
              <img src={fullLogo} alt="logo">
            </div>
          {/snippet}
          {#snippet drawerSnippet()}
            <div 
              style:padding="0px 10px 10px 0px"
              style:height="100%"
              style:display="flex"
              style:flex-direction="column"
            >
              <SelectableMenuList
                items={menuItems}
                collapsed={false}
                selected={selectedMenuElementName}
                onselect={handleMenuSelect}
              ></SelectableMenuList>
              <div class="sidebar-footer">
                {@render sidebarFooterSnippet?.({ collapsed: false, drawer: true })}
              </div>
            </div>
          {/snippet}
        </HeaderMenu>
      </div>
      <main 
        class="page-content"
        class:collapsed={!drawerCollapsed}
        class:expanded={drawerCollapsed}
      >
        {@render children?.()}
      </main>
    </div>
  {/snippet}
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