<script lang="ts">
  import { createEventDispatcher } from "svelte";
    import Icon from "../media/Icon.svelte";

  export let disabled: boolean = false,
    color: string = "inherit",
    fontSize: string = ".875rem",
    lineHeight: string = "1.5rem",
    padding: string = "0.25rem 0.75rem 0.25rem 0.75rem",
    backgroundColor: string = "rgb(244 244 245/1)",
    hoverBackgroundColor: string = "rgb(228 228 231/1)",
    borderRadius: string = "9999px",
    width: string = "fit-content",
    height: string = "auto",
    gap: string = "0.5rem",
    fontWeight: string = "500",
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
  style:color={color}
  style:width={width}
  style:height={height}
  style:font-size={fontSize}
  style:font-weight={fontWeight}
  style:line-height={lineHeight}
  style:padding={padding}
  style:background-color={backgroundColor}
  style:border-radius={borderRadius}
  style:gap={gap}
  style:--link-button-hover-background-color={hoverBackgroundColor}
  class="link"
>
  {#if !!prependIcon}
    <Icon name={prependIcon} size={iconSize}></Icon>
  {/if}
  <slot></slot>
  {#if !!appendIcon}
    <Icon name={appendIcon} size={iconSize}></Icon>
  {/if}
</a>

<style>
  .link {
    display: flex;
    justify-content: center;
    align-content: center;
    text-decoration: inherit;
    transition-property: background-color;
    transition-timing-function: ease-in;
    transition-duration: .08s;
  }

  .link:hover {
    background-color: var(--link-button-hover-background-color) !important;
  }
</style>