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
    maxFiles?: number | undefined;
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
    }]>
  }

  let {
    files = $bindable([]),
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
    files = files.filter((elem) => {
      return elem != file;
    });

    if(onfileChange){
      onfileChange({
        detail: {
          files
        }
      })
    }
  }

  function handleFileDrop() {
    if(onfileChange){
      onfileChange({
        detail: {
          files
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
          files
        }
      })
    }

    if(onfileSelect){
      onfileSelect()
    }
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
            {#if files.length == 0}
              {#if messageSnippet}
                {@render messageSnippet({ message })}
              {:else}
                <span>{message}</span>
              {/if}
            {:else}
              {#if fileListSnippet}
                {@render fileListSnippet({ files })}
              {:else}
                <table class="file-list">
                  <tbody>
                    {#each files as file}
                      <tr
                        onclick={(e) => {
                          e.stopPropagation()
                          handleFileClick(file);
                        }}
                        onmouseenter={(e) => {
                          e.stopPropagation()
                          handleFileMouseEnter(file);
                        }}
                        onmouseleave={(e) => {
                          e.stopPropagation()
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
        </span>
      {/if}
    {/snippet}
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
