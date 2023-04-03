<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Icon from "../media/Icon.svelte";

  // css variable
  export let _color: string | null = null,
    _fontSize: string | null = null,
    _lineHeight: string | null = null,
    _padding: string | null = null,
    _backgroundColor: string | null = null,
    _hoverBackgroundColor: string | null = null,
    _borderRadius: string | null = null,
    _width: string | null = null,
    _height: string | null = null,
    _gap: string | null = null,
    _fontWeight: string | null = null

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
  style:--link-button-color={_color}
  style:--link-button-width={_width}
  style:--link-button-height={_height}
  style:--link-button-font-size={_fontSize}
  style:--link-button-font-weight={_fontWeight}
  style:--link-button-line-height={_lineHeight}
  style:--link-button-padding={_padding}
  style:--link-button-background-color={_backgroundColor}
  style:--link-button-border-radius={_borderRadius}
  style:--link-button-gap={_gap}
  style:--link-button-hover-background-color={_hoverBackgroundColor}
  class="link"
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
    color: var(--link-button-color, inherit);
    font-size: var(--link-button-font-size, .875rem);
    line-height: var(--link-button-line-height, 1.5rem);
    padding: var(--link-button-padding, 0.25rem 0.75rem 0.25rem 0.75rem);
    background-color: var(--link-button-background-color, rgb(244 244 245/1));
    border-radius: var(--link-button-border-radius, 9999px);
    width: var(--link-button-width, fit-content);
    height: var(--link-button-height, auto);
    gap: var(--link-button-gap, 0.5rem);
    font-weight: var(--link-button-font-weight, 500);
    display: flex;
    justify-content: center;
    align-content: center;
    text-decoration: inherit;
    transition-property: background-color;
    transition-timing-function: ease-in;
    transition-duration: .08s;
  }

  .link:hover {
    background-color: var(--link-button-hover-background-color, rgb(228 228 231/1));
  }
</style>