<script lang="ts">
  type Image = {
    url: string,
    title: string,
    description: string
  }

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

  import Image from './Image.svelte'
</script>

<div
  class="container flex-container"
>
  {#each images as image }
    <div 
      style:width={`calc((100% / var(${columns})) - (10px * ${columns})))`}
      class="image-container"
    >
      <Image
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
      ></Image>
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
    justify-content: start;
    align-items: center;
  }

  .image-container {
    margin-right: 10px;
    margin-bottom: 10px;
  }
</style>