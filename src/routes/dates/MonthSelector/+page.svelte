<script lang="ts">
  import MonthSelector from '$lib/dates/MonthSelector.svelte'

  let selectedMonth: number = new Date().getMonth()

</script>

<style>
  .card-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>

<div class="card-container">
  <MonthSelector
    height="200px"
    width="300px"
    bind:selectedMonth={selectedMonth}
  ></MonthSelector>
  <div
    style:display="flex"
  >
    <div><b>selectedDate:</b> {selectedMonth}</div>
  </div>
</div>

