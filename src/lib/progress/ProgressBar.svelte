<script lang="ts">
  export let 
    value: number = 0,
    total: number = 100,
    height: string = '5px',
    width: string = '100%',
    radius: string = '2px',
    backgroundColor: string = undefined,
    color: string = undefined

  $: hundredBasedProgress = total === 0 ? 100 : value * 100 / total
  $: cssVariables = Object.entries({
      '--progress-width': hundredBasedProgress + '%',
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');
</script>

<style>
.progress-bar-container {
  overflow: hidden;
}

.progress {
  max-width: 100%;
  transition: width 300ms ease-in;
}
</style>

<div 
  style={cssVariables}
  style:height={height}
  style:width={width}
  style:border-radius={radius}
  style:background-color={backgroundColor}
  class="progress-bar-container"
>
  <div 
    style:height={height}
    style:width={hundredBasedProgress + '%'}
    style:background-color={color}
    class="progress"
  ></div>
</div>