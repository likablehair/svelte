<script lang="ts">
  import '../../../css/main.css'
  import Drawer from '$lib/components/simple/navigation/Drawer.svelte';
  import Menu from '$lib/components/simple/common/Menu.svelte';
  import MediaQuery from '$lib/components/simple/common/MediaQuery.svelte';
  import type { ComponentProps } from 'svelte';
  import lodash from 'lodash'

  export let open: boolean = false,
    drawerProps: Omit<ComponentProps<Drawer>, 'open'> | undefined = undefined,
    menuProps: Omit<ComponentProps<Menu>, 'open'> | undefined = undefined

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

  $: finalMenuProps = lodash.clone(lodash.merge(menuPropsDefaultValue, menuProps))

  const drawerPropsDefaultValue = {
    position: 'bottom'
  }

  $: finalDrawerProps = lodash.clone(lodash.merge(drawerPropsDefaultValue, drawerProps))
</script>

<MediaQuery let:mAndDown>
  {#if mAndDown}
    <Drawer
      bind:open={open}
      {...finalDrawerProps}
      on:close
      on:item-click
    >
      <slot isDrawer={true} isMenu={false}></slot>
    </Drawer>
  {:else}
    <Menu
      bind:open={open}
      {...finalMenuProps}
    >
      <slot isDrawer={false} isMenu={true}></slot>
    </Menu>
  {/if}
</MediaQuery>