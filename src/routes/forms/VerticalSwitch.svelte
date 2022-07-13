<script lang="ts">
  let value: boolean = false
  let options: string[] = ["ON","OFF"]
  import VerticalSwitch from '$lib/forms/VerticalSwitch.svelte';
</script>

<div class="card-container">
  <VerticalSwitch
    bind:value={value}
    options={options}
    rounded
    height="100px"
    width="50px"
    fontSize="15px"
    backgroundColor="#E3F2FD"
    selectedOptionColor="#64B5F6"
    optionColor="#BBDEFB"
    animationDuration="0.2s"
  ></VerticalSwitch>
  <span style:margin-top="200px">{value}</span>
</div>


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