<script lang="ts">
  export let type: "default" | "text" | "icon" = "default",
    active = false,
    loading = false,
    icon: string | undefined = undefined,
    iconSize = 15,
    maxWidth: string | undefined = undefined,
    maxHeight: string | undefined = undefined,
    minWidth: string | undefined = undefined,
    minHeight: string | undefined = undefined,
    width: string | undefined = undefined,
    height: string | undefined = undefined,
    textAlign = "center",
    cursor = "pointer",
    padding = "5px",
    fontSize: string | undefined = undefined,
    color: string | null | undefined = undefined,
    display: string | undefined = undefined,
    justifyContent: string | undefined = undefined,
    alignItems: string | undefined = undefined,
    backgroundColor: string | undefined = undefined,
    hoverBackgroundColor = "#88888847",
    activeBackgroundColor: string = hoverBackgroundColor,
    borderRadius: string | undefined = undefined,
    border: string | undefined = undefined,
    boxShadow: string | undefined = undefined,
    loaderHeight: string | undefined = '15px',
    loaderWidth: string | undefined = undefined,
    disabled = false;

  import { createEventDispatcher } from "svelte";
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

  $: defaultBorderRadius = type == "icon" ? "50%" : "5px";
  $: position = $$slots.append ? "relative" : undefined;

  import Icon from "$lib/components/simple/media/Icon.svelte";
  import CircularLoader from "$lib/components/simple/loaders/CircularLoader.svelte";
</script>

<div
  style:width
  style:max-width={maxWidth}
  style:min-width={minWidth}
  style:height
  style:max-height={maxHeight}
  style:min-height={minHeight}
  style:text-align={textAlign}
  style:position
  style:cursor
  style:padding
  style:font-size={fontSize}
  style:color
  style:display
  style:justify-content={justifyContent}
  style:align-items={alignItems}
  style:--button-border={border}
  style:--button-border-radius={borderRadius
    ? borderRadius
    : defaultBorderRadius}
  style:--button-background-color={active
    ? activeBackgroundColor
    : backgroundColor}
  style:--button-hover-background-color={hoverBackgroundColor}
  style:--button-box-shadow={boxShadow}
  style:--button-icon-height={iconSize + 5 + "pt"}
  style:--button-icon-width={iconSize + 5 + "pt"}
  class="button no-select"
  class:button-default={type === "default"}
  class:button-text={type === "text"}
  class:button-icon={type === "icon"}
  on:click={handleClick}
  on:keypress={handleKeyPress}
>
  {#if loading}
    <div
      style:height={'calc(' + loaderHeight + ' + .6rem)'}
      style:display="flex"
      style:align-items="center"
    >
      <CircularLoader {color} height={loaderHeight} width={loaderWidth} />
    </div>
  {:else}
    {#if !!icon}
      <Icon name={icon} size={iconSize} />
    {:else}
      <slot />
    {/if}
    {#if $$slots.append}
      <span class="append-item">
        <slot name="append" />
      </span>
    {/if}
  {/if}
</div>

<style>
  .append-item {
    position: absolute;
    right: 0px;
  }

  .button {
    overflow: hidden;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }

  .button-default {
    transition: background-color 200ms;
    background-color: var(--button-background-color);
    outline: 0;
    border: var(--button-border);
    border-radius: var(--button-border-radius, 0.25rem);
    box-shadow: var(--button-box-shadow, 0 0 0.5rem rgba(0, 0, 0, 0.3));
  }

  .button-default:hover {
    background-color: var(
      --button-hover-background-color,
      var(--button-background-color)
    );
  }

  .button-text {
    transition: background-color 200ms;
    text-transform: uppercase;
    font-weight: 600;
    outline: 0;
    border: var(--button-border);
    border-radius: var(--button-border-radius, 0.25rem);
  }

  .button-text:hover {
    background-color: var(--button-hover-background-color, transparent);
  }

  .button-icon {
    transition: background-color 200ms;
    outline: 0;
    border: var(--button-border);
    border-radius: var(--button-border-radius, 50%);
    height: var(--button-icon-height) !important;
    width: var(--button-icon-width) !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button-icon:hover {
    background-color: var(--button-hover-background-color, transparent);
  }

  .no-select {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently
                                    supported by Chrome, Edge, Opera and Firefox */
  }
</style>
