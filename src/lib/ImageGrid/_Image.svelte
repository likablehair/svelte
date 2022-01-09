<script lang="ts">
  export let maxWidth: string = undefined,
    maxHeight: string = undefined,
    minWidth: string = undefined,
    minHeight: string = undefined,
    width: string = undefined,
    height: string = undefined,
    src: string = undefined,
    description: string = undefined

  $: cssVariables = Object.entries({
      '--max-width': maxWidth,
      '--max-height': maxHeight,
      '--min-width': minWidth,
      '--min-height': minHeight,
      '--width': width,
      '--height': height
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');
</script>

<div 
  class="image-container"
  style={cssVariables} 
>
  <img 
    src={src} 
    alt={description}
    class="image"
  />
</div>

<style>
  .image-container {
    max-width: var(--max-width);
    max-height: var(--max-height);
    min-width: var(--min-width);
    min-height: var(--min-height);
    width: var(--width);
    height: var(--height);
    overflow: hidden;
  }

  .image {
    max-width: var(--max-width);
    object-fit: cover;
    max-width: var(--max-width);
    max-height: var(--max-height);
    min-width: var(--min-width);
    min-height: var(--min-height);
    width: var(--width);
    height: var(--height);
    border-radius: 10px;
  }
</style>