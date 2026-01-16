<script lang="ts">
  import '../../../css/main.css'
  import './Chip.css'
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import { type ComponentProps, type Snippet } from "svelte";

  interface Props {
    close?: boolean;
    closeIcon?: string;
    disabled?: boolean;
    prependIcon?: string;
    inactive?: boolean;
    buttonTabIndex?: number | null;
    truncateText?: boolean;
    onclick?: (event: {
      detail: {
        native: MouseEvent
      }
    }) => void
    onclose?: (event: {
      detail: {
        native: MouseEvent
      }
    }) => void
    children?: Snippet<[]>
  }

  let {
    close = $bindable(false),
    closeIcon = "mdi-close-circle",
    disabled = false,
    prependIcon,
    inactive = false,
    buttonTabIndex = null,
    truncateText = false,
    onclick,
    onclose,
    children,
  }: Props = $props();

  function handleChipClick(e: MouseEvent | KeyboardEvent) {
    let native: MouseEvent;
    
    if (e instanceof KeyboardEvent) {
      if (e.key !== "Enter" && e.key !== " ") return
      native = new PointerEvent("click", { bubbles: true, cancelable: true })
      e.currentTarget?.dispatchEvent(native)
    } 
    else if (onclick){
      onclick({
        detail: {
          native: e
        }
      })
    }
  }

  function handleCloseClick(e: Parameters<NonNullable<ComponentProps<typeof Button>['onclick']>>[0]) {
    e.detail.nativeEvent.stopPropagation()
    if(onclose) {
      onclose({
        detail: {
          native: e.detail.nativeEvent
        }
      })
    }
  }
</script>

<div
  class="chip"
  class:inactive
  class:disabled
  role="button"
  tabindex={disabled ? -1 : buttonTabIndex}
  onclick={handleChipClick}
  onkeydown={handleChipClick}
>
  {#if prependIcon}
    <Icon name={prependIcon} />
  {/if}
  <div
    class="text"
    class:truncate={truncateText}
  >
    {@render children?.()}
  </div>
  {#if close}
    <div class="icon-after">
      <Button
        icon={closeIcon}
        buttonType="icon"
        tabindex={buttonTabIndex}
        --button-background-color="transparent"
        --button-padding="0px"
        --button-color="var(--chip-color, var(--chip-default-color))"
        --button-default-icon-active-color="var(--chip-color, var(--chip-default-color))"
        --button-default-focus-active-color="var(--chip-color, var(--chip-default-color))"
        onclick={handleCloseClick}
      />
    </div>
  {/if}
</div>

<style>
  .chip {
    text-align: center;
    display: flex;
    align-items: center;
    min-height: var(
      --chip-min-height,
      var(--chip-default-min-height)
    );
    height: var(
      --chip-height,
      var(--chip-default-height)
    );
    padding: var(
      --chip-padding,
      var(--chip-default-padding)
    );
    cursor: var(
      --chip-cursor,
      var(--chip-default-cursor)
    );
    gap: var(
      --chip-gap,
      var(--chip-default-gap)
    );

    outline: inherit;
    background-image: none;
    text-transform: none;
    line-height: inherit;
    border: none;
    font: inherit;
  }
  .inactive {
    border: var(
      --chip-inactive-border,
      var(--chip-default-inactive-border)
    );
    border-color: var(
      --chip-inactive-border-color,
      var(--chip-default-inactive-border-color)
    );
    color: var(
      --chip-inactive-color,
      var(--chip-default-inactive-color)
    );
    background-color: var(
      --chip-inactive-background-color,
      var(--chip-default-inactive-background-color)
    );
  }

  .truncate {
    max-width: var(--chip-text-max-width, var(--chip-default-text-max-width));
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }


  .chip:not(.inactive) {
    background-color: var(
      --chip-background-color,
      var(--chip-default-background-color)
    );
    color: var(
      --chip-color,
      var(--chip-default-color)
    );
  }

  .chip:not(.inactive):hover {
    background-color: var(
      --chip-hover-background-color,
      var(--chip-default-hover-background-color)
    );
  }

  .chip:not(.inactive):focus {
    background-color: var(
      --chip-focus-background-color,
      var(--chip-default-focus-background-color)
    );
  }

  .chip.inactive:hover {
    background-color: var(
      --chip-inactive-hover-background-color,
      var(--chip-default-inactive-hover-background-color)
    );
    color: var(
      --chip-inactive-hover-color,
      var(--chip-default-inactive-hover-color)
    );
  }

  .chip.inactive:focus {
    background-color: var(
      --chip-inactive-focus-background-color,
      var(--chip-default-inactive-focus-background-color)
    );
    color: var(
      --chip-inactive-focus-color,
      var(--chip-default-inactive-focus-color)
    );
  }

  .chip.inactive:focus {
    color: var(
      --chip-inactive-focus-color,
      var(--chip-default-inactive-focus-color)
    );
    border-color: var(
      --chip-inactive-focus-border-color,
      var(--chip-default-inactive-border-focus-color)
    );
    box-shadow: var(
      --chip-inactive-focus-box-shadow,
      var(--chip-default-inactive-focus-box-shadow)
    );
  }

  .chip {
    border-radius: var(
      --chip-border-radius,
      var(--chip-default-border-radius)
    );
  }

  .icon-after {
    float: right;
    margin-left: 10px;
  }
  .text {
    vertical-align: middle;
    user-select: none;
    font-size: var(
      --chip-font-size,
      var(--chip-default-font-size)
    );
    line-height: var(
      --chip-line-height,
      var(--chip-default-line-height)
    );
    font-weight: var(
      --chip-font-weight,
      var(--chip-default-font-weight)
    );
  }
  .disabled {
    pointer-events: none;
    opacity: 0.4;
  }
</style>
