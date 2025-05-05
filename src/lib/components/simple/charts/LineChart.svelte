<script lang="ts">
  import Line from './Line.svelte';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
  } from 'chart.js';
  import { onMount, type ComponentProps } from 'svelte';

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale
  );

  let background: string | undefined = undefined,
    mounted: boolean = false

  onMount(async () => {
    let style = getComputedStyle(document.body);
    background = style.getPropertyValue('--global-color-background-200');
    mounted = true
  })

  interface Props {
    data: {
      labels: string[];
      datasets: {
        label: string;
        data: (number | null)[];
        backgroundColor?: string;
        borderColor?: string;
        hoverBackgroundColor?: string[];
        tension?: number;
        spanGaps?: boolean | number | undefined;
      }[];
    };
    horizontal?: boolean;
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    showLegend?: boolean;
    showYTicks?: boolean;
    showXTicks?: boolean;
    displayYGrid?: boolean;
    displayXGrid?: boolean;
    gridLineWidth?: number;
    lineWidth?: number;
    enableZoom?: boolean;
    resetZoom?: boolean;
    xTickStepSize?: number;
    yTickStepSize?: number;
    xMax?: number;
    yMax?: number;
    xMin?: number;
    yMin?: number;
    pointRadius?: number;
    hitRadius?: number;
    hoverRadius?: number;
    tooltipsDisabled?: boolean;
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
    displayXGrid = true,
    gridLineWidth = 1,
    lineWidth = 3,
    enableZoom = false,
    resetZoom = $bindable(false),
    xTickStepSize = undefined,
    yTickStepSize = undefined,
    xMax = undefined,
    yMax = undefined,
    xMin = undefined,
    yMin = undefined,
    pointRadius = undefined,
    hitRadius = undefined,
    hoverRadius = undefined,
    tooltipsDisabled = false,
  }: Props = $props();

  let gridColor = $derived('rgb(' + (background || '200, 200, 200') + ', .3)')

  let chartOptions: ComponentProps<typeof Line>['options'] = $derived({
      indexAxis: horizontal ? 'y' : 'x',
      responsive: responsive,
      maintainAspectRatio: maintainAspectRatio,
      elements: {
        line: {
          borderWidth: lineWidth
        },
        point: {
          radius: pointRadius,
          hitRadius: hitRadius,
          hoverRadius: hoverRadius
        }
      },
      plugins: {
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
        },
        tooltip: {
          enabled: !tooltipsDisabled
        }
      },
      interaction: {
        intersect: false,
      },
      scales: {
        x: {
          max: xMax,
          min: xMin,
          display: displayXGrid,
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
            stepSize: yTickStepSize
          }
        },
        y: {
          max: yMax,
          min: yMin,
          display: displayYGrid,
          title: {
          },
          grid: {
            lineWidth: gridLineWidth,
            color: gridColor
          },
          border: {
            dash: [10,10],
            display: false
          },
          ticks: {
            display: showXTicks,
            stepSize: xTickStepSize
          }
        }
      }
    })
</script>

<Line 
  data={(data as ComponentProps<typeof Line>['data'])}
  options={chartOptions}
  bind:resetZoom
></Line>