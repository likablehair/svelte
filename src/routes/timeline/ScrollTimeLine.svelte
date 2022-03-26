<script lang="ts">
  let periods = [
      {
        name: 'dinasours',
        title: 'Era dei dinosauri',
        from: new Date(2001, 1, 1),
        to: new Date(2002, 1, 1)
      }, {
        name: 'sapiens',
        title: 'Era dei sapiens',
        from: new Date(2002, 1, 1),
        to: new Date(2003, 1, 1)
      },
    ],
    selectedPeriodIndex: number = 0

  $: selectedPeriod = periods[selectedPeriodIndex]
  import ScrollTimeLine from "$lib/timeline/ScrollTimeLine.svelte";
  import Button from "$lib/buttons/Button.svelte"
  import '$lib/common/tailwind.css';
</script>


<div 
  class="w-screen h-screen flex justify-center items-center"
>
  <Button
    type="icon"
    icon="mdi-arrow-left"
    on:click={() => selectedPeriodIndex = selectedPeriodIndex - 1}
  ></Button>
  <ScrollTimeLine
    height="300px"
    width="800px"
    periods={periods}
    value={selectedPeriod}
    progressBackgroundColor="blue"
    progressColor="red"
  ></ScrollTimeLine>
  <Button
    type="icon"
    icon="mdi-arrow-right"
    on:click={() => selectedPeriodIndex = selectedPeriodIndex + 1}
  ></Button>
</div>