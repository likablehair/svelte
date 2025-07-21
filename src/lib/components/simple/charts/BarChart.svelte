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
  import lodash from 'lodash'

  interface Props extends HTMLCanvasAttributes {
    data: ChartData<'bar', number[], string>
    options?: ChartOptions<'bar'>
    resetZoom?: boolean
  }

  let { 
    data,
    options: userOptions,
    resetZoom = $bindable(),
    ...rest 
  }: Props = $props();

  const defaultOptions: ChartOptions<'bar'> = {
    bar: {
      datasets: {
        barPercentage: 0.9,
        borderRadius: 2,
        categoryPercentage: 0.3
      }
    },
    indexAxis: 'x', //horizontal ? 'y' : 'x'
    responsive: true, //responsive
    maintainAspectRatio: true,  //maintainAspectRatio 
    plugins: {
      tooltip: {
        displayColors: false,
        titleColor: undefined,  //`rgb(${rgbTooltipColor})`
        backgroundColor: undefined,  //`rgb(${rgbTooltipBackgroundColor})`
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 14,
          weight: "bold"
        },
        callbacks: {
          label: undefined  //tooltipLabel
        }
      },
      legend: {
        display: true //showLegend
      },
      zoom: {
        pan: {
          enabled: true,  //enableZoom
          mode: 'x',
          modifierKey: 'ctrl',
        },
        zoom: {
          drag: {
            enabled: true //enableZoom
          },
          mode: 'x',
        },
      }
    },
    interaction: {
      intersect: false,
    },
    scales: {
      x: {
        max: undefined, //xMax 
        display: true,
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
          display: false, //showXTicks
          callback: undefined,  //xTickLabel
          stepSize: undefined //xTickStepSize
        }
      },
      y: {
        max: undefined, //yMax
        display: true,  //displayYGrid
        title: {
        },
        grid: {
          lineWidth: 1, //lineWidth
          color: undefined,  //`rgb(${rgbBackgroundColor}, .3)`
        },
        border: {
          dash: [10,10],
          display: false
        },
        ticks: {
          display: false, //showYTicks
          callback: undefined,  //yTickLabel
          stepSize: undefined //yTickStepSize
        }
      }
    }
  }

  let options: ChartOptions<'bar'> = $derived(
    lodash.clone(lodash.merge(defaultOptions, userOptions))
  )

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