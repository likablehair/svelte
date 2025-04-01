<script lang="ts">
  import '../../../css/main.css'
  import './LinkButton.css'
  import { type Snippet } from "svelte";
  import Icon from "../media/Icon.svelte";

  /*
    Styles

    --link-button-color
    --link-button-width
    --link-button-height
    --link-button-font-size
    --link-button-font-weight
    --link-button-line-height
    --link-button-padding
    --link-button-background-color
    --link-button-border-radius
    --link-button-gap
    --link-button-hover-background-color
  */

  interface Props {
    disabled?: boolean;
    href: string;
    prependIcon?: string;
    appendIcon?: string;
    target?: string;
    class?: string;
    onclick?: (event: {
      detail: {
        nativeEvent: MouseEvent
      }
    }) => void
    onkeypress?: (event: {
      detail: {
        nativeEvent: KeyboardEvent
      }
    }) => void
    prependSnippet?: Snippet<[{
      prependIcon: string | undefined
    }]>
    appendSnippet?: Snippet<[{
      appendIcon: string | undefined
    }]>
    children?: Snippet<[]>
  }

  let {
    disabled = false,
    href,
    prependIcon = undefined,
    appendIcon = undefined,
    target = undefined,
    class: clazz = '',
    onclick,
    onkeypress,
    prependSnippet,
    appendSnippet,
    children,
  }: Props = $props();

  function handleClick(event: MouseEvent) {
    if (disabled) return;
    if(onclick){
      onclick({
        detail: {
          nativeEvent: event
        }
      })
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (disabled) return;
    if(onkeypress){
      onkeypress({
        detail: {
          nativeEvent: event
        }
      })
    }
  }
</script>

<a
  onclick={handleClick}
  onkeypress={handleKeyPress}
  href={href}
  target={target}
  rel={target == '_blank' ? 'noreferrer' : undefined}
  class="link {clazz}"
>
  {#if prependSnippet}
    {@render prependSnippet({prependIcon})}
  {:else}
    {#if !!prependIcon}
      <Icon name={prependIcon}></Icon>
    {/if}
  {/if}
  {@render children?.()}
  {#if appendSnippet}
    {@render appendSnippet({appendIcon})}
  {:else}
    {#if !!appendIcon}
      <Icon name={appendIcon}></Icon>
    {/if}
  {/if}
</a>

<style>
  .link {
    color: var(
      --link-button-color,
      var(--link-button-default-color)
    );
    font-size: var(
      --link-button-font-size,
      var(--link-button-default-font-size)
    );
    line-height: var(
      --link-button-line-height,
      var(--link-button-default-line-height)
    );
    padding: var(
      --link-button-padding, 
      var(--link-button-default-padding)
    );
    background-color: var(
      --link-button-background-color, 
      var(--link-button-default-background-color)
    );
    border-radius: var(
      --link-button-border-radius, 
      var(--link-button-default-border-radius)
    );
    width: var(--link-button-width, 
      var(--link-button-default-width)
    );
    height: var(
      --link-button-height,
      var(--link-button-default-height)
    );
    gap: var(
      --link-button-gap, 
      var(--link-button-default-gap)
    );
    font-weight: var(
      --link-button-font-weight, 
      var(--link-button-default-font-weight)
    );
    display: flex;
    justify-content: center;
    align-content: center;
    text-decoration: inherit;
    transition-property: background-color;
    transition-timing-function: ease-in;
    transition-duration: .08s;
  }

  .link:hover {
    background-color: var(
      --link-button-hover-background-color,
      var(--link-button-default-hover-background-color)
    );
  }
</style>