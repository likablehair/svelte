<script lang="ts">
  import '../../../css/main.css'
  import Drawer from '$lib/components/simple/navigation/Drawer.svelte';
  import Menu from '$lib/components/simple/common/Menu.svelte';
  import MediaQuery from '$lib/components/simple/common/MediaQuery.svelte';
  import type { ComponentProps, Snippet } from 'svelte';
  import lodash from 'lodash'

  export interface Props {
    open?: boolean
    drawerProps?: Omit<ComponentProps<typeof Drawer>, 'open'>
    menuProps?: Omit<ComponentProps<typeof Menu>, 'open'>
    children?: Snippet<[
      {
        isDrawer: boolean,
        isMenu: boolean
      }
    ]>
  }

  let { 
    open = $bindable(false),
    drawerProps,
    menuProps,
    children,
  }: Props = $props();

  const menuPropsDefaultValue = {
    closeOnClickOutside: true,
    _boxShadow: "rgb(var(--global-color-grey-900), .5) 0px 2px 4px",
    _height: "fit-content",
    _minWidth: "100px",
    _borderRadius: "5px",
    _width: "",
    anchor: 'bottom-center',
    stayInViewport: true
  }

  let finalMenuProps = $derived(
    lodash.clone(lodash.merge(menuPropsDefaultValue, menuProps))
  )

  const drawerPropsDefaultValue = {
    position: 'bottom'
  }

  let finalDrawerProps = $derived(
    lodash.clone(lodash.merge(drawerPropsDefaultValue, drawerProps))
  )
</script>

<MediaQuery>
  {#snippet defaultSnippet({ mAndDown})}
    {#if mAndDown}
      <Drawer
        bind:open={open}
        {...finalDrawerProps}
      >
        {@render children?.({ isDrawer: true, isMenu: false })}
      </Drawer>
    {:else}
      <Menu
        bind:open={open}
        {...finalMenuProps}
      >
        {@render children?.({ isDrawer: false, isMenu: true })}
      </Menu>
    {/if}
  {/snippet}
</MediaQuery>