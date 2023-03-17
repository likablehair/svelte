<script lang="ts">
  let value = false;

  import Checkbox from "$lib/components/simple/forms/Checkbox.svelte";
</script>

<div class="card-container">
  <Checkbox bind:value />
  <div style:margin-top="30px">
    {value}
  </div>
</div>

<style>
  .card-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
</style>
