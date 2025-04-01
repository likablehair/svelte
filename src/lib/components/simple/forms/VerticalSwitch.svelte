<script lang="ts">
    import type { Snippet } from "svelte";

  interface Props {
    value: boolean;
    height: string;
    width: string;
    rounded: boolean;
    backgroundColor: string;
    selectedOptionColor: string;
    sliderColor: string;
    optionColor: string;
    fontSize: string;
    animationDuration: string;
    onchange?: () => void
    falseOptionSnippet?: Snippet<[]>
    trueOptionSnippet?: Snippet<[]>
  }

  let {
    value = $bindable(false),
    height = "60px",
    width = "30px",
    rounded = false,
    backgroundColor = "#90CAF9",
    selectedOptionColor = backgroundColor,
    sliderColor = "white",
    optionColor = sliderColor,
    fontSize = "11px",
    animationDuration = "0.1s",
    onchange,
    falseOptionSnippet,
    trueOptionSnippet,
  }: Props = $props();
</script>

<div
  class="container"
  style:--vertical-switch-height={height}
  style:--vertical-switch-width={width}
  style:--vertical-switch-container-border-radius={rounded ? "500px" : "4px"}
  style:--vertical-switch-slider-border-radius={rounded ? "100%" : "4px"}
  style:--vertical-switch-background-color={backgroundColor}
  style:--vertical-switch-selected-option-color={selectedOptionColor}
  style:--vertical-switch-slider-color={sliderColor}
  style:--vertical-switch-option-color={optionColor}
  style:--vertical-switch-font-size={fontSize}
  style:--vertical-switch-animation-duration={animationDuration}
>
  <div
    class="inner-container"
    role="switch"
    aria-checked={value}
    aria-label="Toggle option"
    tabindex="0"
    onclick={() => (value = !value)}
    onkeypress={() => (value = !value)}
  >
    <div class={value ? "first-option selected" : "first-option"}>
      {#if trueOptionSnippet}
        {@render trueOptionSnippet()}
      {:else}
        1
      {/if}
    </div>
    <div class={value ? "second-option" : "second-option selected"}>
      {#if falseOptionSnippet}
        {@render falseOptionSnippet()}
      {:else}
        0
      {/if}
    </div>
    <input bind:checked={value} type="checkbox" {onchange} />
    <span class={value ? "slider top" : "slider bottom"}></span>
  </div>
</div>

<style>
  .container {
    position: relative;
    box-sizing: border-box;
    width: var(--vertical-switch-width);
  }

  input {
    position: absolute;
    display: none;
  }

  .inner-container {
    position: absolute;
    width: 100%;
    height: var(--vertical-switch-height);
    background-color: var(--vertical-switch-background-color);
    cursor: pointer;
    text-align: center;
    border-radius: var(--vertical-switch-container-border-radius);
  }

  .first-option {
    width: 100%;
    height: calc(var(--vertical-switch-width));
    position: absolute;
    overflow-x: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    color: var(--vertical-switch-option-color);
    font-size: var(--vertical-switch-font-size);
    user-select: none;
    transition: var(--vertical-switch-animation-duration);
  }

  .second-option {
    width: 100%;
    height: calc(var(--vertical-switch-width));
    position: absolute;
    overflow-x: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    bottom: 0;
    color: var(--vertical-switch-option-color);
    font-size: var(--vertical-switch-font-size);
    user-select: none;
  }

  .selected {
    color: var(--vertical-switch-selected-option-color);
    z-index: 5;
    font-weight: bold;
    transition: var(--vertical-switch-animation-duration);
  }

  .slider {
    position: absolute;
    --vertical-switch-slider-diameter: calc(var(--vertical-switch-width) - 4px);
    width: var(--vertical-switch-slider-diameter);
    height: var(--vertical-switch-slider-diameter);
    border-radius: var(--vertical-switch-slider-border-radius);
    background-color: var(--vertical-switch-slider-color);
    left: 2px;
    transition: var(--vertical-switch-animation-duration);
  }

  .top {
    top: 2px;
  }

  .bottom {
    top: calc(
      var(--vertical-switch-height) - var(--vertical-switch-slider-diameter) -
        2px
    );
  }
</style>
