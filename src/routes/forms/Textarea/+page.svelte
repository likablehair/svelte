<script>
  import Textarea from "$lib/forms/Textarea.svelte";

  let textValue = "";
</script>

<div class="card-container">
  <Textarea
    label="prova"
    placeholder="testo..."
    labelFontSize="20px"
    labelColor="red"
    width="500px"
    height="200px"
    bind:value={textValue}
    resizable={true}
    maxLength={200}
    fontSize="14px"
    borderRadius="4px"
    backgroundColor="rgba(0,0,0,0.05)"
    textColor="black"
    padding="15px"
    focusedBoxShadow="0px 0px 2px 1px #0063FF"
  />
  {textValue}
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
