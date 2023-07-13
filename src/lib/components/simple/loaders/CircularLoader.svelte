<script lang="ts">
  import '$lib/css/main.css'
  import './CircularLoader.css'

  let clazz: string = '';
	export { clazz as class };

  /*
    Styles

    --circular-loader-width
    --circular-loader-height
    --circular-loader-color
  */

  export let loading = true
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="21.904761904761905 21.904761904761905 43.80952380952381 43.80952380952381"
  class:active={loading}
  class={clazz}
>
  <circle
    fill="transparent"
    cx="43.80952380952381"
    cy="43.80952380952381"
    r="20"
    stroke-width="3.8095238095238093"
    stroke-dasharray="125.664"
    stroke-dashoffset="125.66370614359172px"
    style:stroke="currentColor"
    class:active={loading}
  />
</svg>

<style>
  svg {
    height: var(
      --circular-loader-height,
      var(--circular-loader-default-height)
    );
    width: var(
      --circular-loader-width,
      var(--circular-loader-default-width)
    );
    width: var(
      --circular-loader-color,
      var(--circular-loader-default-color)
    );
  }

  circle.active {
    -webkit-animation: progress-circular-dash 1.4s ease-in-out infinite;
    animation: progress-circular-dash 1.4s ease-in-out infinite;
    stroke-linecap: round;
    stroke-dasharray: 80, 200;
    stroke-dashoffset: 0px;
  }

  svg.active {
    animation: progress-circular-rotate 1.4s linear infinite;
  }

  @keyframes progress-circular-dash {
    0% {
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0px;
    }

    50% {
      stroke-dasharray: 100, 200;
      stroke-dashoffset: -15px;
    }

    to {
      stroke-dasharray: 100, 200;
      stroke-dashoffset: -124px;
    }
  }

  @keyframes progress-circular-rotate {
    0% {
      transform: rotate(0deg);
    }

    50% {
      transform: rotate(180deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>
