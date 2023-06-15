<script lang="ts">
  export let buttonType: "default" | "text" | "icon" = "default",
    type: "button" | "submit" = "button",
    active = false,
    loading = false,
    icon: string | undefined = undefined,
    iconSize = 15,
    disabled = false

  export let _maxWidth: string | undefined = undefined,
    _maxHeight: string | undefined = undefined,
    _minWidth: string | undefined = undefined,
    _minHeight: string | undefined = undefined,
    _width: string | undefined = undefined,
    _height: string | undefined = undefined,
    _textAlign = "center",
    _cursor = "pointer",
    _padding = "8px",
    _fontSize: string | undefined = undefined,
    _color: string | null | undefined = undefined,
    _display: string | undefined = undefined,
    _justifyContent: string | undefined = undefined,
    _alignItems: string | undefined = undefined,
    _backgroundColor: string | undefined = undefined,
    _hoverBackgroundColor = "#88888847",
    _activeBackgroundColor: string = _hoverBackgroundColor,
    _borderRadius: string | undefined = undefined,
    _border: string | undefined = undefined,
    _boxShadow: string | undefined = undefined,
    _loaderHeight: string | undefined = '15px',
    _loaderWidth: string | undefined = undefined

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

  $: defaultBorderRadius = buttonType == "icon" ? "50%" : "5px";
  $: position = $$slots.append ? "relative" : undefined;

  import Icon from "$lib/components/simple/media/Icon.svelte";
  import CircularLoader from "$lib/components/simple/loaders/CircularLoader.svelte";
</script>

<button
  type={type}
  style:box-sizing="content-box"
  style:font-family="inherit"
  style:width={_width}
  style:max-width={_maxWidth}
  style:min-width={_minWidth}
  style:height={_height}
  style:max-height={_maxHeight}
  style:min-height={_minHeight}
  style:text-align={_textAlign}
  style:position
  style:cursor={_cursor}
  style:padding={_padding}
  style:font-size={_fontSize}
  style:color={_color}
  style:display={_display}
  style:justify-content={_justifyContent}
  style:align-items={_alignItems}
  style:--button-border={_border}
  style:--button-border-radius={_borderRadius
    ? _borderRadius
    : defaultBorderRadius}
  style:--button-background-color={active
    ? _activeBackgroundColor
    : _backgroundColor}
  style:--button-hover-background-color={_hoverBackgroundColor}
  style:--button-box-shadow={_boxShadow}
  style:--button-icon-height={iconSize + 5 + "pt"}
  style:--button-icon-width={iconSize + 5 + "pt"}
  class="button no-select"
  class:button-default={buttonType === "default"}
  class:button-text={buttonType === "text"}
  class:button-icon={buttonType === "icon"}
  on:click={handleClick}
  on:keypress={handleKeyPress}
>
  {#if loading}
    <div
      style:height={'calc(' + _loaderHeight + ' + .6rem)'}
      style:display="flex"
      style:justify-content="center"
      style:align-items="center"
    >
      <CircularLoader color={_color} height={_loaderHeight} width={_loaderWidth} />
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
</button>

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
