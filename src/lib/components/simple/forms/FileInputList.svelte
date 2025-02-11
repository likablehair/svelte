<script lang="ts">
  import "../../../css/main.css";
  import "./FileInputList.css";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import FileInput from "$lib/components/simple/forms/FileInput.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
    import { createEventDispatcher } from "svelte";

  let clazz: string = "";
  export { clazz as class };

  let dispatch = createEventDispatcher<{
    fileChange: {
      files: File[]
    }
  }>()

  export let files: File[] = [],
    persistOverUpload: boolean = true,
    dropAreaActive: boolean = true,
    icon: string = "mdi-file-document",
    message: string = "Drop file here or click to upload",
    disabled: boolean = false,
    maxFiles: number | undefined = undefined;

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
    dispatch("fileChange", { files })
  }

  function handleFileDrop() {
    dispatch("fileChange", { files })
  }

  function handleFileSelect() {
    dispatch("fileChange", { files })
  }
</script>

<div class="card-container {clazz}">
  <FileInput
    bind:files
    {persistOverUpload}
    disabled={disabled || (maxFiles !== undefined && files.length >= maxFiles)}
    --file-input-border-radius="var(--file-input-list-border-radius,var(--file-input-list-default-border-radius))"
    --file-input-background-color="var(--file-input-list-background-color,var(--file-input-list-default-background-color))"
    --file-input-color="var(--file-input-list-color,var(--file-input-list-default-color))"
    --file-input-height="var(--file-input-list-height,var(--file-input-list-default-height))"
    --file-input-width="var(--file-input-list-width,var(--file-input-list-default-width))"
    on:change
    on:fileDrop={handleFileDrop}
    on:fileDrop
    on:fileSelect={handleFileSelect}
    on:fileSelect
    {maxFiles}
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
          <slot name="message">
            <span>{message}</span>
          </slot>
        {:else}
          <slot name="file-list" {files}>
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
                >
                  <td>
                    <Icon name={icon} />
                  </td>
                  <td class="file-name">
                    {file.name}
                  </td>
                  <td>
                    {file.size}
                  </td>
                  <td style:width="10%" style:margin-right="10px">
                    <Button
                      buttonType="text"
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
          </slot>
        {/if}
      </div>
    </span>
  </FileInput>
</div>

<style>
  .body-span {
    height: 100px;
    width: 100%;
    display: flex;
  }
  .card-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    border-color: var(
      --file-input-list-border-color,
      var(--file-input-list-default-border-color)
    );
    height: var(--file-input-list-height,var(--file-input-list-default-height));
    width: var(--file-input-list-background-width,var(--file-input-list-default-width));
  }

  .card-container:hover {
    color: var(
      --file-input-list-hover-color,
      var(--file-input-list-default-hover-color)
    );
  }

  .body-container {
    border: dotted;
    border-color: var(
      --file-input-list-border-color,
      var(--file-input-list-default-border-color)
    );
    border-radius: var(
      --file-input-list-border-radius,
      var(--file-input-list-default-border-radius)
    );
    width: calc(100% - 20px);
    height: calc(100% - 20px);
    box-sizing: border-box;
    margin: auto;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.2s;
    overflow-y: auto;
  }

  .active {
    border-color: var(
      --file-input-list-selected-row-background,
      var(--file-input-list-default-selected-row-background)
    );
    color: var(
      --file-input-list-selected-row-color,
      var(--file-input-list-default-selected-row-color)
    );
  }
  .file-active {
    color: var(
      --file-input-list-selected-row-color,
      var(--file-input-list-default-selected-row-color)
    );
    background-color: var(
      --file-input-list-selected-row-background,
      var(--file-input-list-default-selected-row-background)
    );
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
