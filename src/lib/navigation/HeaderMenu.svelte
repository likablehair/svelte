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

  import Navigator from './Navigator.svelte'
</script>

<svelte:window
  bind:scrollY={scrollY}
  on:scroll={handleScroll}
></svelte:window>

<nav
  style:position="sticky"
  style:display="flex"
  style:flex-wrap="wrap"
  style:align-items="center"
  style:height="56px"
  class="shadow-md transition-all header-menu-container"
  class:-top-14={!visible}
  class:top-0={visible}
>
  {#if $$slots.prepend}
    <div 
      style:height="56px"
      style:flex="none"
    >
      <slot name="prepend"></slot>
    </div>
  {/if}
  <div 
    style:flex-grow="1"
    style:margin-left="4px"
  >
    <slot name="title">
      <span 
        style:font-size="24px"
        style:line-height="32px"
      >{title}</span>
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

  .shadow-md {
    --shadow-color: #000;
    --ring-inset: inset;
    --ring-offset-width: 0px;
    --ring-color: rgb(255 255 255/0.1);
    --ring-offset-shadow: var(--ring-inset) 0 0 0 calc(1px + var(--ring-offset-width)) var(--ring-color);
    --ring-shadow: 0 0 #0000;
    --shadow: 0 0 #0000;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-colored: 0 4px 6px -1px var(--shadow-color), 0 2px 4px -2px var(--shadow-color);
    box-shadow: var(--ring-offset-shadow, 0 0 #0000), var(--ring-shadow, 0 0 #0000), var(--shadow);
  }

  .-top-14 {
    top: -56px;
  }

  .top-0 {
    top: 0;
  }

  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
</style>