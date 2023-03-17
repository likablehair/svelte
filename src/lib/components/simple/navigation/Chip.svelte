<script lang="ts">
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import { createEventDispatcher } from "svelte";

  export let close = false,
    closeIcon = "mdi-close-circle",
    color = "blue",
    textColor = "white",
    disabled = false,
    filter = false,
    filterIcon = "mdi-check",
    label = false,
    outlined = false,
    size = 12;

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
  style:border-radius={label ? "5px" : "100px"}
  style:background-color={color}
  style:color={outlined ? color : textColor}
  class:label
  class:outlined
  class:disabled
  on:click={handleChipClick}
  on:keypress={handleChipClick}
>
  {#if filter}
    <div class="icon-before">
      <Icon name={filterIcon} {size} />
    </div>
  {/if}
  <div class="text" style:font-size="{size}pt" style:line-height="{size}pt">
    <slot />
  </div>
  {#if close}
    <div class="icon-after">
      <Button
        icon={closeIcon}
        iconSize={size}
        type="icon"
        hoverBackgroundColor="none"
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
  }
  .icon-after {
    float: right;
    margin-left: -10px;
  }
  .icon-before {
    float: left;
    margin-left: 10px;
  }
  .text {
    display: inline-block;
    vertical-align: middle;
    margin-left: 20px;
    margin-right: 20px;
    margin-bottom: 3px;
    cursor: default;
    user-select: none;
  }
  .outlined {
    background: transparent !important;
    border: solid 1px;
  }
  .disabled {
    pointer-events: none;
    opacity: 0.4;
  }
</style>
