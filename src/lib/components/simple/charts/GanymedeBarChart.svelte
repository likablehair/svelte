<script lang="ts">
  import { Bar } from 'svelte-chartjs'
  import { theme } from '$lib';
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

  type TooltipLabelParameter = Parameters<NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<ComponentProps<Bar>['options']>['plugins']>['tooltip']>['callbacks']>['label']>>[0]

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
    resetZoom: boolean = false,
    tooltipLabel: ((tooltip: TooltipLabelParameter) => string) | undefined = undefined,
    yTickLabel: ((tickValue: string | number, index: number, ticks: any[]) => (string | number)) | undefined = undefined,
    xTickLabel: ((tickValue: string | number, index: number, ticks: any[]) => (string | number)) | undefined = undefined

  let mounted: boolean = false,
    zoomMounted: boolean = false

  onMount(() => {
    mounted = true
  })

  let rgbTooltipColor: string | undefined = undefined
  let rgbTooltipBackgroundColor: string | undefined = undefined
  let rgbBackgroundColor: string | undefined = undefined

  $: rgbTooltipColor = $theme.colors?.[$theme.active]['dark']['primary']['300']
  $: rgbTooltipBackgroundColor = $theme.colors?.[$theme.active]['dark']['primary']['900']
  $: rgbBackgroundColor = $theme.colors?.[$theme.active]['dark']['background']['200']

  $: finalTooltipColor = !!rgbTooltipColor ? `rgb(${rgbTooltipColor}, .8)` : undefined
  $: finalTooltipBackgroundColor = !!rgbTooltipBackgroundColor ? `rgb(${rgbTooltipBackgroundColor})` : undefined
  $: finalBackgroundColor = !!rgbBackgroundColor ? `rgb(${rgbBackgroundColor}, .3)` : undefined  


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
      barPercentage: 0.9,
      borderRadius: 2,
      categoryPercentage: 0.3,
      indexAxis: horizontal ? 'y' : 'x',
      responsive: responsive,
      maintainAspectRatio: maintainAspectRatio,
      plugins: {
        tooltip: {
          displayColors: false,
          titleColor: finalTooltipColor,
          backgroundColor: finalTooltipBackgroundColor,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 14,
            weight: "bold"
          },
          callbacks: {
            label: tooltipLabel
          }
        },
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
            display: showYTicks,
            callback: xTickLabel
          }
        },
        y: {
          display: displayYGrid,
          title: {
          },
          grid: {
            lineWidth: lineWidth,
            color: finalBackgroundColor
          },
          border: {
            dash: [10,10],
            display: false
          },
          ticks: {
            display: showXTicks,
            callback: yTickLabel
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