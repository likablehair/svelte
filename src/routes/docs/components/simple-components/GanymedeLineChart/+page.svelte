<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import GanymedeLineChart from "$lib/components/simple/charts/GanymedeLineChart.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";

  let resetZoom: boolean = false
</script>

<h1>GanymedeLineChart</h1>
<ComponentSubtitle>Ganymede line chart.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <GanymedeLineChart
    data={{
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
    }}
    showLegend={false}
    enableZoom={true}
    bind:resetZoom={resetZoom}
  ></GanymedeLineChart>
  <Button
    onclick={() => { resetZoom = true }}
  >Reset zoom</Button>
  <div style:height="24px" style:width="48px">
    <GanymedeLineChart
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
      showLegend={false}
      enableZoom={false}
      showXTicks={false}
      showYTicks={false}
      displayYGrid={false}
      displayXGrid={false}
      maintainAspectRatio={false}
      pointRadius={0}
      hitRadius={0}
      hoverRadius={0}
      gridLineWidth={0}
      lineWidth={1}
      tooltipsDisabled={true}
      bind:resetZoom={resetZoom}
    ></GanymedeLineChart>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "data", type: "object", description: "Chart data including labels and datasets", default: "{ labels: [], datasets: [] }" },
    { name: "horizontal", type: "boolean", description: "Display chart in horizontal mode", default: "false" },
    { name: "responsive", type: "boolean", description: "Make chart responsive", default: "true" },
    { name: "maintainAspectRatio", type: "boolean", description: "Maintain aspect ratio", default: "true" },
    { name: "showLegend", type: "boolean", description: "Show legend in chart", default: "true" },
    { name: "showYTicks", type: "boolean", description: "Display Y-axis ticks", default: "false" },
    { name: "showXTicks", type: "boolean", description: "Display X-axis ticks", default: "false" },
    { name: "displayYGrid", type: "boolean", description: "Show grid lines along Y-axis", default: "true" },
    { name: "displayXGrid", type: "boolean", description: "Show grid lines along X-axis", default: "true" },
    { name: "gridLineWidth", type: "number", description: "Width of grid lines", default: "1" },
    { name: "lineWidth", type: "number", description: "Width of line in the chart", default: "3" },
    { name: "enableZoom", type: "boolean", description: "Allow zooming in the chart", default: "false" },
    { name: "resetZoom", type: "boolean", description: "Control for resetting zoom", default: "false" },
    { name: "xTickStepSize", type: "number", description: "Step size for X-axis ticks", default: "undefined" },
    { name: "yTickStepSize", type: "number", description: "Step size for Y-axis ticks", default: "undefined" },
    { name: "xMax", type: "number", description: "Maximum value for X-axis", default: "undefined" },
    { name: "yMax", type: "number", description: "Maximum value for Y-axis", default: "undefined" },
    { name: "xMin", type: "number", description: "Minimum value for X-axis", default: "undefined" },
    { name: "yMin", type: "number", description: "Minimum value for Y-axis", default: "undefined" },
    { name: "pointRadius", type: "number", description: "Radius of data points", default: "undefined" },
    { name: "hitRadius", type: "number", description: "Hit detection radius of data points", default: "undefined" },
    { name: "hoverRadius", type: "number", description: "Hover radius of data points", default: "undefined" },
    { name: "tooltipsDisabled", type: "boolean", description: "Disable tooltips in chart", default: "false" }
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