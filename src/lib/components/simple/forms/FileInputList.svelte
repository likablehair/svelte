<script lang="ts">
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import FileInput from "$lib/components/simple/forms/FileInput.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";

  export let files: File[] = [],
    persistOverUpload = true,
    height = "100%",
    width = "100%",
    backgroundColor = "rgba(255,255,255,0)",
    textColor = "rgba(0,0,0,0.7)",
    rounded = true,
    focusShadow: string | undefined = undefined,
    dropAreaActive = true,
    icon = "mdi-folder",
    iconSize = 30,
    selectedRowColor = "red",
    selectedRowBackground = "rgba(0,0,0,0.1)",
    hoverColor = "rgba(255,0,0,0.5)",
    borderColor = "rgba(0, 0, 0, 0.2)";

  let fileActive: File | null = null;

  function handleFileMouseEnter(file: File) {
    dropAreaActive = false;
    fileActive = file;
  }
  function handleFileMouseLeave() {
    dropAreaActive = true;
    fileActive = null;
  }
  function handleFileClick(file: File) {
    alert(file.name);
  }
  function handleRemove(file: File) {
    files = files.filter((elem) => {
      return elem != file;
    });
  }
</script>

<div
  class="card-container"
  style:--file-input-list-hover-color={hoverColor}
  style:--file-input-list-border-color={borderColor}
>
  <FileInput
    {persistOverUpload}
    {height}
    {width}
    {backgroundColor}
    {rounded}
    bind:files
    {focusShadow}
    {textColor}
  >
    <span
      slot="body"
      style:height="100%"
      style:width="100%"
      style:display="flex"
      let:active={dropAreaActive}
    >
      <div class="body-container" class:active={dropAreaActive}>
        {#if files.length == 0}
          <span>Drop file here or click to upload</span>
        {:else}
          <table class="file-list">
            {#each files as file}
              <tr
                on:click|stopPropagation={() => {
                  handleFileClick(file);
                }}
                on:mouseenter|stopPropagation={() => {
                  handleFileMouseEnter(file);
                }}
                on:mouseleave|stopPropagation={() => {
                  handleFileMouseLeave();
                }}
                class:file-active={fileActive == file}
                style:--selected-color={selectedRowColor}
                style:--selected-background={selectedRowBackground}
              >
                <td>
                  <Icon name={icon} size={iconSize} />
                </td>
                <td class="file-name">
                  {file.name}
                </td>
                <td>
                  {file.size}
                </td>
                <td style:width="10%" style:margin-right="10px">
                  <Button
                    icon="mdi-close"
                    on:click={(e) => {
                      e.detail.nativeEvent.stopPropagation();
                      handleRemove(file);
                    }}
                  />
                </td>
              </tr>
            {/each}
          </table>
        {/if}
      </div>
    </span>
  </FileInput>
</div>

<style>
  .card-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
  .body-container {
    border: dotted var(--file-input-list-border-color);
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
    overflow-y: auto;
  }
  .active {
    border-color: var(--file-input-list-hover-color);
  }
  .file-active {
    color: var(--selected-color);
    background-color: var(--selected-background);
  }
  .file-list {
    width: 100%;
    table-layout: fixed;
    position: absolute;
    top: 0;
    right: 0;
    border-collapse: collapse;
  }
  .file-name {
    width: 40%;
    overflow: hidden;
  }
</style>
