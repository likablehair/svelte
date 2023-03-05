<script lang="ts">
  import TimePickerTextField from "$lib/dates/TimePickerTextField.svelte";

  let time: Date = undefined,
    text = "",
    validTime = false;

  $: validTime = !(time == undefined);
</script>

<div class="card-container">
  <TimePickerTextField
    width="300px"
    bind:text
    bind:time
    hourFormat="12"
    focusedBoxShadow={validTime
      ? "rgba(0,0,0,0.2) 0px 2px 10px"
      : "rgba(255,0,0,0.4) 0px 2px 10px"}
  />
  <div style:margin-top="50px">
    <div>
      <b>date:</b>
      {time}
    </div>
    <div>
      <b>text:</b>
      {text}
    </div>
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
