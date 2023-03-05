<script lang="ts">
  import { onMount } from "svelte";
  import Image from "$lib/media/Image.svelte";

  type Image = {
    url: string;
    title: string;
    description: string;
  };

  export let images: Image[] = [],
    maxWidth: string | undefined = undefined,
    maxHeight: string | undefined = undefined,
    minWidth: string | undefined = undefined,
    minHeight: string | undefined = undefined,
    width = "100%",
    height = "100%";

  let container: HTMLElement,
    localWidth = "0px",
    localHeight = "0px";
  onMount(() => {
    calculateWidthAndHeight();
  });

  function calculateWidthAndHeight() {
    localWidth = container.offsetWidth + "px";
    localHeight = container.offsetHeight + "px";
  }
</script>

<svelte:window on:resize={calculateWidthAndHeight} />

<div
  style:max-width={maxWidth}
  style:max-height={maxHeight}
  style:min-width={minWidth}
  style:min-height={minHeight}
  style:width
  style:height
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
    -ms-overflow-style: none; /* Internet Explorer 10+ */
    scrollbar-width: none; /* Firefox */
  }

  .container::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
  .image-container {
    scroll-snap-align: start;
  }
</style>
