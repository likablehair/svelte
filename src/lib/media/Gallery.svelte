<script lang="ts">
  import type { Image } from "./ImageGrid.svelte";

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

  let selectedIndex: number = undefined, selectedImage: Image = undefined
  function handleImageClick(e) {
    selectedIndex = e.detail.index
  }

  $: if(selectedIndex !== undefined && selectedIndex !== null) {
    selectedImage = images[selectedIndex]
  }

  function switchPrevious() {
    if(selectedIndex < (images.length - 1)) {
      selectedIndex++
    }
  }

  function switchNext() {
    if(selectedIndex > 0) {
      selectedIndex--
    }
  }

  function handleSwipe(e) {
    if(e.detail.direction == 'right') {
      switchPrevious()
    } else if(e.detail.direction == 'left') {
      switchNext()
    } else if(e.detail.direction == 'down') {
      selectedIndex = undefined
    }
  }

  import ImageGrid from "$lib/media/ImageGrid.svelte"
  import ImageComponent from "$lib/media/Image.svelte"
  import Dialog from "$lib/dialogs/Dialog.svelte"
  import Button from "$lib/buttons/Button.svelte"
  import MediaQuery from "$lib/common/MediaQuery.svelte";
  import Gesture from "$lib/common/Gesture.svelte";
</script>

<ImageGrid 
  images={images}
  columns={columns}
  imageMaxWidth={imageMaxWidth}
  imageMinWidth={imageMinWidth}
  imageMaxHeight={imageMaxHeight}
  imageMinHeight={imageMinHeight}
  imageHeight={imageHeight}
  imageWidth={imageWidth}
  disableHover={disableHover}
  dark={dark}
  on:image-click={handleImageClick}
/>

<Gesture
  on:swipe={handleSwipe}
></Gesture>

<MediaQuery
  let:sAndDown
>
  <Dialog
    open={selectedIndex !== undefined && selectedIndex !== null}
    overlayOpacity="80%"
    overlayColor="black"
  >
    <ImageComponent
      src={selectedImage.url}
      height={sAndDown ? "80vh" : "100vh"}
      width={sAndDown ? "100vw" : "80vw"}
      maxWidth="80vw"
      disableHover={true}
      imageContain={true}
      imageCover={false}
      showSkeletonLoader={false}
    ></ImageComponent>
    <svelte:fragment slot="center-left">
      {#if !sAndDown}
        <Button
          type="icon"
          icon="mdi-chevron-left"
          iconSize={30}
          color="white"
          on:click={() => switchNext()}
        ></Button>
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="center-right">
      {#if !sAndDown}
        <Button
          type="icon"
          icon="mdi-chevron-right"
          iconSize={30}
          color="white"
          on:click={() => switchPrevious()}
        ></Button>
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="top-right">
      <Button
        type="icon"
        icon="mdi-close"
        iconSize={30}
        color="white"
        on:click={() => selectedIndex = undefined}
      ></Button>
    </svelte:fragment>
  </Dialog>
</MediaQuery>

<style>
</style>