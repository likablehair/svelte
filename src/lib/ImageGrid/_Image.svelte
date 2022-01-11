<script lang="ts">
  import { SectionType } from "$lib/loaders/sectionType";
  import { browser } from '$app/env';

  export let maxWidth: string = undefined,
    maxHeight: string = undefined,
    minWidth: string = undefined,
    minHeight: string = undefined,
    width: string = undefined,
    height: string = undefined,
    src: string = undefined,
    title: string = undefined,
    description: string = undefined,
    dark: boolean = false,
    disableHover: boolean = false

  const load = (src) => {
		return new Promise<string>(async (resolve, reject) => {
      if(browser) {
        const resp = await fetch(src);
        const blob = await resp.blob();
  
        let reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result.toString());
        reader.onerror = (error) => reject(error);
      } else {
        resolve(undefined)
      }
		});
  };

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

  import IntersectionObserver from '$lib/common/IntersectionObserver.svelte';
  import Skeleton from "$lib/loaders/Skeleton.svelte";
</script>

<div 
  class="image-container"
  style={cssVariables} 
>
  <IntersectionObserver once={true} let:intersecting={intersecting}>
    {#if intersecting}
      {#await load(src)}
        <Skeleton 
          sections={[
            {
              type: SectionType.Image,
              height: `calc(${height || minHeight || maxHeight} - 20px)`
            }
          ]}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          minWidth={minWidth}
          minHeight={minHeight}
          width={width}
          height={height}
          dark={dark}
        ></Skeleton>
      {:then base64}
        <div style="position: relative">
          <div class="image-filter">
            <img 
              src={base64}
              alt={description}
              class="image"
              class:image-hover={!disableHover}
            />
          </div>
          <div 
            class="title"
            class:title-hover={!disableHover}
          >{title || description}</div>
          {#if !!description}
            <div 
              class="description"
              class:description-hover={!disableHover}
            >{description}</div>
          {/if}
        </div>
      {/await}
    {:else}
      <Skeleton
        sections={[
          {
            type: SectionType.Image,
            height: `calc(${height || minHeight || maxHeight} - 20px)`
          }
        ]}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        minWidth={minWidth}
        minHeight={minHeight}
        width={width}
        height={height}
        dark={dark}
      ></Skeleton>
    {/if}
  </IntersectionObserver>
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
    object-fit: cover;
    max-width: var(--max-width);
    max-height: var(--max-height);
    min-width: var(--min-width);
    min-height: var(--min-height);
    width: var(--width);
    height: var(--height);
    transition: all 0.3s ease-in-out;
  }

  .title {
    position: absolute;
    bottom: -40px;
    left: 10px;
    background-color: whitesmoke;
    color: black;
    font-size: 15pt;
    transition: all 0.2s ease-in-out;
  }

  .description {
    position: absolute;
    bottom: -70px;
    left: 10px;
    background-color: whitesmoke;
    color: black;
    font-size: 10pt;
    transition: all 0.2s ease-in-out;
  }

  .image-filter {
    max-width: var(--max-width);
    max-height: var(--max-height);
    min-width: var(--min-width);
    min-height: var(--min-height);
    width: var(--width);
    height: var(--height);
    border-radius: 10px;
    overflow: hidden;
  }

  .image-container:hover .title-hover {
    bottom: 50px
  }

  .image-container:hover .description-hover {
    bottom: 20px
  }

  .image-container:hover .image-hover {
    transform: scale(1.3);
  }
</style>