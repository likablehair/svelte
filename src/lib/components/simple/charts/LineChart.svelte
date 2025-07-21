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
    data: ChartData<'line', number[], string>
    options: ChartOptions<'line'>
    resetZoom?: boolean
  }

  let { 
    data,
    options: userOptions = $bindable(),
    resetZoom = $bindable(),
    ...rest 
  }: Props = $props();

  const defaultOptions: ChartOptions<'line'> = {
    indexAxis: 'x', //horizontal ? 'y' : 'x'
    responsive: true, //responsive
    maintainAspectRatio: true,  //maintainAspectRatio
    elements: {
      line: {
        borderWidth: 3  //lineWidth
      },
      point: {
        radius: undefined,  //pointRadius
        hitRadius: undefined, //hitRadius
        hoverRadius: undefined  //hoverRadius
      }
    },
    plugins: {
      legend: {
        display: true //showLegend
      },
      zoom: {
        pan: {
          enabled: true, //enableZoom
          mode: 'x',
          modifierKey: 'ctrl',
        },
        zoom: {
          drag: {
            enabled: true //enableZoom
          },
          mode: 'x',
        },
      },
      tooltip: {
        enabled: true //!tooltipsDisabled
      }
    },
    interaction: {
      intersect: false,
    },
    scales: {
      x: {
        max: undefined, //xMax
        min: undefined, //xMin
        display: true,  //displayXGrid
        title: {
          display: true
        },
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          display: false, //showYTicks
          stepSize: undefined //yTickStepSize
        }
      },
      y: {
        max: undefined, //yMax
        min: undefined, //yMin
        display: true,  //displayYGrid
        title: {
        },
        grid: {
          lineWidth: 1, //gridLineWidth
          color: undefined, //'rgb(' + (style.getPropertyValue('--global-color-background-200') || '200, 200, 200') + ', .3)'
        },
        border: {
          dash: [10,10],
          display: false
        },
        ticks: {
          display: false, //showXTicks
          stepSize: undefined //xTickStepSize
        }
      }
    }
  }

  let options: ChartOptions<'line'> = $derived(
    lodash.clone(lodash.merge(defaultOptions, userOptions))
  )

  Chart.register(Tooltip);

  let canvasElem: HTMLCanvasElement,
    chart: Chart;

  $effect(() => {
    import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
      Chart.register(zoomPlugin)
      setTimeout(() => {
        if(!!chart.resetZoom)
          chart.resetZoom()
      }, 40);
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