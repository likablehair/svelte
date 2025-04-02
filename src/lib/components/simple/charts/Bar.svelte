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
    data: ChartData<'bar', number[], string>
    options: ChartOptions<'bar'>
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
    import("chartjs-plugin-zoom").then(({ default: zoomPlugin}) => {
      Chart.register(zoomPlugin)
      setTimeout(() => {
        if(!!chart.resetZoom)
          chart.resetZoom()
      }, 40);
    })

    chart = new Chart(canvasElem, {
      type: 'bar',
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
    if(!!chart && !!resetZoom && !!chart.resetZoom) {
      setTimeout(() => {
        if(!!chart.resetZoom)
          chart.resetZoom()
          resetZoom = false
      }, 40);
    }
  });
</script>

<canvas bind:this={canvasElem} {...rest}></canvas>