<script lang="ts">
  import type { Image } from "./ImageGrid.svelte";

  export let images: Image[] = [],
    columns: number | undefined = undefined,
    imageMaxWidth: string | undefined = undefined,
    imageMinWidth: string | undefined = undefined,
    imageMaxHeight: string | undefined = undefined,
    imageMinHeight: string | undefined = undefined,
    imageHeight: string | undefined = undefined,
    imageWidth: string | undefined = undefined,
    disableHover = false,
    dark = false;

  let selectedIndex: number | undefined = 0,
    selectedImage: Image | undefined = undefined;
  function handleImageClick(e: CustomEvent) {
    selectedIndex = e.detail.index;
  }

  $: if (selectedIndex !== undefined && selectedIndex !== null) {
    selectedImage = images[selectedIndex];
  }

  function switchPrevious() {
    if (selectedIndex !== undefined && selectedIndex < images.length - 1) {
      selectedIndex++;
    }
  }

  function switchNext() {
    if (selectedIndex !== undefined && selectedIndex > 0) {
      selectedIndex--;
    }
  }

  function handleSwipe(
    e: CustomEvent<{ direction: "right" | "left" | "down" }>
  ) {
    if (e.detail.direction == "right") {
      switchPrevious();
    } else if (e.detail.direction == "left") {
      switchNext();
    } else if (e.detail.direction == "down") {
      selectedIndex = undefined;
    }
  }

  import ImageGrid from "$lib/components/simple/media/ImageGrid.svelte";
  import ImageComponent from "$lib/components/simple/media/Image.svelte";
  import Dialog from "$lib/components/simple/dialogs/Dialog.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
  import Gesture from "$lib/components/simple/common/Gesture.svelte";
</script>

<ImageGrid
  {images}
  {columns}
  {imageMaxWidth}
  {imageMinWidth}
  {imageMaxHeight}
  {imageMinHeight}
  {imageHeight}
  {imageWidth}
  {disableHover}
  {dark}
  on:image-click={handleImageClick}
/>

<Gesture on:swipe={handleSwipe} />

<MediaQuery let:sAndDown>
  <Dialog
    open={selectedIndex !== undefined && selectedIndex !== null}
    overlayOpacity="80%"
    overlayColor="black"
  >
    <ImageComponent
      src={selectedImage?.url}
      height={sAndDown ? "80vh" : "100vh"}
      width={sAndDown ? "100vw" : "80vw"}
      maxWidth="80vw"
      disableHover={true}
      imageContain={true}
      imageCover={false}
      showSkeletonLoader={false}
    />
    <svelte:fragment slot="center-left">
      {#if !sAndDown}
        <Button
          type="icon"
          icon="mdi-chevron-left"
          iconSize={30}
          color="white"
          on:click={() => switchNext()}
        />
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
        />
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="top-right">
      <Button
        type="icon"
        icon="mdi-close"
        iconSize={30}
        color="white"
        on:click={() => (selectedIndex = undefined)}
      />
    </svelte:fragment>
  </Dialog>
</MediaQuery>

<style>
</style>
