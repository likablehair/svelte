<script lang="ts">
  import { BROWSER } from 'esm-env';

  export let maxWidth: string | undefined = undefined,
    maxHeight: string | undefined = undefined,
    minWidth: string | undefined = undefined,
    minHeight: string | undefined = undefined,
    width: string | undefined = undefined,
    height: string | undefined = undefined,
    borderRadius: string | undefined = undefined,
    src: string | undefined = undefined,
    title: string | undefined = undefined,
    description: string | undefined = undefined,
    dark = false,
    disableHover = false,
    showSkeletonLoader = true,
    imageCover = true,
    imageContain = false;

  const load = (src: string | undefined) => {
    return new Promise<string | undefined>((resolve, reject) => {
      if (BROWSER && !!src) {
        fetch(src)
          .then((resp) => {
            resp
              .blob()
              .then((blob) => {
                let reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = () => resolve(reader.result?.toString() || "");
                reader.onerror = (error) => reject(error);
              })
              .catch((err) => reject(err));
          })
          .catch((err) => reject(err));
      } else {
        resolve(undefined);
      }
    });
  };

  import IntersectionObserver from "$lib/common/IntersectionObserver.svelte";
  import Skeleton from "$lib/loaders/Skeleton.svelte";
</script>

<div
  style:width
  style:max-width={maxWidth}
  style:min-width={minWidth}
  style:height
  style:max-height={maxHeight}
  style:min-height={minHeight}
  style:border-radius={borderRadius}
  class="image-container"
  on:click
  on:keypress
>
  <IntersectionObserver once={true} let:intersecting>
    {#if intersecting}
      {#await load(src)}
        {#if showSkeletonLoader}
          <Skeleton
            sections={[
              {
                type: "image",
                height: `100%`,
              },
            ]}
            padding="0px"
            width="100%"
            height="100%"
            {dark}
          />
        {/if}
      {:then base64}
        <div style="position: relative; height: 100%">
          <div class="image-filter">
            <div
              style:background-size={imageCover
                ? "cover"
                : imageContain
                ? "contain"
                : undefined}
              style:background-image={`url(${base64})`}
              class="image"
              class:image-hover={!disableHover}
            >
              <slot />
            </div>
          </div>
          <div class="title" class:title-hover={!disableHover}>
            {title || description}
          </div>
          {#if !!description}
            <div class="description" class:description-hover={!disableHover}>
              {description}
            </div>
          {/if}
        </div>
      {/await}
    {:else if showSkeletonLoader}
      <Skeleton
        sections={[
          {
            type: "image",
            height: `100%`,
          },
        ]}
        padding="0px"
        width="100%"
        height="100%"
        {dark}
      />
    {/if}
  </IntersectionObserver>
</div>

<style>
  .image-container {
    overflow: hidden;
  }

  .image {
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
    bottom: 50px;
  }

  .image-container:hover .description-hover {
    bottom: 20px;
  }

  .image-container:hover .image-hover {
    transform: scale(1.3);
  }
</style>
