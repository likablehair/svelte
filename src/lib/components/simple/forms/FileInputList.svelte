<script lang="ts">
  import "../../../css/main.css";
  import "./FileInputList.css";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import FileInput from "$lib/components/simple/forms/FileInput.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import type { ComponentProps, Snippet } from "svelte";

  interface Props {
    files?: File[];
    persistOverUpload?: boolean;
    dropAreaActive?: boolean;
    icon?: string;
    message?: string;
    disabled?: boolean;
    maxFiles?: number;
    class?: string
    onchange?: ComponentProps<typeof FileInput>['onchange']
    onfileChange?: (event: {
      detail: {
        files: File[]
      }
    }) => void
    onfileDrop?: () => void
    onfileSelect?: () => void
    bodySnippet?: Snippet<[{
      active: boolean
    }]>
    messageSnippet?: Snippet<[{
      message: string | undefined
    }]>
    fileListSnippet?: Snippet<[{
      files: File[]
      previewFiles: boolean
      fileActive: File | null
    }]>,
    previewFiles?: boolean
  }

  let {
    files = $bindable(),
    persistOverUpload = true,
    dropAreaActive = true,
    icon = "mdi-file-document",
    message = "Drop file here or click to upload",
    disabled = false,
    maxFiles = undefined,
    class: clazz = '',
    onchange,
    onfileChange,
    onfileDrop,
    onfileSelect,
    bodySnippet: bodyOuterSnippet,
    messageSnippet,
    fileListSnippet,
    previewFiles = false
  }: Props = $props();

  let fileActive: File | null = $state(null);

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
    files = files?.filter((elem) => {
      return elem !== file;
    });

    if(onfileChange){
      onfileChange({
        detail: {
          files: files || []
        }
      })
    }
  }

  function handleFileDrop() {
    if(onfileChange){
      onfileChange({
        detail: {
          files: files || []
        }
      })
    }

    if(onfileDrop){
      onfileDrop()
    }
  }

  function handleFileSelect() {
    if(onfileChange){
      onfileChange({
        detail: {
          files: files || []
        }
      })
    }

    if(onfileSelect){
      onfileSelect()
    }
  }

  function isImageFile(file: File): boolean {
    return file.type.startsWith('image/')
  }
</script>

<div class="card-container {clazz}">
  <FileInput
    bind:files
    {persistOverUpload}
    disabled={disabled || (maxFiles !== undefined && !!files && files.length >= maxFiles)}
    --file-input-border-radius="var(--file-input-list-border-radius,var(--file-input-list-default-border-radius))"
    --file-input-background-color="var(--file-input-list-background-color,var(--file-input-list-default-background-color))"
    --file-input-color="var(--file-input-list-color,var(--file-input-list-default-color))"
    --file-input-height="var(--file-input-list-height,var(--file-input-list-default-height))"
    --file-input-width="var(--file-input-list-width,var(--file-input-list-default-width))"
    {onchange}
    onfileDrop={handleFileDrop}
    onfileSelect={handleFileSelect}
    {maxFiles}
  >
    {#snippet bodySnippet({ active })}
      {#if bodyOuterSnippet}
        {@render bodyOuterSnippet({ active })}
      {:else}
        <span
          style:height="100%"
          style:width="100%"
          style:display="flex"
        >
          <div class="body-container" class:{active}>
            {#if !files || files.length === 0}
              {#if messageSnippet}
                {@render messageSnippet({ message })}
              {:else}
                <span class="message-text">{message}</span>
              {/if}
            {:else}
              <div class="file-container {previewFiles ? 'grid-mode' : ''}">
                {#if fileListSnippet}
                  {@render fileListSnippet({ files: files || [], previewFiles, fileActive })}
                {:else}
                  {#if previewFiles}
                    <div class="preview-grid">
                      {#each files as file (file.name)}
                        <div
                          class="preview-item"
                          role="button"
                          tabindex="0"
                          draggable="false"
                          ondragstart={(e) => e.preventDefault()}
                          onclick={(e) => {
                            e.stopPropagation();
                            handleFileClick(file);
                          }}
                          onkeydown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter' || e.key === ' ') handleFileClick(file);
                          }}
                          onmouseenter={(e) => {
                            e.stopPropagation();
                            handleFileMouseEnter(file);
                          }}
                          onmouseleave={(e) => {
                            e.stopPropagation();
                            handleFileMouseLeave();
                          }}
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
                              <span class="file-name-preview">{file.name}</span>
                            </div>
                          {/if}
                          <button
                            type="button"
                            class="preview-remove"
                            onclick={(e) => {
                              e.stopPropagation();
                              handleRemove(file);
                            }}
                            aria-label="Remove {file.name}"
                          >
                            <Icon name="mdi-close" />
                          </button>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <table class="file-list">
                      <tbody>
                        {#each files as file}
                          <tr
                            onclick={(e) => { e.stopPropagation(); handleFileClick(file); }}
                            onmouseenter={(e) => { e.stopPropagation(); handleFileMouseEnter(file); }}
                            onmouseleave={(e) => { e.stopPropagation(); handleFileMouseLeave(); }}
                            class:file-active={fileActive === file}
                          >
                            <td><Icon name={icon} /></td>
                            <td class="file-name">{file.name}</td>
                            <td>{file.size}</td>
                            <td style="width: 10%; margin-right: 10px;">
                              <Button
                                buttonType="text"
                                icon="mdi-close"
                                onclick={(e) => {
                                  e.detail.nativeEvent.stopPropagation();
                                  handleRemove(file);
                                }}
                              />
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  {/if}
                {/if}
              </div>
            {/if}
          </div>
        </span>
      {/if}
    {/snippet}
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
      --file-input-list-background-width,
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

  /* --- preview grid --- */
  .file-container.grid-mode {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    overflow-y: auto;
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
    background: rgba(244, 244, 245, 0.8);
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
    background: rgba(0, 0, 0, 0.6);
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

  /* Messaggio centrale quando non ci sono file */
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
