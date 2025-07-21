<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import BarChart from "$lib/components/simple/charts/BarChart.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";

  let resetZoom: boolean = false
</script>

<h1>BarChart</h1>
<ComponentSubtitle>Bar chart.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <BarChart
    data={{
      labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Vendite',
          data: [20, 30, 20, 40, 50, 10, 60, 20, 30, 20, 80, 100],
          backgroundColor: '#0891b2',
          borderColor: '#7dd3fc',
        }, {
          label: 'Acquisti',
          data: [60, 20, 30, 20, 80, 100, 20, 30, 20, 40, 50, 10],
          backgroundColor: '#115e59',
          borderColor: '#0d9488',
        },
      ]
    }}
    bind:resetZoom={resetZoom}
    options={{
      scales: {
        y: {
          grid: {
            lineWidth: 0
          },
          ticks: {
            display: true
          }
        },
        x: {
          ticks: {
            display: true
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: `rgb(255 0 0)`,
          titleColor: `rgb(0 255 0)`
        }
      }
    }}
    ></BarChart>
  <Button
    onclick={() => { resetZoom = true }}
  >Reset zoom</Button>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "data", type: "object", description: "Chart data including labels and datasets", default: "{ labels: [], datasets: [] }" },
    { name: "options", type: "ChartOptions<'bar'>", description: "Options for the chart", },
    { name: "resetZoom", type: "boolean", description: "Control for resetting zoom", default: "false" },
  ]}
></PropsViewer>
<h2>Slots</h2>
<EventsViewer></EventsViewer>
<h2>Events</h2>
<SlotsViewer></SlotsViewer>

<style>
  .example {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>