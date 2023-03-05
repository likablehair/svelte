<script lang="ts">
  export let value = 0,
    total = 100,
    height = "5px",
    width = "100%",
    radius = "2px",
    backgroundColor: string | undefined = undefined,
    color: string | undefined = undefined;

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
  style:height
  style:width
  style:border-radius={radius}
  style:background-color={backgroundColor}
  class="progress-bar-container"
>
  <div
    style:height
    style:width={hundredBasedProgress + "%"}
    style:background-color={color}
    class="progress"
  />
</div>

<style>
  .progress-bar-container {
    overflow: hidden;
  }

  .progress {
    max-width: 100%;
    transition: width 300ms ease-in;
  }
</style>
