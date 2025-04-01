<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import GanymedeLineChart from "$lib/components/simple/charts/GanymedeLineChart.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";

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
    // {
    //   name: 'type',
    //   type: '"button" | "submit"',
    //   description: "HTML type attribute",
    //   default: "button"
    // }
  ]}
  styleProps={[
    // {
    //   name: '--button-max-width',
    //   type: 'string',
    //   default: 'undefined',
    //   description: 'The max width of the outer element'
    // }
  ]}
></PropsViewer>
<h2>Slots</h2>
<h2>Events</h2>

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