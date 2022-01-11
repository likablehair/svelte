<script lang="ts">
  export let title: string = "";

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
    shadow-md fixed h-12 w-screen -top-12 transition-all
    flex flex-wrap items-center
  "
  class:top-0={visible}
>
  <div class="flex-none w-14 h-12">

  </div>
  <div class="grow">
    <span class="text-2xl">{title}</span>
  </div>
  <div>
    <Navigator></Navigator>
  </div>
</nav>

<style>
</style>