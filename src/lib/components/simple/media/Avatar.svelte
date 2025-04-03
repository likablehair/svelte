<script lang="ts">
  import './Avatar.css'
  import '../../../css/main.css'
  import { BROWSER } from 'esm-env';
  import type { Snippet } from 'svelte';

  interface Props {
    src?: string;
    alt?: string;
    text?: string;
    referrerpolicy?: ReferrerPolicy | undefined;
    imageLoadingStatus?: 'error' | 'success';
    children?: Snippet<[]>
  }

  let {
    src = undefined,
    alt = "",
    text = undefined,
    referrerpolicy = "no-referrer",
    imageLoadingStatus = $bindable("success"),
    children,
  }: Props = $props();

  $effect(() => {
    if(!!src && BROWSER) {
      let image = new Image()
      image.src = src
      image.onload = () => {
        imageLoadingStatus = 'success'
      }
      image.onerror = () => {
        imageLoadingStatus = 'error'
      }
    }
  })
</script>

{#if !!src && imageLoadingStatus == 'success'}
  <img
    class="avatar"
    {src}
    {alt}
    {referrerpolicy}
  />
{:else}
  {#if children}
    {@render children()}
  {:else}
    <div class="avatar">{text || ''}</div>
  {/if}
{/if}

<style>
  .avatar {
    width: var(
      --avatar-width,
      var(--avatar-default-width)
    );
    height: var(
      --avatar-height,
      var(--avatar-default-height)
    );
    min-width: var(--avatar-min-width);
    max-width: var(--avatar-max-width);
    height: var(
      --avatar-height,
      var(--avatar-default-height)
    );
    min-height: var(--avatar-min-height);
    max-height: var(--avatar-max-height);
    border-radius: var(
      --avatar-border-radius,
      var(--avatar-default-border-radius)
    );
    border: var(
      --avatar-border,
      var(--avatar-default-border)
    )
  }

  img {
    object-fit: cover;
  }

  div {
    background-color: var(
      --avatar-background-color,
      var(--avatar-default-background-color)
    );
    color: var(
      --avatar-text-color,
      var(--avatar-default-text-color)
    );
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: var(
      --avatar-text-size,
      calc(
        var(
          --avatar-height,
          var(--avatar-default-height)
        ) - calc(
          var(
            --avatar-height,
            var(--avatar-default-height)
          ) / 1.7
        )
      )
    );
    font-weight: var(
      --avatar-text-weight,
      var(--avatar-default-text-weight)
    );
  }
</style>
