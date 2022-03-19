<script>
  let textValue = "my text"

  function handleInputChange(event) {
    console.log(event)
  }

  import Textfield from '$lib/forms/Textfield.svelte';
  import Icon from '$lib/media/Icon.svelte'
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

  .value {
    margin-top: 30px;
  }
</style>

<div class="card-container">
  <Textfield
    --width="300px"
    label="Nome"
    color="#22a939"
    bind:value={textValue}
    on:input="{handleInputChange}"
  ></Textfield>
  <div class="value">
    il valore: {textValue}
  </div>
  <Textfield
    --width="300px"
    label="Lo stesso nome"
    color="#22a939"
    variant="boxed"
    bind:value={textValue}
  ></Textfield>
  <Textfield
    --width="300px"
    label="Con icona"
    color="#22a939"
    variant="boxed"
    bind:value={textValue}
  >
    <svelte:fragment slot="append-inner">
      <Icon name="mdi-home"></Icon>
    </svelte:fragment>
  </Textfield>
  <Textfield
    --width="300px"
    label="Con icona"
    color="#22a939"
    variant="boxed"
    bind:value={textValue}
  >
    <svelte:fragment slot="append-inner">
      <Icon name="mdi-home"></Icon>
    </svelte:fragment>
  </Textfield>
</div>