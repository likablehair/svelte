<script lang="ts" context="module">
  export type SectionType = "image" | "text"
</script>

<script lang="ts">
  type Section = {
    type: SectionType,
    height?: string
  }

  export let sections: Section[] = [],
    maxWidth: string = undefined,
    maxHeight: string = undefined,
    minWidth: string = undefined,
    minHeight: string = undefined,
    width: string = "100%",
    height: string = "100%",
    padding: string = '10px',
    dark: boolean = false
  
  $: widthLessPadding = `calc(${width} - (${padding} * 2))`
  $: heightLessPadding = `calc(${height} - (${padding} * 2))`
  $: maxWidthLessPadding = `calc(${maxWidth} - (${padding} * 2))`
  $: maxHeightLessPadding = `calc(${maxHeight} - (${padding} * 2))`
  $: minWidthLessPadding = `calc(${minWidth} - (${padding} * 2))`
  $: minHeightLessPadding = `calc(${minHeight} - (${padding} * 2))`
  $: elementBackground = dark ? '#1a1a1a' : '#eee'
  $: animationBackground = dark ? '#000000e6' : '#ffffffe6'
  $: cardBackground = dark ? '#000000' : '#fff'
</script>


<div 
  style:--skeleton-card-background={cardBackground}
  style:--skeleton-animation-color={animationBackground}
  style:width={widthLessPadding}
  style:height={heightLessPadding}
  style:max-width={maxWidthLessPadding}
  style:max-height={maxHeightLessPadding}
  style:min-width={minWidthLessPadding}
  style:min-height={minHeightLessPadding}
  style:padding={padding}
  class="card"
>
  {#each sections as section}
    {#if section.type == 'image'}
      <div 
        style:height={section.height}
        style:background={elementBackground}
        class="skeleton-image"
      ></div>
    {/if}
  {/each}
</div>

<style>
  .skeleton-image {
    margin-bottom: 10px;
    border-radius: 5px;
    overflow: hidden;
    width: 100%;
  }
  
  .card {
    background: var(--skeleton-card-background);
    position: relative;
    border-radius: 5px;
    box-shadow: 0 10px 100px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  @keyframes loading {
    0% {
      transform: skewX(-10deg) translateX(-100%);
    }
    100% {
      transform: skewX(-10deg) translateX(200%);
    }
  }

  .card::before {
    content: '';
    position: absolute;
    background: linear-gradient(
      90deg,
      transparent,
      var(--skeleton-animation-color),
      transparent
    );
    width: 50%;
    height: 100%;
    top: 0;
    left: 0;
    animation: loading 1s infinite;
  }
</style>