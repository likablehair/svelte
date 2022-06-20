<script lang="ts">
  let value: boolean = false

  import Checkbox from '$lib/forms/Checkbox.svelte';
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
  <Checkbox
    bind:value={value}
  ></Checkbox>
  <div
    style:margin-top="30px"
  >
    {value}
  </div>
</div>