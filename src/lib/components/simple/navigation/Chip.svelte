<script lang="ts">
  import './Chip.css'
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import { createEventDispatcher } from "svelte";

  export let close = false,
    closeIcon = "mdi-close-circle",
    disabled = false,
    filter = false,
    filterIcon = "mdi-check",
    label = false,
    outlined = false,
    buttonTabIndex: number | null = null

  const dispatch = createEventDispatcher();

  function handleChipClick() {
    dispatch("click");
  }

  function handleCloseClick() {
    dispatch("close");
  }
</script>

<div
  class="chip"
  class:label
  class:outlined
  class:disabled
  on:click={handleChipClick}
  on:keypress={handleChipClick}
>
  {#if filter}
    <div class="icon-before">
      <Icon name={filterIcon} />
    </div>
  {/if}
  <div 
    class="text" 
  >
    <slot />
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
        on:click={handleCloseClick}
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
    display: inline-block;
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
