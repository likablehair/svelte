<script lang="ts">
  import {
    Chart,
    Tooltip,
    type ChartData,
    type ChartOptions,
  } from 'chart.js';
  import type { HTMLCanvasAttributes } from 'svelte/elements';

  import 'chart.js/auto';
  import 'chartjs-adapter-date-fns';

  interface Props extends HTMLCanvasAttributes {
    data: ChartData<'line', number[], string>
    options: ChartOptions<'line'>
    resetZoom?: boolean
  }

  let { 
    data = $bindable(),
    options = $bindable(),
    resetZoom = $bindable(),
    ...rest 
  }: Props = $props();

  Chart.register(Tooltip);

  let canvasElem: HTMLCanvasElement,
    chart: Chart;

  $effect(() => {
    import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
      Chart.register(zoomPlugin)
      chart.resetZoom()
    })

    chart = new Chart(canvasElem, {
      type: 'line',
      data,
      options,
    })

    return () => {
      chart.destroy();
    };
  });

  $effect(() => {
    if (chart) {
      chart.data = data;
      chart.update();
    }
  });

  $effect(() => {
    if(!!chart && !!resetZoom) {
      chart.resetZoom()
      resetZoom = false
    }
  });
</script>

<canvas bind:this={canvasElem} {...rest}></canvas>