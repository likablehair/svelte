<script lang="ts">
  import '../../css/main.css'
  import './UnstableDividedSideBarLayout.css'
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte"
  import { clickOutside } from '$lib/utils/clickOutside';
  import ColorInvertedSelector, { type Option } from '../simple/lists/ColorInvertedSelector.svelte';
  import { sidebarOpened } from '$lib/stores/layouts/unstableSidebarOpened';
  import { onMount, type ComponentProps, type Snippet } from 'svelte';

  let headerElement: HTMLElement
  onMount(() => {
    if (headerElement) {
      headerElement.addEventListener('clickoutside', handleOutsideClick);
    }

    return () => {
      if (headerElement) {
        headerElement.removeEventListener('clickoutside', handleOutsideClick);
      }
    };
  });

  function handleOutsideClick() {
    if (expandOn === 'click') {
      sidebarExpanded = false;
    }
  };

  interface Props {
    drawerOpened?: boolean;
    expandOn?: 'hover' | 'click' | 'none';
    options?: Option[];
    selectedIndex?: number;
    sidebarExpanded?: boolean;
    class?: {
      container?: string,
      header?: string,
      mainSection?: string,
      overlay?: string
    }
    ondrawerChange?: (event: {
      detail: {
        opened: boolean
      }
    }) => void
    onmenuSelect?: (event: {
      detail: {
        option: Option
      }
    }) => void
    menuSnippet?: Snippet<[{
      hamburgerVisible?: boolean
      sidebarExpanded?: boolean
    }]>,
    headerSnippet?: Snippet<[{
      hamburgerVisible?: boolean
      sidebarExpanded?: boolean
    }]>,
    innerMenuSnippet?: Snippet<[{
      hamburgerVisible: boolean
    }]>
    sidebarSnippet?: Snippet<[{
      hamburgerVisible: boolean
      sidebarExpanded: boolean
    }]>
    logoSnippet?: Snippet<[{
      hamburgerVisible: boolean
      sidebarExpanded: boolean
    }]>
    prependSnippet?: Snippet<[{
      option: Option
      sidebarExpanded: boolean
      index: number
      handleClickClose: Parameters<NonNullable<ComponentProps<typeof ColorInvertedSelector>['prependSnippet']>>[0]['handleClickClose']
    }]>
    optionSnippet?: Snippet<[{
      option: Option
    }]>
    userSnippet?: Snippet<[{
      hamburgerVisible: boolean
      sidebarExpanded: boolean
    }]>
    children?: Snippet<[]>
  }

  let { 
    drawerOpened = $bindable(false),
    expandOn = 'hover',
    options = [],
    selectedIndex = $bindable(undefined),
    sidebarExpanded = $bindable(false),
    ondrawerChange,
    onmenuSelect,
    children,
    innerMenuSnippet,
    logoSnippet,
    menuSnippet,
    headerSnippet,
    optionSnippet: optionInternalSnippet,
    prependSnippet: prependInternalSnippet,
    sidebarSnippet,
    userSnippet,
    class: clazz = {},
  }: Props = $props();

  function toggleMenu() {
    drawerOpened = !drawerOpened
    if(ondrawerChange) {
      ondrawerChange({
        detail: {
          opened: drawerOpened
        }
      })
    }
  }

  function handleOverlayClick() {
    drawerOpened = false
    if(ondrawerChange) {
      ondrawerChange({
        detail: {
          opened: drawerOpened
        }
      })
    }
  }

  function handleMenuSelection(option: Option) {
    sidebarExpanded = false
    drawerOpened = false
    if(ondrawerChange) {
      ondrawerChange({
        detail: {
          opened: drawerOpened
        }
      })
    }
    if(onmenuSelect) {
      onmenuSelect({
        detail: {
          option
        }
      })
    }
  }

  $effect(() => {
    $sidebarOpened = sidebarExpanded
  })
</script>

<MediaQuery>
  {#snippet defaultSnippet({ mAndDown})}
    <div
      class={clazz.container || ''}
    >
      <nav 
        class:opened-drawer={drawerOpened}
        class:opened={sidebarExpanded}
        class="header-toolbar"
      >
        {#if headerSnippet}
          {@render headerSnippet({ sidebarExpanded, hamburgerVisible: mAndDown })}
        {:else}
          <div class="inner-menu">
            {#if mAndDown}
              <div style:margin-right="2rem">
                <Icon 
                  name="mdi-menu" 
                  onclick={toggleMenu}
                ></Icon>
              </div>
            {/if}
            {#if innerMenuSnippet}
              {@render innerMenuSnippet({ hamburgerVisible: mAndDown })}
            {:else}
              Menu
            {/if}
          </div>
        {/if}
      </nav>
      <header
        bind:this={headerElement}
        class:opened={(mAndDown && drawerOpened) || sidebarExpanded}
        onmouseleave={() => {if(expandOn == 'hover') sidebarExpanded = false}}
        onmouseenter={() => {if(expandOn == 'hover') sidebarExpanded = true}}
        onclick={() => {if(expandOn == 'click' && !mAndDown) sidebarExpanded = true}}
        onkeypress={() => {if(expandOn == 'click' && !mAndDown) sidebarExpanded = true}}
        use:clickOutside 
        class="side-bar {clazz.header || ''}"
        role="presentation"
        tabindex="-1"
      >
        <div class="side-bar-content">
          {#if sidebarSnippet}
            {@render sidebarSnippet({ hamburgerVisible: mAndDown, sidebarExpanded })}
          {:else}
            <div class="sidebar-container">
              <div class="logo-and-menu">
                {#if logoSnippet}
                  {@render logoSnippet({ hamburgerVisible: mAndDown, sidebarExpanded })}
                {:else}
                  <div class="logo">logo</div>
                {/if}
                {#if menuSnippet}
                  {@render menuSnippet({ hamburgerVisible: mAndDown, sidebarExpanded })}
                {:else}
                  <div 
                    class="menu-container"
                    class:expanded={sidebarExpanded}
                  >
                    <ColorInvertedSelector
                      options={options}
                      bind:selectedIndex={selectedIndex}
                      --color-inverted-selector-default-background-color="transparent"
                      --color-inverted-selector-default-font-size="1.2rem"
                      --color-inverted-selector-default-icon-gap="1.2rem"
                      --color-inverted-selector-default-element-height="3rem"
                      --color-inverted-selector-default-element-padding="8px 8px 8px 11px"
                      --color-inverted-selector-default-element-border-radius="16px"
                      --color-inverted-selector-default-selected-font-weight="400"
                      --icon-default-size="1.3rem"
                      deletable={false}
                      onselect={(e) => handleMenuSelection(e.detail.option)}
                    >
                      {#snippet prependSnippet({ handleClickClose, index, option })} 
                        {#if prependInternalSnippet}
                          {@render prependInternalSnippet({ option, handleClickClose, index, sidebarExpanded })} 
                        {:else}
                          {#if !!option.icon}
                            <Icon
                              name={option.icon}
                            ></Icon>
                          {/if}
                        {/if}
                      {/snippet}
                      {#snippet optionSnippet({ option })}
                        {#if optionInternalSnippet}
                          {@render optionInternalSnippet({ option })}
                        {:else}
                          <div class="label">
                            {option.label}
                          </div>
                        {/if}
                      {/snippet}
                    </ColorInvertedSelector>
                  </div>
                {/if}
              </div>
              {@render userSnippet?.({ hamburgerVisible: mAndDown, sidebarExpanded })}
            </div>
          {/if}
        </div>
      </header>
      <div 
        class="main-section {clazz.mainSection || ''}"
        class:opened={sidebarExpanded}
      >
        <div 
          onclick={handleOverlayClick}
          onkeypress={handleOverlayClick}
          class:visible={drawerOpened}
          class="overlay {clazz.overlay || ''}"
          role="presentation"
          tabindex="-1"
        ></div>
        <div
          class="content"
          class:blurred={drawerOpened}
        >
          {#if children}
            {@render children()}
          {:else}
            Content
          {/if}
        </div>
      </div>
    </div>
  {/snippet}
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

  .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    position: relative;
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