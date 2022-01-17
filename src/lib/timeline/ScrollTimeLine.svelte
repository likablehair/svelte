<script lang="ts">
  import { onMount } from 'svelte';
  let isMobile: boolean = false;

  let titleElement: HTMLElement;
  onMount(() => {
    titleElement.scrollIntoView({
      block: 'center',
    });
  })
  import '$lib/common/tailwind.css';
</script>

<div class="timeline-container">
  <div 
    class="flex h-full"
    class:flex-col={isMobile}
  >
    <div class="w-1/5 flex flex-col h-full-screen overflow-auto menu-container">
      <div class="flex-none h-screen"></div>
      <div class="font-sans text-2xl subpixel-antialiased font-bold tracking-wide" bind:this={titleElement}>
        Header 1
      </div>
      <div>
        Header 2
      </div>
      <div>
        Header 4
      </div>
      <div>
        Header 5
      </div>
      <div class="flex-none h-screen"></div>
    </div>
    <div class="w-4/5 flex justify-center">
      <div class="h-full">

      </div>
    </div>
  </div>
</div>

<style>
  .timeline-container {
    height: var(--height);
    width: var(--width);
    max-width: var(--max-width);
    max-height: var(--max-height);
  }

  .menu-container {
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
  }
  .menu-container::-webkit-scrollbar { 
    display: none;  /* Safari and Chrome */
  }
</style>