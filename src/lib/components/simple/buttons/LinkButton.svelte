<script lang="ts">
  import './LinkButton.css'
  import { createEventDispatcher } from "svelte";
  import Icon from "../media/Icon.svelte";

  let clazz: string = '';
	export { clazz as class };

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

  // props
  export let disabled: boolean = false,
    href: string,
    prependIcon: string | undefined = undefined,
    appendIcon: string | undefined = undefined,
    iconSize: number | undefined = undefined,
    target: string | undefined = undefined
  
  const dispatch = createEventDispatcher<{
    click: {
      nativeEvent: MouseEvent;
    };
    keypress: {
      nativeEvent: KeyboardEvent;
    };
  }>();

  function handleClick(event: MouseEvent) {
    if (disabled) return;
    dispatch("click", {
      nativeEvent: event,
    });
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (disabled) return;
    dispatch("keypress", {
      nativeEvent: event,
    });
  }
</script>

<a
  on:click={handleClick}
  on:keypress={handleKeyPress}
  href={href}
  target={target}
  rel={target == '_blank' ? 'noreferrer' : undefined}
  class="link {clazz}"
>
  <slot name="prepend" {prependIcon} {iconSize}>
    {#if !!prependIcon}
      <Icon name={prependIcon} size={iconSize}></Icon>
    {/if}
  </slot>
  <slot></slot>
  <slot name="append" {appendIcon} {iconSize}>
    {#if !!appendIcon}
      <Icon name={appendIcon} size={iconSize}></Icon>
    {/if}
  </slot>
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