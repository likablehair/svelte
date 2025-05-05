<script lang="ts">
  import Bar from './Bar.svelte';
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
  import { type ComponentProps } from 'svelte';

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    BarElement,
    LinearScale,
    PointElement,
    CategoryScale,
  );

  type TooltipLabelParameter = Parameters<NonNullable<NonNullable<NonNullable<NonNullable<NonNullable<ComponentProps<typeof Bar>['options']>['plugins']>['tooltip']>['callbacks']>['label']>>[0]

  interface Props {
    data?: {
      labels: string[];
      datasets: {
        label: string,
        data: number[],
        backgroundColor?: string,
        borderColor?: string,
        hoverBackgroundColor?: string[]
        tension?: number,
      }[];
    };
    horizontal?: boolean;
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    showLegend?: boolean;
    showYTicks?: boolean;
    showXTicks?: boolean;
    displayYGrid?: boolean;
    lineWidth?: number;
    enableZoom?: boolean;
    resetZoom?: boolean;
    tooltipLabel?: (tooltip: TooltipLabelParameter) => string;
    yTickLabel?: (tickValue: string | number, index: number, ticks: any[]) => string | number;
    xTickLabel?: (tickValue: string | number, index: number, ticks: any[]) => string | number;
    xTickStepSize?: number;
    yTickStepSize?: number;
    xMax?: number;
    yMax?: number;
    rgbTooltipColor?: string;
    rgbTooltipBackgroundColor?: string;
    rgbBackgroundColor?: string;
    width?: string | number;
    height?: string | number;
  }

  let {
    data = { labels: [], datasets: [] },
    horizontal = false,
    responsive = true,
    maintainAspectRatio = true,
    showLegend = true,
    showYTicks = false,
    showXTicks = false,
    displayYGrid = true,
    lineWidth = 1,
    enableZoom = true,
    resetZoom = $bindable(false),
    tooltipLabel = undefined,
    yTickLabel = undefined,
    xTickLabel = undefined,
    xTickStepSize = undefined,
    yTickStepSize = undefined,
    xMax = undefined,
    yMax = undefined,
    rgbTooltipColor = undefined,
    rgbTooltipBackgroundColor = undefined,
    rgbBackgroundColor = undefined,
    width = undefined,
    height = undefined,
  }: Props = $props();


  $effect(() => {
    if(!rgbTooltipColor && !!$theme.colors?.[$theme.active]['dark']['primary']['300']) 
      rgbTooltipColor = $theme.colors?.[$theme.active]['dark']['primary']['300']
  })

  $effect(() => {
    if(!rgbTooltipBackgroundColor && !!$theme.colors?.[$theme.active]['dark']['primary']['900']) 
      rgbTooltipBackgroundColor = $theme.colors?.[$theme.active]['dark']['primary']['900']
  })

  $effect(() => {
    if(!rgbBackgroundColor && !!$theme.colors?.[$theme.active]['dark']['background']['200']) 
      rgbBackgroundColor = $theme.colors?.[$theme.active]['dark']['background']['200']
  })

  let finalTooltipColor = $derived(!!rgbTooltipColor ? `rgb(${rgbTooltipColor})` : undefined)
  let finalTooltipBackgroundColor = $derived(!!rgbTooltipBackgroundColor ? `rgb(${rgbTooltipBackgroundColor})` : undefined)
  let finalBackgroundColor = $derived(!!rgbBackgroundColor ? `rgb(${rgbBackgroundColor}, .3)` : undefined)  

  let chartOptions: ComponentProps<typeof Bar>['options'] = $derived({
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
            enabled: enableZoom,
            mode: 'x',
            modifierKey: 'ctrl',
          },
          zoom: {
            drag: {
              enabled: enableZoom
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
          max: xMax,
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
            display: showXTicks,
            callback: xTickLabel,
            stepSize: xTickStepSize
          }
        },
        y: {
          max: yMax,
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
            display: showYTicks,
            callback: yTickLabel,
            stepSize: yTickStepSize
          }
        }
      }
    })
</script>

<Bar
  data={data}
  bind:resetZoom
  options={chartOptions}
  width={width}
  height={height}
></Bar>