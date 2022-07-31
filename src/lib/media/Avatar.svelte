<script lang="ts">
  export let 
    src: string,
    alt: string = "",
    width: string = "40px",
    maxWidth: string = undefined,
    minWidth: string = undefined,
    height: string = "40px",
    maxHeight: string = undefined,
    minHeight: string = undefined,
    lazyLoaded: boolean = false,
    referrerpolicy: string = "no-referrer",
    borderRadius: string = "50%";

  import Image from '$lib/media/Image.svelte'
</script>

{#if lazyLoaded}
  <Image
    src={src}
    width={width}
    maxWidth={maxWidth}
    minWidth={minWidth}
    height={height}
    maxHeight={maxHeight}
    minHeight={minHeight}
    borderRadius={borderRadius}
    disableHover={true}
    showSkeletonLoader={true}
  ></Image>
{:else}
  <img
    src={src}
    alt={alt}
    style:width={width}
    style:max-width={maxWidth}
    style:min-width={minWidth}
    style:height={height}
    style:max-height={maxHeight}
    style:min-height={minHeight}
    style:border-radius={borderRadius}
    style:object-fit="cover"
    referrerpolicy={referrerpolicy}
  />
{/if}