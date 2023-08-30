<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Paginator from "$lib/components/composed/list/Paginator.svelte";
    import GanymedeLineChart from "$lib/components/simple/charts/GanymedeLineChart.svelte";
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
  ></GanymedeLineChart>
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
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>