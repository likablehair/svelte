<script lang="ts">
  import '../../../css/main.css'
  import './ProgressBar.css'

  export let value = 0,
    total = 100

  $: hundredBasedProgress = total === 0 ? 100 : (value * 100) / total;
  $: cssVariables = Object.entries({
    "--progress-width": hundredBasedProgress + "%",
  })
    .filter(([key]) => key.startsWith("--"))
    .reduce((css, [key, value]) => {
      return `${css}${key}: ${value};`;
    }, "");
</script>

<div
  style={cssVariables}
  class="progress-bar-container"
>
  <div
    style:width={hundredBasedProgress + "%"}
    class="progress"
  />
</div>

<style>
  .progress-bar-container {
    overflow: hidden;
    background-color: var(
      --progress-bar-background-color,
      var(--progress-bar-default-background-color)
    );
    height: var(
      --progress-bar-height,
      var(--progress-bar-default-height)
    );
    width: var(
      --progress-bar-width,
      var(--progress-bar-default-width)
    );
    border-radius: var(
      --progress-bar-border-radius,
      var(--progress-bar-default-border-radius)
    );
  }

  .progress {
    max-width: 100%;
    height: var(
      --progress-bar-height,
      var(--progress-bar-default-height)
    );
    background-color: var(
      --progress-bar-highlight-color,
      var(--progress-bar-default-highlight-color)
    );
    transition: width 300ms cubic-bezier(0.215, 0.610, 0.355, 1);
  }
</style>
