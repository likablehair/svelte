<script lang="ts">
  import { onMount } from 'svelte'

  type Image = {
    url: string;
    title: string;
    description: string;
  }

  export let 
    images: Image[] = [],
    maxWidth: string = undefined,
    maxHeight: string = undefined,
    minWidth: string = undefined,
    minHeight: string = undefined,
    width: string = "100%",
    height: string = "100%"

  let container, localWidth: string = '0px', localHeight: string = '0px'
  onMount(() => {
    calculateWidthAndHeight()
  })

  function calculateWidthAndHeight() {
    localWidth = container.offsetWidth + 'px'
    localHeight = container.offsetHeight + 'px'
  }

  import Image from '$lib/media/Image.svelte';
</script>

<svelte:window
  on:resize={calculateWidthAndHeight}
></svelte:window>


<div 
  style:max-width={maxWidth}
  style:max-height={maxHeight}
  style:min-width={minWidth}
  style:min-height={minHeight}
  style:width={width}
  style:height={height}
  style:display="flex"
  style:flex-wrap="no-wrap"
  bind:this={container}
  class="container"
>
  {#each images as image}
    <div class="image-container">
      <Image
        src={image.url}
        title={image.title}
        description={image.description}
        disableHover={true}
        showSkeletonLoader={false}
        minWidth={localWidth}
        width={localWidth}
        height={localHeight}
        imageContain={true}
        imageCover={false}
      />
    </div>
  {/each}
</div>

<style>
  .container {
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