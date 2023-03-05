<script lang="ts">
  import { fly } from "svelte/transition";

  export let value = false,
    height = "100%",
    width = "100%",
    backgroundColor: string | undefined = undefined,
    firstColor: string | undefined = undefined,
    secondColor: string | undefined = firstColor,
    fontSize = "12px",
    hoverBackgroundColor: string | undefined = undefined,
    hoverBoxShadow: string | undefined = undefined,
    animationDuration = 200;

  let optionHeight: number | undefined = undefined;
</script>

<div
  class="container"
  style:width
  style:height
  style:--vertical-text-switch-height={height}
  style:--vertical-text-switch-hover-background-color={hoverBackgroundColor}
  style:--vertical-text-switch-hover-box-shadow={hoverBoxShadow}
  bind:clientHeight={optionHeight}
  on:click={() => (value = !value)}
  on:keypress={() => (value = !value)}
  style:background-color={backgroundColor}
  style:padding="5px"
>
  {#if value}
    <div
      in:fly={{
        y: optionHeight / 2,
        duration: animationDuration / 2,
        delay: animationDuration / 2,
      }}
      out:fly={{ y: -optionHeight / 2, duration: animationDuration / 2 }}
      class="option"
      style:color={firstColor}
      style:font-size={fontSize}
    >
      <slot name="trueOption" />
    </div>
  {:else}
    <div
      in:fly={{
        y: optionHeight / 2,
        duration: animationDuration / 2,
        delay: animationDuration / 2,
      }}
      out:fly={{ y: -optionHeight / 2, duration: animationDuration / 2 }}
      class="option"
      style:color={secondColor}
      style:font-size={fontSize}
    >
      <slot name="falseOption" />
    </div>
  {/if}
  <input type="checkbox" bind:value />
</div>

<style>
  .container {
    cursor: pointer;
    border-radius: 5px;
    overflow-y: hidden;
  }

  .container:hover {
    background-color: var(--vertical-text-switch-hover-background-color);
    box-shadow: var(--vertical-text-switch-hover-box-shadow);
  }

  .option {
    height: var(--vertical-text-switch-height);
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  input {
    display: none;
  }
</style>
