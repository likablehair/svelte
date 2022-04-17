<script lang="ts" context="module">
  export type Image = {
    url: string,
    title: string,
    description: string
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let images: Image[] = [],
    columns: number = undefined,
    imageMaxWidth: string = undefined,
    imageMinWidth: string = undefined,
    imageMaxHeight: string = undefined,
    imageMinHeight: string = undefined,
    imageHeight: string = undefined,
    imageWidth: string = undefined,
    disableHover: boolean = false,
    dark: boolean = false

  const dispatch = createEventDispatcher<{
    'image-click': {
      image: Image,
      index: number
    }
  }>()

  function handleImageClick(image: Image, index: number) {
    dispatch("image-click", {
      image,
      index
    })
  }

  import ImageComponent from './Image.svelte'
</script>

<div
  class="container flex-container"
>
  {#each images as image, index }
    <div 
      style:width={`calc((100% / var(${columns})) - (10px * ${columns})))`}
      class="image-container"
    >
      <ImageComponent
        src={image.url}
        height={imageHeight}
        width={imageWidth}
        maxWidth={imageMaxWidth}
        minWidth={imageMinWidth}
        maxHeight={imageMaxHeight}
        minHeight={imageMinHeight}
        description={image.description}
        disableHover={disableHover}
        dark={dark}
        borderRadius="10px"
        on:click={() => handleImageClick(image, index)}
      ></ImageComponent>
    </div>
  {/each}
</div>

<style>
  .container {
    width: 100%
  }

  .flex-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
  }

  .image-container {
    margin-right: 10px;
    margin-bottom: 10px;
  }
</style>