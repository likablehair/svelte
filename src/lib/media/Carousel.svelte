<script lang="ts">
  import { onMount } from 'svelte'

  type Image = {
    url: string;
    title: string;
    description: string;
  }

  export let images: Image[] = []

  let container, width: string = '0px', height: string = '0px'
  onMount(() => {
    calculateWidthAndHeight()
  })
  function calculateWidthAndHeight() {
    width = container.offsetWidth + 'px'
    height = container.offsetHeight + 'px'
  }

  $: cssVariables = Object.entries({
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');

  import '$lib/common/tailwind.css';
  import Image from '$lib/media/Image.svelte';
</script>

<svelte:window
  on:resize={calculateWidthAndHeight}
></svelte:window>


<div 
  style={cssVariables} 
  bind:this={container}
  class="container flex flex-nowrap"
>
  {#each images as image}
    <div class="image-container">
      <Image
        src={image.url}
        title={image.title}
        description={image.description}
        disableHover={true}
        showSkeletonLoader={false}
        minWidth={width}
        width={width}
        height={height}
        imageContain={true}
        imageCover={false}
      />
    </div>
  {/each}
</div>

<style>
  .container {
    height: var(--height);
    width: var(--width);
    max-height: var(--max-height);
    max-width: var(--max-width);
    min-height: var(--min-height);
    min-width: var(--min-width);
    overflow-x: scroll;
    scroll-snap-type: x mandatory;
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
  }

  .container::-webkit-scrollbar { 
    display: none;  /* Safari and Chrome */
  }
  .image-container {
    scroll-snap-align: start;
  }
</style>