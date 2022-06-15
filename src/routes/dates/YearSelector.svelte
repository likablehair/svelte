<script lang="ts">
  import YearSelector from '$lib/dates/YearSelector.svelte'

  let selectedYear: number = new Date().getFullYear()

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
  <YearSelector
    height="200px"
    width="300px"
    bind:selectedYear={selectedYear}
  ></YearSelector>
  <div
    style:display="flex"
  >
    <div><b>selectedYear:</b> {selectedYear}</div>
  </div>
</div>

