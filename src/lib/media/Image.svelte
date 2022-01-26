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
    disableHover: boolean = false,
    showSkeletonLoader: boolean = true,
    imageCover: boolean = true,
    imageContain: boolean = false

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
      '--height': height,
      '--object-fit': imageCover ? 'cover' : imageContain ? 'contain' : undefined,
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
        {#if showSkeletonLoader}
          <Skeleton
            sections={[
              {
                type: SectionType.Image,
                height: `100%`
              }
            ]}
            padding="0px"
            width="100%"
            height="100%"
            dark={dark}
          ></Skeleton>
        {/if}
      {:then base64}
        <div style="position: relative; height: 100%">
          <div class="image-filter">
            <div
              style={'background-image: url(' + base64 + ')'}
              class="image"
              class:image-hover={!disableHover}
            >
              <slot></slot>
            </div>
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
      {#if showSkeletonLoader}
        <Skeleton
          sections={[
            {
              type: SectionType.Image,
              height: `100%`
            }
          ]}
          padding="0px"
          width="100%"
          height="100%"
          dark={dark}
        ></Skeleton>
      {/if}
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
    border-radius: var(--border-radius);
    overflow: hidden;
  }

  .image {
    background-size: var(--object-fit);
    background-repeat: no-repeat;
    background-position: center center;
    width: 100%;
    height: 100%;
    transition: all 0.3s ease-in-out;
    border-radius: var(--border-radius);
    position: relative;
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
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
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