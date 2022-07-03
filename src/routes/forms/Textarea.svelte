<script>

  import Textarea from '$lib/forms/Textarea.svelte';

  let textValue = "my text"

  function handleInputChange(event) {
    console.log(event)
  }
</script>


<div class="card-container">
  <Textarea
    width = "500px"
    height = "200px"
  ></Textarea>
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