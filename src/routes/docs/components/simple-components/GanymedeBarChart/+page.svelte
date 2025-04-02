<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import GanymedeBarChart from "$lib/components/simple/charts/GanymedeBarChart.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";

  let resetZoom: boolean = false
</script>

<h1>GanymedeBarChart</h1>
<ComponentSubtitle>Ganymede bar chart.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <GanymedeBarChart
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
    showXTicks={true}
    showYTicks={true}
    enableZoom={true}
    lineWidth={0}
    bind:resetZoom={resetZoom}
    rgbTooltipBackgroundColor={'255 0 0'}
    rgbTooltipColor={'0 255 0'}
  ></GanymedeBarChart>
  <Button
    onclick={() => { resetZoom = true }}
  >Reset zoom</Button>
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
    { name: "lineWidth", type: "number", description: "Width of line in the chart", default: "1" },
    { name: "enableZoom", type: "boolean", description: "Allow zooming in the chart", default: "true" },
    { name: "resetZoom", type: "boolean", description: "Control for resetting zoom", default: "false" },
    { name: "tooltipLabel", type: "function", description: "Custom tooltip label formatter", default: "undefined" },
    { name: "yTickLabel", type: "function", description: "Custom Y-axis tick label formatter", default: "undefined" },
    { name: "xTickLabel", type: "function", description: "Custom X-axis tick label formatter", default: "undefined" },
    { name: "xTickStepSize", type: "number", description: "Step size for X-axis ticks", default: "undefined" },
    { name: "yTickStepSize", type: "number", description: "Step size for Y-axis ticks", default: "undefined" },
    { name: "xMax", type: "number", description: "Maximum value for X-axis", default: "undefined" },
    { name: "yMax", type: "number", description: "Maximum value for Y-axis", default: "undefined" },
    { name: "rgbTooltipColor", type: "string", description: "RGB color for tooltip text", default: "undefined" },
    { name: "rgbTooltipBackgroundColor", type: "string", description: "RGB background color for tooltip", default: "undefined" },
    { name: "rgbBackgroundColor", type: "string", description: "RGB background color for chart", default: "undefined" },
    { name: "width", type: "string | number", description: "Width of the chart", default: "undefined" },
    { name: "height", type: "string | number", description: "Height of the chart", default: "undefined" }
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