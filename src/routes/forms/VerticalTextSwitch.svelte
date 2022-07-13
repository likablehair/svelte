<script lang="ts">
  let value: boolean = false
  import VerticalTextSwitch from '$lib/forms/VerticalTextSwitch.svelte';
  import Icon from '$lib/media/Icon.svelte';

</script>

<div class="card-container">
  <VerticalTextSwitch
    bind:value={value}
    width="60px"
    height="30px"
    firstColor="#FFB74D"
    secondColor="#1976D2"
    backgroundColor="#E3F2FD"
  >
    <span slot="firstOption">
      <Icon name="mdi-white-balance-sunny" size={18}></Icon>
    </span>
    <span slot="secondOption">
      <Icon name="mdi-weather-night" size={18}></Icon>
    </span>
  </VerticalTextSwitch>
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