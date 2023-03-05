<script lang="ts">
  import FileInput from "$lib/forms/FileInput.svelte";

  let files: File[] = [];
</script>

<div class="card-container">
  <FileInput
    persistOverUpload={true}
    height="100px"
    width="500px"
    backgroundColor="rgba(220,220,220,0.1)"
    rounded
    bind:files
    on:fileDrop={(e) => {
      console.log(e.detail.files);
    }}
    on:fileSelect={(e) => {
      console.log(e.detail.files);
    }}
    disabled={false}
  >
    <span
      slot="body"
      let:active
      style:height="100%"
      style:width="100%"
      style:display="flex"
    >
      <div class="body-container" class:active>
        <span>Drop file here or click to upload</span>
      </div>
    </span>
  </FileInput>

  <div style:margin-top="30px">
    {#each files as file}
      {file.name}
      <br />
    {/each}
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
  .body-container {
    border: dotted rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    box-sizing: border-box;
    width: calc(100% - 20px);
    height: calc(100% - 20px);
    margin: auto;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.2s;
  }
  .active {
    border-color: rgba(255, 0, 0, 0.5);
    color: rgba(255, 0, 0, 0.7);
  }
</style>
