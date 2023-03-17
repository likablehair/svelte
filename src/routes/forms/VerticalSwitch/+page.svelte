<script lang="ts">
  let value = false;
  import VerticalSwitch from "$lib/forms/VerticalSwitch.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
</script>

<div class="card-container">
  <VerticalSwitch
    bind:value
    rounded
    height="100px"
    width="50px"
    fontSize="15px"
    backgroundColor="#E3F2FD"
    selectedOptionColor="#64B5F6"
    optionColor="#BBDEFB"
    animationDuration="0.2s"
  >
    <span slot="trueOption">
      <Icon name="mdi-white-balance-sunny" size={18} />
    </span>
    <span slot="falseOption">
      <Icon name="mdi-weather-night" size={18} />
    </span>
  </VerticalSwitch>
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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
</style>
