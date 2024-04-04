<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import GanymedePieChart from "$lib/components/simple/charts/GanymedePieChart.svelte";
</script>

<h1>GanymedePieChart</h1>
<ComponentSubtitle>Ganymede pie chart.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <GanymedePieChart
    data={{
      labels: [
        "Gen",
        "Feb",
        "Mar",
        "Apr",
        "Mag",
        "Giu",
        "Lug",
        "Ago",
        "Set",
        "Ott",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Vendite",
          data: [20, 30, 20, 40, 50, 10, 60, 20, 30, 20, 80, 100],
          backgroundColor: [
            "#FF3B30",
            "#eCD964",
            "#007AFF",
            "#FFCC00",
            "#FF9500",
            "#5856D6",
            "#FF2D55",
            "#8E8E93",
            "#FFFFFF",
            "#000000",
            "#8E7D6B",
            "#34C759",
          ],
          borderColor: "#7dd3fc",
        }
      ],
    }}
    showLegend={true}
  />
</div>
<h2>Props</h2>
<PropsViewer
  props={[]}
  styleProps={[]}
/>
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
