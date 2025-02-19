<script lang="ts">
  import { onDestroy, createEventDispatcher } from "svelte";

  export let treshold: number = 0,
    horizontal: boolean = false,
    elementScroll: HTMLElement | null = null,
    hasMore: boolean = true,
    direction: 'forward' | 'backward' = 'forward'

  const dispatch = createEventDispatcher<{
    'loadMore': undefined
  }>();
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
    
    if (offset <= treshold) {
      if (!isLoadMore && hasMore) {
        dispatch("loadMore")
      }
      isLoadMore = true
    } else {
      isLoadMore = false
    }
  }

  $: {
    if (component || elementScroll) {
      const element = elementScroll ? elementScroll : component.parentNode as HTMLElement

      if (element) {
        element.addEventListener("scroll", onScroll)
        element.addEventListener("resize", onScroll)
      }
    }
  }

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

<div bind:this={component} style:width="0px" />