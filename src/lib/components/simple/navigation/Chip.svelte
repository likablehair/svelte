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
    filter?: boolean;
    filterIcon?: string;
    label?: boolean;
    outlined?: boolean;
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
    filter = false,
    filterIcon = "mdi-check",
    label = false,
    outlined = false,
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
  class:label
  class:outlined
  class:disabled
  role="button"
  tabindex={disabled ? -1 : buttonTabIndex}
  onclick={handleChipClick}
  onkeydown={handleChipClick}
>
  {#if filter}
    <div class="icon-before">
      <Icon name={filterIcon} />
    </div>
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

    outline: inherit;
    background-image: none;
    text-transform: none;
    line-height: inherit;
    border: none;
    font: inherit;
  }

  .truncate {
    max-width: var(--chip-text-max-width, var(--chip-default-text-max-width));
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }


  .chip:not(.outlined) {
    background-color: var(
      --chip-background-color,
      var(--chip-default-background-color)
    );
    color: var(
      --chip-color,
      var(--chip-default-color)
    );
  }

  .chip:not(.outlined):hover {
    background-color: var(
      --chip-hover-background-color,
      var(--chip-default-hover-background-color)
    );
  }

  .chip:not(.outlined):focus {
    background-color: var(
      --chip-focus-background-color,
      var(--chip-default-focus-background-color)
    );
  }

  .chip.outlined:focus {
    color: var(
      --chip-outlined-focus-color,
      var(--chip-default-outlined-focus-color)
    );
    border-color: var(
      --chip-outlined-focus-color,
      var(--chip-default-outlined-focus-color)
    );
    box-shadow: var(
      --chip-outlined-focus-box-shadow,
      var(--chip-default-outlined-focus-box-shadow)
    );
  }

  .chip:not(.label) {
    border-radius: var(
      --chip-border-radius,
      var(--chip-default-border-radius)
    );
  }

  .label {
    border-radius: var(
      --chip-border-radius,
      var(--chip-default-label-border-radius)
    );
  }

  .icon-after {
    float: right;
    margin-left: 10px;
  }
  .icon-before {
    float: left;
    margin-left: 10px;
  }
  .text {
    display: flex;
    align-items: center;
    gap: var(--chip-gap, var(--chip-default-gap));
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
  }
  .outlined {
    background: transparent !important;
    border: solid 1px;
    border-color: var(--chip-default-outlined-color);
    color: var(--chip-default-outlined-color);
    background-color: var(
      --chip-background-color,
      var(--chip-default-outlined-background-color)
    );
  }
  .disabled {
    pointer-events: none;
    opacity: 0.4;
  }
</style>
