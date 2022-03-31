<script lang="ts">
  export let 
    src: string,
    width: string = "40px",
    maxWidth: string = undefined,
    minWidth: string = undefined,
    height: string = "40px",
    maxHeight: string = undefined,
    minHeight: string = undefined,
    borderRadius: string = "50%";

  import Image from '$lib/media/Image.svelte'
</script>

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