<script lang="ts">
  import FileInputList from "$lib/forms/FileInputList.svelte";

  let files: File[] = [];
  let dropAreaActive = false;
</script>

<div class="card-container">
  <FileInputList
    persistOverUpload={true}
    height="200px"
    width="500px"
    backgroundColor="rgba(220,220,220,0.1)"
    rounded
    bind:files
    bind:dropAreaActive
  />

  <div style:margin-top="30px">
    {#each files as file}
      {file.name} <br />
    {/each}
    FileInputList {files.length}
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
