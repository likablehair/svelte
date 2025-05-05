<script lang="ts">
  import type { Snippet } from "svelte";
  import './VerticalSwitch.css'

  interface Props {
    value?: boolean;
    rounded?: boolean;
    onchange?: () => void
    falseOptionSnippet?: Snippet<[]>
    trueOptionSnippet?: Snippet<[]>
  }

  let {
    value = $bindable(),
    rounded = false,
    onchange,
    falseOptionSnippet,
    trueOptionSnippet,
  }: Props = $props();
</script>

<div
  class="container"
>
  <div
    class="inner-container"
    role="switch"
    class:rounded={rounded}
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
    <span class={value ? "slider top" : "slider bottom"} class:rounded={rounded}></span>
  </div>
</div>

<style>
  .container {
    position: relative;
    box-sizing: border-box;
    width: var(--vertical-switch-width,
    var(--vertical-switch-default-width)
    );
  }

  input {
    position: absolute;
    display: none;
  }

  .inner-container {
    position: absolute;
    width: 100%;
    height: var(--vertical-switch-height,
      var(--vertical-switch-default-height)
    );
    background-color: var(--vertical-switch-background-color,
      var(--vertical-switch-default-background-color)
    );
    cursor: pointer;
    text-align: center;
    border-radius: var(--vertical-switch-container-border-radius,
      var(--vertical-switch-default-container-border-radius)
    );
  }

  .inner-container.rounded {
    border-radius: var(--vertical-switch-container-border-radius,
      var(--vertical-switch-default-container-border-radius-rounded)
    );
  }

  .first-option {
    width: 100%;
    height: calc(var(--vertical-switch-width,
      var(--vertical-switch-default-width)
    ));
    position: absolute;
    overflow-x: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    color: var(--vertical-switch-option-color,
      var(--vertical-switch-slider-color,
        var(--vertical-switch-default-option-color)
      )
    );
    font-size: var(--vertical-switch-font-size,
      var(--vertical-switch-default-font-size)
    );
    user-select: none;
    transition: var(--vertical-switch-animation-duration,
      var(--vertical-switch-default-animation-duration)
    );
  }

  .second-option {
    width: 100%;
    height: calc(var(--vertical-switch-width,
      var(--vertical-switch-default-width)
    ));
    position: absolute;
    overflow-x: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    bottom: 0;
    color: var(--vertical-switch-option-color,
      var(--vertical-switch-slider-color,
        var(--vertical-switch-default-option-color)
      )
    );
    font-size: var(--vertical-switch-font-size,
      var(--vertical-switch-default-font-size)
    );
    user-select: none;
  }

  .selected {
    color: var(--vertical-switch-selected-option-color,
      var(--vertical-switch-background-color,
        var(--vertical-switch-default-selected-option-color)
      )
    );
    z-index: 5;
    font-weight: bold;
    transition: var(--vertical-switch-animation-duration,
      var(--vertical-switch-default-animation-duration)
    );
  }

  .slider {
    position: absolute;
    --vertical-switch-slider-diameter: calc(var(--vertical-switch-width,
      var(--vertical-switch-default-width)
    ) - 4px);
    width: var(--vertical-switch-slider-diameter);
    height: var(--vertical-switch-slider-diameter);
    border-radius: var(--vertical-switch-slider-border-radius,
      var(--vertical-switch-default-slider-border-radius)
    );
    background-color: var(--vertical-switch-slider-color,
      var(--vertical-switch-default-slider-color)
    );
    left: 2px;
    transition: var(--vertical-switch-animation-duration,
      var(--vertical-switch-default-animation-duration)
    );
  }

  .slider.rounded {
    border-radius: var(--vertical-switch-slider-border-radius,
      var(--vertical-switch-default-slider-border-radius-rounded)
    );
  }

  .top {
    top: 2px;
  }

  .bottom {
    top: calc(
      var(--vertical-switch-height,var(--vertical-switch-default-height)) - var(--vertical-switch-slider-diameter) -
        2px
    );
  }
</style>
