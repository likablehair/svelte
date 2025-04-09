<script lang="ts">
  import Pie from './Pie.svelte'
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LinearScale,
    PointElement,
    CategoryScale,
    ArcElement,
  } from "chart.js";
  import type { ComponentProps } from "svelte";

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LinearScale,
    PointElement,
    CategoryScale
  );

  interface Props {
    data: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
        hoverBackgroundColor?: string[];
        hoverOffset?: number;
      }[];
      options?: {
        title: {
          display: boolean;
          text: string;
        };
      };
    };
    showLegend?: boolean;
    responsive?: boolean;
    maintainAspectRatio?: boolean
  }

  let {
    data = {
      labels: [],
      datasets: [],
      options: {
        title: {
          display: false,
          text: "",
        },
      },
    },
    responsive = true,
    maintainAspectRatio = false,
    showLegend = true
  }: Props = $props();

  let chartOptions: ComponentProps<typeof Pie>['options'] = $derived({
    responsive,
    maintainAspectRatio,
    plugins: {
      legend: {
        display: showLegend
      }
    }
  })
</script>

<Pie 
  bind:data 
  options={chartOptions}
></Pie>
