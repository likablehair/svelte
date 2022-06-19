<script lang="ts">
  export let value: boolean = false,
    height: string = "20px",
    width: string = "40px",
    padding: string = "6px",
    borderRadius: string = "10px",
    toggleActiveColor: string = "#5c5c5c",
    toggleDeactiveColor: string = "#5c5c5c",
    backgroundActiveColor: string = "#e6e6e6",
    backgroundDeactiveColor: string = "#e6e6e6",
    animationDuration: string = "0.1s";
</script>

<div 
  style:--switch-toggle-active-color={toggleActiveColor}
  style:--switch-toggle-deactive-color={toggleDeactiveColor}
  style:--switch-animation-duration={animationDuration}
  style:--switch-height={height}
  style:--switch-width={width}
  style:--switch-padding={padding}
  style:--switch-border-radius={borderRadius}
  class="container"
>
  <div 
    class="inner-container"
    style:background-color={value ? backgroundActiveColor : backgroundDeactiveColor}
    on:click={() => value = !value}
  >
    <input 
      bind:checked={value}
      type="checkbox"
      on:change
    >
    <span
      class="slider"
    ></span>
  </div>
</div>

<style>
  .container {
    position: relative;
    width: var(--switch-width);
    box-sizing: border-box;
  }

  input {
    position: absolute;
    display: none;
  }

  .inner-container {
    position: absolute;
    width: 100%;
    height: var(--switch-height);
    border-radius: var(--switch-border-radius);
    cursor: pointer;
    transition: background-color var(--switch-animation-duration) ease;
  }

  .slider {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: var(--switch-border-radius);
    transition: var(--switch-animation-duration);
  }

  .slider::before {
    --switch-toggle-top-padding: calc(var(--switch-padding) / 2);
    --switch-toggle-left-padding: calc(var(--switch-padding) / 2);
    --switch-toggle-right-padding: calc(var(--switch-padding) / 2);
    --switch-toggle-bottom-padding: calc(var(--switch-padding) / 2);
    content: "";
    position: absolute;
    top: var(--switch-toggle-top-padding);
    left: var(--switch-toggle-left-padding);
    width: calc(var(--switch-width) / 2 - var(--switch-toggle-right-padding) - var(--switch-toggle-left-padding));
    height: calc(var(--switch-height) - var(--switch-toggle-top-padding) - var(--switch-toggle-bottom-padding));
    border-radius: var(--switch-border-radius);
    background-color: var(--switch-toggle-deactive-color);
    transition: var(--switch-animation-duration);
  }

  input:checked ~ .slider::before {
    transform: translateX(calc(var(--switch-width) / 2));
    background-color: var(--switch-toggle-active-color);
    box-shadow: none;
  }
</style>