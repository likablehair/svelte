<script lang="ts">
  export let src: string,
    alt = "",
    width = "40px",
    maxWidth: string | undefined = undefined,
    minWidth: string | undefined = undefined,
    height = "40px",
    maxHeight: string | undefined = undefined,
    minHeight: string | undefined = undefined,
    lazyLoaded = false,
    referrerpolicy: ReferrerPolicy | null | undefined = "no-referrer",
    borderRadius = "50%";

  import Image from "$lib/media/Image.svelte";
</script>

{#if lazyLoaded}
  <Image
    {src}
    {width}
    {maxWidth}
    {minWidth}
    {height}
    {maxHeight}
    {minHeight}
    {borderRadius}
    disableHover={true}
    showSkeletonLoader={true}
  />
{:else}
  <img
    {src}
    {alt}
    style:width
    style:max-width={maxWidth}
    style:min-width={minWidth}
    style:height
    style:max-height={maxHeight}
    style:min-height={minHeight}
    style:border-radius={borderRadius}
    style:object-fit="cover"
    {referrerpolicy}
  />
{/if}
