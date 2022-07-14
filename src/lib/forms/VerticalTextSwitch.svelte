<script lang="ts">

  import { fly } from 'svelte/transition'

  export let value: boolean = false,
    height: string = "100%",
    width: string = "100%",
    backgroundColor: string = undefined,
    firstColor: string = undefined,
    secondColor: string = firstColor,
    fontSize: string = "12px",
    hoverBackgroundColor: string = undefined,
    hoverBoxShadow: string = undefined,
    animationDuration: number = 200;

  let optionHeight: number = undefined

</script>

<div
  class="container"
  style:width
  style:height
  style:--vertical-text-switch-height={height}
  style:--vertical-text-switch-hover-background-color={hoverBackgroundColor}
  style:--vertical-text-switch-hover-box-shadow={hoverBoxShadow}
  bind:clientHeight={optionHeight}
  on:click={()=>value = !value}
  style:background-color={backgroundColor}
  style:padding="5px"
>
  {#if value}
    <div
      in:fly="{{ y: optionHeight/2, duration: animationDuration/2, delay: animationDuration/2}}"
      out:fly="{{ y: -optionHeight/2, duration: animationDuration/2}}"
      class="option"
      style:color={firstColor}
      style:font-size={fontSize}
    >
      <slot name="trueOption"></slot>
    </div>
  {:else}
    <div
      in:fly="{{ y: optionHeight/2, duration: animationDuration/2, delay: animationDuration/2}}"
      out:fly="{{ y: -optionHeight/2, duration: animationDuration/2}}"
      class="option"
      style:color={secondColor}
      style:font-size={fontSize}
    >
      <slot name="falseOption"></slot>
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
