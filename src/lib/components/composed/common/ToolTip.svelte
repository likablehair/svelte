<script lang="ts">
  import '../../../css/main.css'
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import type { ComponentProps } from 'svelte';

  export let activator: HTMLElement,
    menuOpen: boolean = false,
    menuProps: ComponentProps<Menu> = {},
    appearTimeout: number | undefined = undefined

  let mouseEnterHandler: (() => void) | undefined = undefined,
    mouseLeaveHandler: (() => void) | undefined = undefined,
    appearTimeoutId: NodeJS.Timeout | undefined = undefined

  $: if(!!activator) {
    if(!!mouseEnterHandler) activator.removeEventListener('mouseenter', mouseEnterHandler)
    if(!!mouseLeaveHandler) activator.removeEventListener('mouseleave', mouseLeaveHandler)

    mouseEnterHandler = () => {
      if(appearTimeout !== undefined) {
        if(appearTimeoutId !== undefined) clearTimeout(appearTimeoutId)

        appearTimeoutId = setTimeout(() => {
          menuOpen = true
        }, appearTimeout);
      } else {
        menuOpen = true
      }
    }
    activator.addEventListener('mouseenter', mouseEnterHandler)

    mouseLeaveHandler = () => {
      if(appearTimeoutId !== undefined) clearTimeout(appearTimeoutId)
      menuOpen = false
    }
    activator.addEventListener('mouseleave', mouseLeaveHandler)
  }

</script>

<Menu
  bind:open={menuOpen}
  bind:activator
  anchor="bottom-center"
  stayInViewport={true}
  flipOnOverflow={true}
  {...menuProps}
>
  <slot></slot>
</Menu>

