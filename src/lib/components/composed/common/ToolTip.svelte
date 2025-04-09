<script lang="ts">
  import '../../../css/main.css'
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import { tick, type ComponentProps, type Snippet } from 'svelte';

  interface Props {
    activator: HTMLElement;
    menuOpen?: boolean;
    menuProps?: ComponentProps<typeof Menu>;
    appearTimeout?: number;
    children?: Snippet<[]>
  }

  let {
    activator = $bindable(),
    menuOpen = $bindable(false),
    menuProps = {},
    appearTimeout = undefined,
    children,
  }: Props = $props();

  let mouseEnterHandler: (() => void) | undefined = undefined,
    mouseLeaveHandler: (() => void) | undefined = undefined,
    appearTimeoutId: NodeJS.Timeout | undefined = undefined

  $effect(() => {
    if(!!activator) {
      if(!!mouseEnterHandler) activator.removeEventListener('mouseenter', mouseEnterHandler)
      if(!!mouseLeaveHandler) activator.removeEventListener('mouseleave', mouseLeaveHandler)
  
      mouseEnterHandler = () => {
        if(appearTimeout !== undefined) {
          if(appearTimeoutId !== undefined) clearTimeout(appearTimeoutId)
  
          appearTimeoutId = setTimeout(async () => {
            menuOpen = true
            await tick()
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
  })

</script>

<Menu
  bind:open={menuOpen}
  bind:activator
  anchor="bottom-center"
  stayInViewport={true}
  flipOnOverflow={true}
  {...menuProps}
>
  {@render children?.()}
</Menu>

