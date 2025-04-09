<script lang="ts">
  import { onDestroy } from "svelte";

  interface Props {
    threshold?: number;
    horizontal?: boolean;
    elementScroll?: HTMLElement | null;
    hasMore?: boolean;
    direction?: 'forward' | 'backward';
    onloadMore?: () => void
  }

  let {
    threshold = 0,
    horizontal = false,
    elementScroll = null,
    hasMore = true,
    direction = 'forward',
    onloadMore
  }: Props = $props();

  let isLoadMore = false,
    component: HTMLElement;

  function onScroll(e: Event) {
    const element = e.target as HTMLElement

    const offset = horizontal 
      ? direction == 'forward' 
        ? element.scrollWidth - element.clientWidth - element.scrollLeft
        : element.scrollLeft
      : direction == 'forward' 
        ? element.scrollHeight - element.clientHeight - element.scrollTop
        : element.scrollTop
    
    if (offset <= threshold) {
      if (!isLoadMore && hasMore && onloadMore) {
        onloadMore()
      }
      isLoadMore = true
    } else {
      isLoadMore = false
    }
  }

  $effect(() => {
    if (component || elementScroll) {
      const element = elementScroll ? elementScroll : component.parentNode as HTMLElement

      if (element) {
        element.addEventListener("scroll", onScroll)
        element.addEventListener("resize", onScroll)
      }
    }
  })

  onDestroy(() => {
    if (component || elementScroll) {
      const element = elementScroll ? elementScroll : component.parentNode as HTMLElement

      if (element) {
        element.removeEventListener("scroll", onScroll)
        element.removeEventListener("resize", onScroll)
      }
    }
  })
</script>

<div bind:this={component} style:width="0px"></div>