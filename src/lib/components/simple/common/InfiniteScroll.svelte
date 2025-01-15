<script lang="ts">
  import { onDestroy, createEventDispatcher } from "svelte";

  export let treshold: number = 0,
    horizontal: boolean = false,
    elementScroll: HTMLElement | null = null,
    hasMore: boolean = true

  const dispatch = createEventDispatcher();
  let isLoadMore = false,
    component: HTMLElement;

  function onScroll(e: Event) {
    const element = e.target as HTMLElement

    const offset = horizontal 
      ? element.scrollWidth - element.clientWidth - element.scrollLeft
      : element.scrollHeight - element.clientHeight - element.scrollTop

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