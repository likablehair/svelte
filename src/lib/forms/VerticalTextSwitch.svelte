<script lang="ts">

  import { fly } from 'svelte/transition'

  export let value: boolean = false,
    height: string = "100%",
    width: string = "100%",
    backgroundColor: string = undefined,
    firstColor: string = undefined,
    secondColor: string = firstColor,
    fontSize: string = "12px",
    animationDuration: number = 200;

  let optionHeight: number = undefined

</script>

<div
  class="container"
  style:width
  style:height
  style:--vertical-text-switch-height={height}
  bind:clientHeight={optionHeight}
  on:click={()=>value = !value}
  style:background-color={backgroundColor}
>
  {#if value}
    <div
      in:fly="{{ y: optionHeight/2, duration: animationDuration/2, delay: animationDuration/2}}"
      out:fly="{{ y: -optionHeight/2, duration: animationDuration/2}}"
      class="option"
      style:color={firstColor}
      style:font-size={fontSize}
    >
      <slot name="firstOption"></slot>
    </div>
  {:else}
    <div
      in:fly="{{ y: optionHeight/2, duration: animationDuration/2, delay: animationDuration/2}}"
      out:fly="{{ y: -optionHeight/2, duration: animationDuration/2}}"
      class="option"
      style:color={secondColor}
      style:font-size={fontSize}
    >
      <slot name="secondOption"></slot>
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
