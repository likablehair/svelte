<script lang="ts">
  import '../../../css/main.css'
  import Drawer from '$lib/components/simple/navigation/Drawer.svelte';
  import Menu from '$lib/components/simple/common/Menu.svelte';
  import MediaQuery from '$lib/components/simple/common/MediaQuery.svelte';
  import type { ComponentProps, Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    activator: HTMLElement;
    drawerPosition?: ComponentProps<typeof Drawer>['position'];
    menuAnchor?: ComponentProps<typeof Menu>['anchor'];
    stayInViewport?: ComponentProps<typeof Menu>['stayInViewport'];
    flipOnOverflow?: ComponentProps<typeof Menu>['flipOnOverflow'];
    _boxShadow?: string;
    _height?: string;
    _width?: string;
    _maxHeight?: string;
    _minWidth?: string;
    _borderRadius?: string;
    openingId?: ComponentProps<typeof Menu>['openingId'];
    _drawerOverflow?: string;
    children?: Snippet<[{
      isDrawer: boolean,
      isMenu: boolean
    }]>
    onclose?: ComponentProps<typeof Drawer>['onclose']
    onitemClick?: ComponentProps<typeof Drawer>['onitemClick']
  }

  let { 
    open = $bindable(false),
    activator = $bindable(),
    drawerPosition = $bindable('bottom'),
    menuAnchor = $bindable('bottom-center'),
    stayInViewport = $bindable(true),
    flipOnOverflow = $bindable(false),
    _boxShadow = "rgb(var(--global-color-grey-900), .5) 0px 2px 4px",
    _height = "fit-content",
    _width = undefined,
    _maxHeight = undefined,
    _minWidth = "100px",
    _borderRadius = "5px",
    openingId = $bindable(undefined),
    _drawerOverflow = undefined,
    children,
    onclose,
    onitemClick,
  }: Props = $props();
</script>

<MediaQuery>
  {#snippet defaultSnippet({ mAndDown})}
    {#if mAndDown}
      <Drawer
        bind:open={open}
        bind:position={drawerPosition}
        _overflow={_drawerOverflow}
        {onclose}
        {onitemClick}
      >
        {@render children?.({ isDrawer: true, isMenu: false })}
      </Drawer>
    {:else}
      <Menu
        bind:activator={activator}
        bind:open={open}
        closeOnClickOutside
        _boxShadow={_boxShadow}
        _height={_height}
        _maxHeight={_maxHeight}
        _minWidth={_minWidth}
        _borderRadius={_borderRadius}
        _width={_width || ""}
        anchor={menuAnchor}
        bind:stayInViewport={stayInViewport}
        bind:flipOnOverflow={flipOnOverflow}
        bind:openingId
      >
        {@render children?.({ isDrawer: false, isMenu: true })}
      </Menu>
    {/if}
  {/snippet}
</MediaQuery>