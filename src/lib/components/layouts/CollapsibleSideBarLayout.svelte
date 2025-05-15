<script lang="ts">
  import "../../css/main.css";
  import "./CollapsibleSideBarLayout.css";
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { createEventDispatcher } from "svelte";
  import ColorInvertedSelector, {
    type Option,
  } from "../simple/lists/ColorInvertedSelector.svelte";
  import { writable } from "svelte/store";

  interface ClassProps {
    container?: string;
    header?: string;
    mainSection?: string;
    overlay?: string;
  }

  export let drawerOpened = false;
  export let options: Option[] = [];
  export let selectedIndex: number | undefined = undefined;
  export let sidebarExpanded: boolean = false;
  export let isPinned: boolean = false;

  //export let $$restProps: Record<string, any>;

  let clazz: ClassProps = {};
  export { clazz as class };

  const sidebarPinned = writable(false);
  $sidebarPinned = isPinned;

  let headerElement: HTMLElement;

  const dispatch = createEventDispatcher<{
    "drawer-change": {
      opened: boolean;
    };
    "menu-select": {
      option: Option;
    };
    "pinned-change": {
      pinned: boolean;
    };
    "sidebar-toggle": {
      expanded: boolean;
    };
  }>();

  function toggleMenu(): void {
    drawerOpened = !drawerOpened;
    dispatch("drawer-change", { opened: drawerOpened });
  }

  function handleOverlayClick(): void {
    drawerOpened = false;
    dispatch("drawer-change", { opened: drawerOpened });
  }

  function handleMenuSelection(option: Option): void {
    if (!$sidebarPinned) {
      sidebarExpanded = false;
    }

    drawerOpened = false;
    dispatch("drawer-change", { opened: drawerOpened });
    dispatch("menu-select", { option });
  }

  // function togglePin(): void {
  //   sidebarExpanded = $sidebarPinned;
  //   dispatch("pinned-change", { pinned: $sidebarPinned });
  // }

  function toggleSidebar(): void {
    sidebarExpanded = !sidebarExpanded;
    dispatch("sidebar-toggle", { expanded: sidebarExpanded });
  }
</script>

<MediaQuery let:mAndDown>
  <div class="collapsible-layout {clazz.container || ""}">
    <nav
      class:opened-drawer={drawerOpened}
      class:opened={sidebarExpanded}
      class="header-toolbar"
    >
      <slot name="header">
        <div class="inner-menu">
          {#if mAndDown}
            <div style:margin-right="2rem">
              <Icon
                name="mdi-menu"
                click
                --icon-default-size="1.5rem"
                on:click={toggleMenu}
              />
            </div>
          {:else if !sidebarExpanded}
            <div style:margin-right="2rem">
              <Icon
                name="mdi-menu-open"
                click
                --icon-default-size="1.5rem"
                on:click={toggleSidebar}
              />
            </div>
          {/if}
          <slot name="inner-menu" hamburgerVisible={mAndDown}>
            <div class="menu">Menu</div>
          </slot>
        </div>
      </slot>
    </nav>
    <header
      bind:this={headerElement}
      class:opened={(mAndDown && drawerOpened) || sidebarExpanded}
      class:pinned={$sidebarPinned}
      class="side-bar {clazz.header || ''}"
      role="presentation"
      tabindex="-1"
    >
      <div class="side-bar-content">
        <slot name="sidebar" hamburgerVisible={mAndDown} {sidebarExpanded}>
          <div class="sidebar-container">
            <div class="logo-and-menu">
              <div class="sidebar-header-container">
                <div class="logo-container">
                  <slot
                    name="logo"
                    hamburgerVisible={mAndDown}
                    {sidebarExpanded}
                  >
                    <div class="logo">logo</div>
                  </slot>
                </div>
                <div class="pin-container">
                  {#if sidebarExpanded}
                    <div class="sidebar-close-button">
                      <Icon
                        name="mdi-menu-open"
                        click
                        --icon-default-size="1.5rem"
                        on:click={toggleSidebar}
                        class="toggle-icon"
                      />
                    </div>
                  {/if}
                </div>
              </div>
              <slot name="menu" hamburgerVisible={mAndDown} {sidebarExpanded}>
                <div class="menu-container" class:expanded={sidebarExpanded}>
                  <ColorInvertedSelector
                    {options}
                    {selectedIndex}
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
                    <svelte:fragment slot="prepend" let:option let:handleClickClose let:index>
                      <slot name="prepend" {option} {handleClickClose} {index} {sidebarExpanded}>
                        {#if !!option.icon}
                          <Icon
                            name={option.icon}
                          ></Icon>
                        {/if}
                      </slot>
                    </svelte:fragment>
                    <svelte:fragment slot="option" let:option>
                      <slot name="option" {option}>
                        <div class="label">
                          {option.label}
                        </div>
                      </slot>
                    </svelte:fragment>
                  </ColorInvertedSelector>
                </div>
              </slot>
            </div>
            <slot name="user" hamburgerVisible={mAndDown} {sidebarExpanded} />
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
      />
      <div class="content" class:blurred={drawerOpened}>
        <slot>Content</slot>
      </div>
    </div>
  </div>
</MediaQuery>


<style>
  .side-bar {
    background-color: var(--csbl-side-bar-default-bg);
    position: fixed;
    width: var(
      --collapsible-divided-side-bar-layout-side-bar-width, 
      var(--collapsible-divided-side-bar-layout-default-side-bar-width)
    );
    border-right: var(
      --collapsible-divided-side-bar-layout-side-bar-border,
      var(--collapsible-divided-side-bar-layout-default-side-bar-border)
    );
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(
      --collapsible-divided-side-bar-layout-side-bar-padding,
      var(--collapsible-divided-side-bar-layout-default-side-bar-padding)
    );
    z-index: 10;
    overflow: clip;
    transition: all .2s cubic-bezier(.4,0,.2,1);
  }

  .sidebar-header-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin-bottom: 1rem;
  }

  .logo-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 70%;
    margin-bottom: 1rem;
  }

  .pin-container {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    width: 30%;
    margin-bottom: 1rem;
    margin-right: 1rem;
  }

  .sidebar-close-button {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-right: 0.5rem;
  }

  .toggle-icon {
    width: 28px;
    height: 28px;
    font-size: 1.5rem;
  }

  .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    position: relative;
  }

  @media (min-width: 1024.1px) {
    .side-bar.opened {
      background-color: var(--csbl-side-bar-expanded-bg);
      width: var(
        --collapsible-divided-side-bar-layout-side-bar-hover-width, 
        var(--collapsible-divided-side-bar-layout-default-side-bar-hover-width)
      );
    }
  }

  .overlay {
    display: none;
  }

  .content {
    padding: var(
      --collapsible-divided-side-bar-layout-content-padding,
      var(--collapsible-divided-side-bar-layout-default-content-padding)
    );
  }

  @media (max-width: 1024px) {
    .side-bar {
      left: calc(0rem - var(
          --collapsible-divided-side-bar-layout-drawer-width,
          var(--collapsible-divided-side-bar-layout-default-drawer-width)
        )
      );
      right: auto;
      transition-property: left;
      transition-timing-function: cubic-bezier(.4,0,.2,1);
      transition-duration: .5s;
      top: var(--collapsible-divided-side-bar-layout-header-menu-height,
        var(--collapsible-divided-side-bar-layout-default-header-menu-height)
      );
      background-color: var(--csbl-side-bar-default-bg);
      bottom: 0;
      z-index: 30;
      width: var(
        --collapsible-divided-side-bar-layout-drawer-width,
        var(--collapsible-divided-side-bar-layout-default-drawer-width)
      );
      max-width: 100vw;
    }

    .side-bar.opened {
      left: 0;
      width: var(
        --collapsible-divided-side-bar-layout-side-bar-hover-width, 
        var(--collapsible-divided-side-bar-layout-default-side-bar-hover-width)
      );
    }

    .overlay {
      position: fixed;
      top: var(
        --collapsible-divided-side-bar-layout-header-menu-height,
        var(--collapsible-divided-side-bar-layout-default-header-menu-height)
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
      --collapsible-divided-side-bar-layout-header-menu-position,
      var(--collapsible-divided-side-bar-layout-default-header-menu-position)
    );
    height: var(
      --collapsible-divided-side-bar-layout-header-menu-height,
      var(--collapsible-divided-side-bar-layout-default-header-menu-height)
    );
    left: var(
      --collapsible-divided-side-bar-layout-side-bar-width,
      var(--collapsible-divided-side-bar-layout-default-side-bar-width)
    );
    border-bottom: var(
      --collapsible-divided-side-bar-layout-header-menu-border,
      var(--collapsible-divided-side-bar-layout-default-header-menu-border)
    );
    backdrop-filter: var(
      --collapsible-divided-side-bar-layout-header-menu-backdrop-filter,
      var(--collapsible-divided-side-bar-layout-default-header-menu-backdrop-filter)
    );
    background-color: var(
      --collapsible-divided-side-bar-layout-inner-header-menu-background-color,
      rgb(var(--collapsible-divided-side-bar-layout-default-inner-header-menu-background-color), .5)
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
        --collapsible-divided-side-bar-layout-inner-header-menu-background-color,
        rgb(var(--collapsible-divided-side-bar-layout-default-inner-header-menu-background-color))
      );
    }

    .header-toolbar:hover {
      background-color: inherit;
    }
  }

  @media (min-width: 1024.1px) {
    .header-toolbar.opened {
      left: var(
        --collapsible-divided-side-bar-layout-side-bar-hover-width, 
        var(--collapsible-divided-side-bar-layout-default-side-bar-hover-width)
      );
    }
  }

  .main-section {
    padding-left: var(
      --collapsible-divided-side-bar-layout-content-padding-left,
      var(
        --collapsible-divided-side-bar-layout-side-bar-width,
        var(--collapsible-divided-side-bar-layout-default-side-bar-width)
      )
    );
    padding-top: var(
      --collapsible-divided-side-bar-layout-content-padding-top,
      var(
        --collapsible-divided-side-bar-layout-header-menu-height,
        var(--collapsible-divided-side-bar-layout-default-header-menu-height,)
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
        --collapsible-divided-side-bar-layout-side-bar-hover-width, 
        var(--collapsible-divided-side-bar-layout-default-side-bar-hover-width)
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
      --collapsible-divided-side-bar-layout-header-menu-padding,
      var(--collapsible-divided-side-bar-layout-default-header-menu-padding)
    );
    background-color: var(
      --collapsible-divided-side-bar-layout-inner-header-menu-background-color,
      rgb(var(--collapsible-divided-side-bar-layout-default-inner-header-menu-background-color), .5)
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