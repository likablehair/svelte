<script lang="ts">
  import { createEventDispatcher } from "svelte";

  // css variable
  export let 
    _backgroundColor: string | null = null,
    _border: string | null = null,
    _padding: string | null = null,
    _color: string | null = null,
    _borderRadius: string | null = null,
    _cursor: string | null = null,
    _opacity: string | null = null,
    _transitionTimingFunction: string | null = null,
    _transitionDuration: string | null = null,
    _boxShadow: string | null = null,
    _disabledBackgroundColor: string | null = null,
    _disabledBorder: string | null = null,
    _disabledColor: string | null = null,
    _disabledOpacity: string | null = null,
    _hoverBackgroundColor: string | null = null,
    _hoverBorder: string | null = null,
    _hoverColor: string | null = null,
    _hoverOpacity: string | null = null,
    _hoverBoxShadow: string | null = null,
    _activeBackgroundColor: string | null = null,
    _activeBorder: string | null = null,
    _activeColor: string | null = null,
    _activeOpacity: string | null = null,
    _activeBoxShadow: string | null = null

  // props
  export let disabled: boolean = false,
    active: boolean = false
  
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

<button
  style:--button-disabled-background-color={_disabledBackgroundColor}
  style:--button-disabled-border={_disabledBorder}
  style:--button-disabled-color={_disabledColor}
  style:--button-disabled-opacity={_disabledOpacity}
  style:--button-hover-background-color={_hoverBackgroundColor}
  style:--button-hover-border={_hoverBorder}
  style:--button-hover-color={_hoverColor}
  style:--button-hover-opacity={_hoverOpacity}
  style:--button-hover-box-shadow={_hoverBoxShadow}
  style:--button-active-background-color={_activeBackgroundColor}
  style:--button-active-border={_activeBorder}
  style:--button-active-color={_activeColor}
  style:--button-active-opacity={_activeOpacity}
  style:--button-active-box-shadow={_activeBoxShadow}
  style:--button-background-color={_backgroundColor}
  style:--button-border={_border}
  style:--button-padding={_padding}
  style:--button-color={_color}
  style:--button-border-radius={_borderRadius}
  style:--button-cursor={_cursor}
  style:--button-opacity={_opacity}
  style:--button-transition-timing-function={_transitionTimingFunction}
  style:--button-transition-duration={_transitionDuration}
  style:--button-box-shadow={_boxShadow}
  on:click={handleClick}
  on:keypress={handleKeyPress}
  disabled={disabled}
  class:active={active}
>
  <slot></slot>
</button>

<style>
  button {
    --default-box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

    background-color: var(--button-background-color, rgba(239, 239, 239));
    border: var(--button-border, none);
    padding: var(--button-padding, .875rem 1.2rem);
    color: var(--button-color, inherit);
    border-radius: var(--button-border-radius, .3rem);
    cursor: var(--button-cursor, pointer);
    opacity: var(--button-opacity, 100%);
    box-shadow: var(--button-box-shadow, var(--default-box-shadow));
    transition-property: background-color color box-shadow;
    transition-timing-function: var(--button-transition-timing-function, ease-in-out);
    transition-duration: var(--button-transition-duration, .1s);
  }

  button:disabled {
    background-color: var(--button-disabled-background-color, rgba(239, 239, 239, 0.3));
    border: var(--button-disabled-border, none);
    color: var(--button-disabled-color, inherit);
    opacity: var(--button-disabled-color, 100%);
  }

  button:hover {
    background-color: var(--button-hover-background-color, rgba(126, 126, 126, 0.3));
    border: var(--button-hover-border, none);
    color: var(--button-hover-color, inherit);
    opacity: var(--button-hover-color, 100%);
    box-shadow: var(--button-hover-box-shadow, var(--default-box-shadow));
  }

  button.active {
    background-color: var(--button-active-background-color, rgba(126, 126, 126, 0.3));
    border: var(--button-active-border, none);
    color: var(--button-active-color, inherit);
    opacity: var(--button-active-color, 100%);
    box-shadow: var(--button-active-box-shadow, var(--default-box-shadow));
  }
</style>