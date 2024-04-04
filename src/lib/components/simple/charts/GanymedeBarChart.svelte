<script lang="ts">
  import { Bar } from 'svelte-chartjs'
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    BarElement,
  } from 'chart.js';
  import { onMount, type ComponentProps } from 'svelte';

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    BarElement,
    LinearScale,
    PointElement,
    CategoryScale
  );


  export let data: {
      labels: string[],
      datasets: {
        label: string,
        data: number[],
        backgroundColor?: string,
        borderColor?: string,
        hoverBackgroundColor?: string[]
        tension?: number,
      }[]
    } = {
      labels: [],
      datasets: []
    },
    horizontal: boolean = false,
    responsive: boolean = true,
    maintainAspectRatio: boolean = true,
    showLegend: boolean = true,
    showYTicks: boolean = false,
    showXTicks: boolean = false,
    displayYGrid: boolean = true,
    lineWidth: number = 1,
    enableZoom: boolean = true,
    resetZoom: boolean = false

  let mounted: boolean = false,
    zoomMounted: boolean = false,
    background: string | undefined = undefined

  onMount(() => {
    let style = getComputedStyle(document.body);
    background = style.getPropertyValue('--global-color-background-200');
    mounted = true
  })

  $: gridColor = 'rgb(' + (background || '200, 200, 200') + ', .3)'

  let chart: ComponentProps<Bar>['chart']
  $: if(!!chart && !!enableZoom && !!resetZoom) {
    chart.resetZoom()
    resetZoom = false
  }

  $: if(enableZoom && mounted) {
    import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
      ChartJS.register(zoomPlugin)
      zoomMounted = true
    })
  }

  let chartOptions: ComponentProps<Bar>['options']
  $: chartOptions = {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: responsive,
      maintainAspectRatio: maintainAspectRatio,
      plugins: {
        legend: {
          display: showLegend
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
            modifierKey: 'ctrl',
          },
          zoom: {
            drag: {
              enabled: true
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
            display: showYTicks
          }
        },
        y: {
          display: displayYGrid,
          title: {
          },
          grid: {
            lineWidth: lineWidth,
            color: gridColor
          },
          border: {
            dash: [10,10],
            display: false
          },
          ticks: {
            display: showXTicks
          }
        }
      }
    }
</script>

<Bar
  bind:data={data}
  options={chartOptions}
  bind:chart={chart}
></Bar>