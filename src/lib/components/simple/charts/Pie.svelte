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
    data: ChartData<'pie', number[], string>;
    options?: ChartOptions<'pie'>;
    chart?: Chart;
  }

  let { 
    data = $bindable(),
    options = $bindable(),
    chart = $bindable(),
    ...rest 
  }: Props = $props();

  Chart.register(Tooltip);

  let canvasElem: HTMLCanvasElement;

  $effect(() => {
    chart = new Chart(canvasElem, {
      type: 'pie',
      data: data,
      options,
    });

    return () => {
      chart?.destroy();
    };
  });

  $effect(() => {
    if (chart) {
      chart.data = data;
      chart.update();
    }
  });
</script>

<canvas bind:this={canvasElem} {...rest}></canvas>