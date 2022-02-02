<script lang="ts">
  import { Elevation } from '$lib/enums/elevation.enum';

  export let rounded: boolean = true,
    outlined: boolean = false,
    elevation: Elevation = Elevation.md;

  $: cssVariables = Object.entries({
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');

  import '$lib/common/tailwind.css';
</script>

<style>
  .card-container {
    height: var(--height, fit-content);
    width: var(--width, fit-content);
    max-height: var(--max-height);
    max-width: var(--max-width);
    min-height: var(--min-height);
    min-width: var(--min-width);
    padding: var(--padding, 5px);
    background-color: var(--background-color, rgb(252, 252, 252));
    color: var(--color);
    border-color: var(--border-color);
  }
</style>

<div 
  class="card-container flex flex-col rounded-md shadow-lg" 
  style={cssVariables}
  class:shadow-sm={!outlined && elevation == Elevation.sm}
  class:shadow-md={!outlined && elevation == Elevation.md}
  class:shadow-lg={!outlined && elevation == Elevation.lg}
  class:shadow-xl={!outlined && elevation == Elevation.xl}
  class:shadow-2xl={!outlined && elevation == Elevation.xxl}
  class:border-solid={outlined}
  class:rounded-md={rounded}
>
  <div class="header flex-none">
    <slot name="header"></slot>
  </div>
  <div class="body shrink overflow-y-auto">
    <slot></slot>
  </div>
  <div class="footer flex-none">
    <slot name="footer"></slot>
  </div>
</div>