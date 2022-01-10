<script lang="ts">
  import type { SectionType } from './sectionType';

  type Section = {
    type: SectionType,
    height?: string
  }

  export let sections: Section[] = [],
    maxWidth: string = undefined,
    maxHeight: string = undefined,
    minWidth: string = undefined,
    minHeight: string = undefined,
    width: string = undefined,
    height: string = undefined,
    dark: boolean = false

  $: cssVariables = Object.entries({
      '--max-width': maxWidth,
      '--max-height': maxHeight,
      '--min-width': minWidth,
      '--min-height': minHeight,
      '--width': width,
      '--height': height,
      '--card-background': dark ? '#000000' : '#fff',
      '--element-background': dark ? '#1a1a1a' : '#eee',
      '--animation-color': dark ? '#000000e6' : '#ffffffe6',
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');
</script>

<div class="card" style={cssVariables}>
  {#each sections as section}
    {#if section.type == 'image'}
      <div 
        class="skeleton-image"
        style="height: {section.height}"
      ></div>
    {/if}
  {/each}
</div>

<style>
  .skeleton-image {
    background: var(--element-background);
    margin-bottom: 10px;
    border-radius: 5px;
    overflow: hidden;
    width: 100%;
  }
  
  .card {
    background: var(--card-background);
    position: relative;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 10px 100px rgba(0, 0, 0, 0.1);
    width: calc(var(--width) - 20px);
    height: calc(var(--height) - 20px);
    max-width: calc(var(--max-width) - 20px);
    max-height: calc(var(--max-height) - 20px);
    min-width: calc(var(--min-width) - 20px);
    min-height: calc(var(--min-height) - 20px);
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
      var(--animation-color),
      transparent
    );
    width: 50%;
    height: 100%;
    top: 0;
    left: 0;
    animation: loading 1s infinite;
  }
</style>