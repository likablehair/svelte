<script lang="ts">
  import Calendar from '$lib/dates/Calendar.svelte'

  let visibleMonth: number = new Date().getMonth()
  let visibleYear: number = new Date().getFullYear()

  function nextMonth() {
    if(visibleMonth == 11) {
      visibleMonth = 0
      visibleYear += 1
    } else {
      visibleMonth += 1
    }
  }

  function previousMonth() {
    if(visibleMonth == 0) {
      visibleMonth = 11
      visibleYear -= 1
    } else {
      visibleMonth -= 1
    }
  }
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
  <Calendar
    height="300px"
    width="300px"
    visibleMonth={visibleMonth}
    visibleYear={visibleYear}
  ></Calendar>
  <button on:click={previousMonth}>previous</button>
  <button on:click={nextMonth}>next</button>
</div>

