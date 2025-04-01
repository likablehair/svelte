<script lang="ts">
  import type { Snippet } from "svelte";
  import { fly } from "svelte/transition";

  interface Props {
    value: boolean;
    height: string;
    width: string;
    backgroundColor?: string;
    firstColor?: string;
    secondColor?: string;
    fontSize: string;
    hoverBackgroundColor?: string;
    hoverBoxShadow?: string;
    animationDuration: number;
    trueOptionSnippet?: Snippet<[]>
    falseOptionSnippet?: Snippet<[]>
  }

  let {
    value = $bindable(false),
    height = "100%",
    width = "100%",
    backgroundColor,
    firstColor,
    secondColor = firstColor,
    fontSize = "12px",
    hoverBackgroundColor,
    hoverBoxShadow,
    animationDuration = 200,
    falseOptionSnippet,
    trueOptionSnippet,
  }: Props = $props();

  let optionHeight: number | undefined = $state(undefined);
</script>

<div
  class="container"
  style:width
  style:height
  style:--vertical-text-switch-height={height}
  style:--vertical-text-switch-hover-background-color={hoverBackgroundColor}
  style:--vertical-text-switch-hover-box-shadow={hoverBoxShadow}
  bind:clientHeight={optionHeight}
  onclick={() => (value = !value)}
  onkeypress={() => (value = !value)}
  style:background-color={backgroundColor}
  style:padding="5px"
  role="switch"
  aria-checked={value}
  tabindex="0"
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
      {#if trueOptionSnippet}
        {@render trueOptionSnippet()}
      {/if}
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
      {#if falseOptionSnippet}
        {@render falseOptionSnippet()}
      {/if}
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
