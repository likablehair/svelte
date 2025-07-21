<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import LineChart from "$lib/components/simple/charts/LineChart.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";

  let resetZoom: boolean = false

  let data = {
      labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Vendite',
          data: [20, 30, 20, 40, 50, 10, 60, 20, 30, 20, 80, 100],
          backgroundColor: '#0891b2',
          borderColor: '#7dd3fc',
          tension: 0.3
        }, {
          label: 'Acquisti',
          data: [60, 20, 30, 20, 80, 100, 20, 30, 20, 40, 50, 10],
          backgroundColor: '#115e59',
          borderColor: '#0d9488',
          tension: 0.3
        },
      ]
    }
</script>

<h1>LineChart</h1>
<ComponentSubtitle>Line chart.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <LineChart
    {data}
    options={{
      plugins: {
        legend: {
          display: false
        }
      }
    }}
    bind:resetZoom={resetZoom}
  ></LineChart>
  <Button
    onclick={() => { resetZoom = true }}
  >Reset zoom</Button>
  <Button
    onclick={() => { 
      data = {
        labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Vendite',
            data: [20, 40, 20, 20, 30, 10, 70, 20, 30, 20, 80, 100],
            backgroundColor: '#0891b2',
            borderColor: '#7dd3fc',
            tension: 0.3
          }, {
            label: 'Acquisti',
            data: [60, 20, 30, 20, 80, 100, 20, 30, 20, 40, 50, 10],
            backgroundColor: '#115e59',
            borderColor: '#0d9488',
            tension: 0.3
          },
        ]
      }
    }}
  >Change data</Button>
  <div style:height="24px" style:width="48px">
    <LineChart
      data={{
        labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Vendite',
            data: [20, 30, 20, 40, 50, 10, 60, 20, 30, 20, 80, 100],
            backgroundColor: '#0891b2',
            borderColor: '#7dd3fc',
            tension: 0.3
          }
        ]
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          zoom: {
            pan: {
              enabled: false
            },
            zoom: {
              drag: {
                enabled: false
              }
            }
          },
          tooltip: {
            enabled: false
          }
        },
        elements: {
          point: {
            radius: 0,
            hitRadius: 0,
            hoverRadius: 0
          },
          line: {
            borderWidth: 1
          },
        },
        scales: {
          y: {
            display: false,
            grid: {
              lineWidth: 0
            }
          },
          x: {
            display: false,
          }
        }
      }}
      bind:resetZoom={resetZoom}
    ></LineChart>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "data", type: "object", description: "Chart data including labels and datasets", default: "{ labels: [], datasets: [] }" },
    { name: "options", type: "ChartOptions<'line'>", description: "Options for the chart", },
    { name: "resetZoom", type: "boolean", description: "Control for resetting zoom", default: "false" },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer></SlotsViewer>
<h2>Events</h2>
<EventsViewer></EventsViewer>

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