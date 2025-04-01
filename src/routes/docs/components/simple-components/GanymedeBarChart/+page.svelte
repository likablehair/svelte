<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import GanymedeBarChart from "$lib/components/simple/charts/GanymedeBarChart.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";

  let resetZoom: boolean = true
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
  props={[]}
  styleProps={[]}
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