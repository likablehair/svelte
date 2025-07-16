<script lang="ts">
  import {
    Chart,
    Tooltip,
    type ChartData,
    type ChartOptions,
  } from 'chart.js';
  import type { HTMLCanvasAttributes } from 'svelte/elements';
  import lodash from 'lodash'
  import 'chart.js/auto';
  import 'chartjs-adapter-date-fns';

  interface Props extends HTMLCanvasAttributes {
    data: ChartData<'pie', number[], string>;
    options?: ChartOptions<'pie'>;
    chart?: Chart;
  }

  let { 
    data = $bindable(),
    options: userOptions = $bindable(),
    chart = $bindable(),
    ...rest 
  }: Props = $props();

  const defaultOptions: ChartOptions<'pie'> = {
    responsive: true, //responsive
    maintainAspectRatio: false, //maintainAspectRatio
    plugins: {
      legend: {
        display: true //showLegend
      }
    }
  }

  let options: ChartOptions<'pie'> = $derived(
    lodash.clone(lodash.merge(defaultOptions, userOptions))
  )

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