<script lang="ts">
  import "../../../css/main.css";
  import "./FileInputList.css";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import FileInput from "$lib/components/simple/forms/FileInput.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { createEventDispatcher } from "svelte";

  let clazz: string = "";
  export { clazz as class };

  const dispatch = createEventDispatcher<{
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
    maxFiles: number | undefined = undefined,
    previewFiles: boolean = false

  let fileActive: File | null = null

  function isImageFile(file: File): boolean {
    if (file.type.startsWith("image/") && (
      file.type.endsWith("/jpg") 
      || file.type.endsWith("/png")
      || file.type.endsWith("/jpeg")
      || file.type.endsWith("/webp")
    )) {
      return true
    }
    return false
  }

  function handleFileMouseEnter(file: File) {
    dropAreaActive = false
    fileActive = file
  }
  function handleFileMouseLeave() {
    dropAreaActive = true
    fileActive = null
  }
  function handleFileClick(file: File) {
    alert(file.name)
  }
  function handleRemove(file: File) {
    files = files.filter((elem) => elem !== file)
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
    on:fileSelect={handleFileSelect}
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
        {#if files.length === 0}
          <slot name="message" class="message-slot">
            <span class="message-text">{message}</span>
          </slot>
        {:else}
          <div class="file-container {previewFiles ? 'grid-mode' : ''}">
            <slot name="file-list" class="file-slot" {files}>
              {#if previewFiles}
                <div class="preview-grid">
                  {#each files as file (file.name)}
                    <div
                      class="preview-item"
                      role="button"
                      tabindex="0"
                      draggable="false"
                      on:dragstart|preventDefault
                      on:click|stopPropagation={() => handleFileClick(file)}
                      on:keydown|stopPropagation={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleFileClick(file);
                      }}
                      on:mouseenter|stopPropagation={() => handleFileMouseEnter(file)}
                      on:mouseleave|stopPropagation={handleFileMouseLeave}
                      class:file-active={fileActive === file}
                    >
                      {#if isImageFile(file)}
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          class="preview-img"
                          draggable="false"
                        />
                      {:else}
                        <div class="preview-file">
                          <Icon name={icon} />
                          {#if file.name.length > 40}
                            <span class="file-name-preview">{file.name.slice(0, 40)}...</span>
                          {:else}
                            <span class="file-name-preview">{file.name}</span>
                          {/if}
                        </div>
                      {/if}
                      <button
                        type="button"
                        class="preview-remove"
                        on:click|stopPropagation={() => handleRemove(file)}
                        aria-label="Rimuovi {file.name}"
                        style:height="24px"
                        style:width="24px"
                      >
                        <Icon name="mdi-close" --icon-container-height="16px" --icon-container-width="16px" />
                      </button>
                    </div>
                  {/each}
                </div>
              {:else}
                <table class="file-list">
                  {#each files as file}
                    <tr
                      on:click|stopPropagation={() => handleFileClick(file)}
                      on:mouseenter|stopPropagation={() => handleFileMouseEnter(file)}
                      on:mouseleave|stopPropagation={handleFileMouseLeave}
                      class:file-active={fileActive === file}
                    >
                      <td><Icon name={icon} /></td>
                      <td class="file-name">{file.name}</td>
                      <td>{file.size}</td>
                      <td style="width: 10%; margin-right: 10px;">
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
              {/if}
            </slot>
          </div>
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
    border-color: var(
      --file-input-list-border-color,
      var(--file-input-list-default-border-color)
    );
    height: var(--file-input-list-height, var(--file-input-list-default-height));
    width: var(
      --file-input-list-width,
      var(--file-input-list-default-width)
    );
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

  .body-container.active {
    border-color: var(
      --file-input-list-selected-row-background,
      var(--file-input-list-default-selected-row-background)
    );
    color: var(
      --file-input-list-selected-row-color,
      var(--file-input-list-default-selected-row-color)
    );
  }

  .file-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    position: relative;
  }

  .file-container:not(.grid-mode) .file-list {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
  }

  .file-container:not(.grid-mode) .file-list tr {
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .file-container:not(.grid-mode) .file-list tr.file-active {
    color: var(
      --file-input-list-selected-row-color,
      var(--file-input-list-default-selected-row-color)
    );
    background-color: var(
      --file-input-list-selected-row-background,
      var(--file-input-list-default-selected-row-background)
    );
  }

  .file-name {
    width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-container.grid-mode {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    overflow-y: auto;
  }

  .file-container .file-slot {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
    padding: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .preview-item {
    position: relative;
    cursor: pointer;
    border-radius: 4px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .preview-item:hover,
  .preview-item:focus,
  .preview-item.file-active {
    transform: translateY(-4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .preview-img {
    display: block;
    width: 100%;
    height: 120px;
    object-fit: cover;
  }

  .preview-file {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 120px;
    padding: 0.5rem;
    background: rgb(var(--global-color-background-600));
    border-radius: 4px;
    box-sizing: border-box;
  }

  .file-name-preview {
    font-size: 0.75rem;
    text-align: center;
    word-break: break-word;
    margin-top: 0.5rem;
    line-height: 1.2;
    max-height: 2.4rem;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
  }

  .preview-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(51, 51, 51, 0.6);
    border: none;
    border-radius: 50%;
    padding: 4px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .preview-remove:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .message-slot {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .message-text {
    text-align: center;
    font-size: 1rem;
  }
</style>
