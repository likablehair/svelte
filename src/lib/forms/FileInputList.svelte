<script lang="ts">
    import Button from "$lib/buttons/Button.svelte";
    import FileInput from "$lib/forms/FileInput.svelte";
    import Icon from "$lib/media/Icon.svelte";

    export let files: File[] = undefined,
        persistOverUpload: boolean = true,
        height: string = "100%",
        width: string = "100%",
        backgroundColor: string = "rgba(255,255,255,0)",
        textColor: string = "rgba(0,0,0,0.7)",
        rounded: boolean = true,
        focusShadow: string = undefined,
        dropAreaActive: boolean = true,
        icon: string = "mdi-folder",
        iconSize: number = 30,
        selectedRowColor: string = "red",
        selectedRowBackground: string = "rgba(0,0,0,0.1)";

    let fileActive: File = null;

    function handleFileMouseEnter(file) {
      dropAreaActive = false;
      fileActive = file;
    }
    function handleFileMouseLeave(file) {
      dropAreaActive = true;
      fileActive = null;
    }
    function handleFileClick(file) {
      alert(file.name)
    }
    function handleRemove(file) {
      files = files.filter((elem)=>{
        return elem != file;
      })
    }

  </script>

  <div class="card-container">
    <FileInput
      {persistOverUpload}
      {height}
      {width}
      {backgroundColor}
      {rounded}
      bind:files={files}
      {focusShadow}
      {textColor}
    >
      <span slot="body" style:height="100%" style:width="100%" style:display="flex" let:active={dropAreaActive}>
        <div class="body-container"  class:active={dropAreaActive}>
            {#if files.length == 0}
            <span >Drop file here or click to upload</span>
            {:else}
            <table class="file-list">
              {#each files as file}
                <tr
                  on:click|stopPropagation="{()=>{handleFileClick(file)}}"
                  on:mouseenter|stopPropagation="{()=>{handleFileMouseEnter(file)}}"
                  on:mouseleave|stopPropagation="{()=>{handleFileMouseLeave(file)}}"
                  class:file-active={fileActive == file}
                  style:--selected-color={selectedRowColor}
                  style:--selected-background={selectedRowBackground}
                >
                  <td>
                      <Icon name={icon} size={iconSize}></Icon>
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
                      on:click="{(e)=>{
                        e.detail.nativeEvent.stopPropagation();
                        handleRemove(file)
                      }}"
                    ></Button>
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
      overflow-y: auto;
    }
    .active {
      border-color: rgba(255,0,0,0.5);
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
