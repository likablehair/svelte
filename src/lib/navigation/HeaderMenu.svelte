<script lang="ts">
  import type { Item } from "./Navigator.svelte"

  export let title: string = ""; 
  export let items: Item[] = [];

  export let hideOnScroll: boolean = true;
  let scrollY, lastScrollY, visible = true
  function handleScroll() {
    if(hideOnScroll) {
      if(scrollY > lastScrollY) {
        visible = false
      } else {
        visible = true
      }
      lastScrollY = scrollY
    }
  }

  import '$lib/common/tailwind.css';
  import Navigator from './Navigator.svelte'
</script>

<svelte:window
  bind:scrollY={scrollY}
  on:scroll={handleScroll}
></svelte:window>

<nav
  class="
    shadow-md sticky h-12 -top-12 transition-all
    flex flex-wrap items-center
    header-menu-container
  "
  class:top-0={visible}
>
  {#if $$slots.prepend}
    <div class="h-12 flex-none">
      <slot name="prepend"></slot>
    </div>
  {/if}
  <div class="grow ml-1">
    <slot name="title">
      <span class="text-2xl">{title}</span>
    </slot>
  </div>
  <div>
    <Navigator
      items={items}
    ></Navigator>
  </div>
  <slot name="append"></slot>
</nav>

<style>
  .header-menu-container {
    background-color: var(--background-color, white);
    color: var(--color);
    width: var(--width, 100vw)
  }
</style>