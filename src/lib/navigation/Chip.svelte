<script lang="ts">

  import Icon from '$lib/media/Icon.svelte'
  import Button from '$lib/buttons/Button.svelte';
  import { createEventDispatcher } from 'svelte';

  export let close: boolean = false,
    closeIcon: string = "mdi-close-circle",
    color: string = "blue",
    textColor: string = "white",
    disabled: boolean = false,
    filter: boolean = false,
    filterIcon: string = "mdi-check",
    label: boolean = false,
    outlined: boolean = false,
    size: number = 12;

    const dispatch = createEventDispatcher()

    function handleChipClick() {
      dispatch('click')
    }

    function handleCloseClick() {
      dispatch('close')
    }

</script>

<div
  class="chip"
  style:border-radius={label?"5px":"100px"}
  style:background-color="{color}"
  style:color={outlined?color:textColor}
  class:label={label}
  class:outlined={outlined}
  class:disabled={disabled}
  on:click={handleChipClick}
>
  {#if filter}
    <div class="icon-before">
      <Icon
        name={filterIcon}
        size={size}
      ></Icon>
    </div>
  {/if}
  <div class="text"
    style:font-size="{size}pt"
    style:line-height="{size}pt"
  >
  <slot></slot>
</div>
  {#if close}
    <div class="icon-after">
      <Button
        icon={closeIcon}
        iconSize={size}
        type='icon'
        hoverBackgroundColor="none"
        on:click={handleCloseClick}
      >
      </Button>
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