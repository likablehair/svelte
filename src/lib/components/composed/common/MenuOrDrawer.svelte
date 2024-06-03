<script lang="ts">
  import '../../../css/main.css'
  import Drawer from '$lib/components/simple/navigation/Drawer.svelte';
  import Menu from '$lib/components/simple/common/Menu.svelte';
  import MediaQuery from '$lib/components/simple/common/MediaQuery.svelte';
  import type { ComponentProps } from 'svelte';

  export let open: boolean = false,
    activator: HTMLElement,
    drawerPosition: ComponentProps<Drawer>['position'] = 'bottom',
    menuAnchor: ComponentProps<Menu>['anchor'] = 'bottom-center',
    stayInViewport: ComponentProps<Menu>['stayInViewport'] = true,
    flipOnOverflow: ComponentProps<Menu>['flipOnOverflow'] = false,
    _boxShadow: string = "rgb(var(--global-color-grey-900), .5) 0px 2px 4px",
    _height: string = "fit-content",
    _width: string | undefined = undefined,
    _maxHeight: string | undefined = undefined,
    _minWidth: string = "100px",
    _borderRadius: string = "5px",
    openingId: string | undefined = undefined;
</script>

<MediaQuery let:mAndDown>
  {#if mAndDown}
    <Drawer
      bind:open={open}
      bind:position={drawerPosition}
      on:close
      on:item-click
    >
      <slot isDrawer={true} isMenu={false}></slot>
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
      <slot isDrawer={false} isMenu={true}></slot>
    </Menu>
  {/if}
</MediaQuery>