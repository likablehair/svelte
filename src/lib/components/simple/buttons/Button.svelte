<script lang="ts">
  import '../../../css/main.css'
  import './Button.css'

  interface Props extends Omit<HTMLButtonAttributes, 
    'onclick' | 'onkeypress' | 'onkeydown' | 'children'> {    
    buttonType?: "default" | "text" | "icon";
    type?: "button" | "submit";
    loading?: boolean;
    icon?: string;
    tabindex?: number | null;
    disabled?: boolean;
    buttonElement?: HTMLElement | undefined;
    class?: string
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
    onkeydown?: (event: {
      detail: {
        nativeEvent: KeyboardEvent
      }
    }) => void
    children?: Snippet<[]>
    appendSnippet?: Snippet<[]>
  }

  let {
    buttonType = "default",
    type = "button",
    loading = false,
    icon = undefined,
    tabindex = null,
    disabled = false,
    buttonElement = $bindable(undefined),
    class: clazz = '',
    onclick,
    onkeydown,
    onkeypress,
    appendSnippet,
    children,
    ...rest
  }: Props = $props();

  function handleClick(event: MouseEvent) {
    if (disabled) return;
    if(onclick){
      onclick({
        detail: {
          nativeEvent: event,
        }
      })
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (disabled) return;
    if(onkeypress){
      onkeypress({
        detail: {
          nativeEvent: event,
        }
      })
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (disabled) return;
    if(onkeydown){
      onkeydown({
        detail: {
          nativeEvent: event,
        }
      })
    }
  }

  let position = $derived(appendSnippet ? "relative" : undefined)

  import Icon from "$lib/components/simple/media/Icon.svelte";
  import CircularLoader from "$lib/components/simple/loaders/CircularLoader.svelte";
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
</script>

<button
  type={type}
  style:position
  class:button-default={buttonType === "default"}
  class:button-text={buttonType === "text"}
  class:button-icon={buttonType === "icon"}
  class:disabled={disabled}
  onclick={handleClick}
  onkeypress={handleKeyPress}
  onkeydown={handleKeyDown}
  tabindex={tabindex}
  class="button no-select {clazz || ''}"
  bind:this={buttonElement}
  {...rest}
>
  {#if loading}
    <div
      style:display="flex"
      style:justify-content="center"
      style:align-items="center"
    >
      <CircularLoader 
        --circular-loader-color="var(--button-color)"
      />
    </div>
  {:else}
    {#if !!icon}
      <Icon name={icon} />
    {:else}
      {@render children?.()}
    {/if}
    {#if appendSnippet}
      <span class="append-item">
        {@render appendSnippet()}
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
    box-sizing: var(
      --button-box-sizing,
      var(--button-default-box-sizing)
    );
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    width: var(
      --button-width,
      var(--button-default-width)
    );
    max-width: var(
      --button-max-width,
      var(--button-default-max-width)
    );
    min-width: var(
      --button-min-width,
      var(--button-default-min-width)
    );
    height: var(
      --button-height,
      var(--button-default-height)
    );
    max-height: var(
      --button-max-height,
      var(--button-default-max-height)
    );
    min-height: var(
      --button-min-height,
      var(--button-default-min-height)
    );
    text-align: var(
      --button-text-align,
      var(--button-default-text-align)
    );
    cursor: var(
      --button-cursor,
      var(--button-default-cursor)
    );
    padding: var(
      --button-padding,
      var(--button-default-padding)
    );
    font-size: var(
      --button-font-size,
      var(--button-default-font-size)
    );
    display: var(
      --button-display,
      var(--button-default-display)
    );
    justify-content: var(
      --button-justify-content,
      var(--button-default-justify-content)
    );
    align-items: var(
      --button-align-items,
      var(--button-default-align-items)
    );
    border: var(
      --button-border,
      var(--button-default-border)
    );
  }

  .button-default {
    transition: background-color 200ms;
    outline: 0;
    border-radius: var(
      --button-border-radius, 
      var(--button-default-border-radius)
    );
    box-shadow: var(
      --button-box-shadow,
      var(--button-default-box-shadow)
    );
    background-color: var(
      --button-background-color,
      var(--button-default-background-color)
    );
    color: var(
      --button-color,
      var(--button-default-color)
    );
    font-weight: var(
      --button-font-weight,
      var(--button-default-font-weight)
    );
  }

  .button-default.disabled {
    cursor: not-allowed;
    background-color: var(
      --button-disabled-background-color,
      var(--button-default-disabled-background-color)
    );
    color: var(
      --button-disabled-color,
      var(--button-default-disabled-color)
    );
  }

  .button-default:hover:not(.disabled) {
    background-color: var(
      --button-hover-background-color,
      var(--button-default-hover-background-color)
    );
    color: var(
      --button-hover-color,
      var(--button-default-hover-color)
    );
    box-shadow: var(
      --button-hover-box-shadow,
      var(--button-default-hover-box-shadow)
    );
  }

  .button-default:active:not(.disabled) {
    background-color: var(
      --button-active-background-color,
      var(--button-default-active-background-color)
    );
    box-shadow: var(
      --button-active-box-shadow,
      var(--button-default-active-box-shadow)
    );
  }

  .button-default:focus:not(.disabled) {
    background-color: var(
      --button-focus-background-color,
      var(--button-default-focus-background-color)
    );
    color: var(
      --button-focus-color,
      var(--button-default-focus-color)
    );
    box-shadow: var(
      --button-focus-box-shadow,
      var(--button-default-focus-box-shadow)
    );
  }

  .button-text {
    transition: background-color 200ms;
    text-transform: uppercase;
    letter-spacing: .05rem;
    outline: 0;
    border-radius: var(
      --button-border-radius, 
      var(--button-default-border-radius)
    );
    color: var(
      --button-color,
      var(--button-default-text-color)
    );
    background-color: var(
      --button-background-color,
      var(--button-default-text-background-color)
    );
    font-weight: var(
      --button-font-weight,
      var(--button-default-text-font-weight)
    );
  }

  .button-text.disabled {
    cursor: not-allowed;
    background-color: var(
      --button-disabled-background-color,
      var(--button-default-disabled-background-color)
    );
    color: var(
      --button-disabled-color,
      var(--button-default-disabled-color)
    );
  }

  .button-text:hover:not(.disabled) {
    background-color: var(
      --button-hover-background-color,
      var(--button-default-text-hover-background-color)
    );
    color: var(
      --button-hover-color,
      var(--button-default-text-hover-color)
    );
  }

  .button-text:active:not(.disabled) {
    background-color: var(
      --button-active-background-color,
      var(--button-default-text-active-background-color)
    );
    color: var(
      --button-active-color,
      var(--button-default-text-active-color)
    );
  }

  .button-text:focus:not(.disabled) {
    background-color: var(
      --button-focus-background-color,
      var(--button-default-text-focus-background-color)
    );
    color: var(
      --button-focus-color,
      var(--button-default-text-focus-color)
    );
  }

  .button-icon {
    transition: background-color 200ms;
    outline: 0;
    border-radius: var(
      --button-border-radius, 
      var(--button-default-icon-border-radius)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(
      --button-background-color,
      var(--button-default-background-color)
    );
    color: var(
      --button-color,
      var(--button-default-icon-color)
    );
    font-weight: var(
      --button-font-weight,
      var(--button-default-font-weight)
    );
    border-radius: var(
      --button-border-radius, 
      var(--button-default-icon-border-radius)
    );
  }

  .button-icon:hover {
    background-color: var(--button-hover-background-color, transparent);
  }

  .button-icon:active:not(.disabled) {
    color: var(
      --button-active-color,
      var(--button-default-icon-active-color)
    );
  }

  .button-icon:focus:not(.disabled) {
    color: var(
      --button-focus-color,
      var(--button-default-icon-focus-color)
    );
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
