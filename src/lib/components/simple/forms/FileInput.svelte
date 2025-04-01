<script lang="ts">
  import type { Snippet } from 'svelte';
  import '../../../css/main.css'
  import './FileInput.css'

  interface Props {
    files?: File[] | undefined;
    placeholder?: string | undefined;
    persistOverUpload?: boolean;
    disabled?: boolean;
    maxFiles?: number | undefined;
    class?: string
    onfileDrop?: (event: {
      detail: {
        nativeEvent: DragEvent;
        files: File[];
      }
    }) => void
    onfileSelect?: (event: {
      detail: {
        nativeEvent: Event;
        files: File[];
      }
    }) => void
    onchange?: () => void
    bodySnippet?: Snippet<[{
      active: boolean
    }]>
  }

  let {
    files = $bindable(undefined),
    placeholder = undefined,
    persistOverUpload = true,
    disabled = false,
    maxFiles = undefined,
    class: clazz = '',
    onfileDrop,
    onfileSelect,
    onchange,
    bodySnippet,
  }: Props = $props();

  let inputElement: HTMLElement | undefined = undefined;
  let dropAreaActive = $state(false);

  const highlight: (highlighted: boolean) => void = (highlighted) => {
    dropAreaActive = highlighted && !disabled;
  };

  function handleFileDrop(event: DragEvent) {
    highlight(false)
    let droppedFiles: FileList | undefined = event.dataTransfer?.files;
    let limitedFiles: File[]

    if (droppedFiles) {
      if(maxFiles !== undefined) {
        let freeSlots = Math.max(0, maxFiles - (files?.length || 0))
        limitedFiles = Array.from(droppedFiles).slice(0, freeSlots)
      } else {
        limitedFiles = Array.from(droppedFiles)
      }

      if (!persistOverUpload) files = limitedFiles;
      else
        files = files
          ? [...files, ...limitedFiles]
          : limitedFiles;

      if(onfileDrop){
        onfileDrop({
          detail: {
            nativeEvent: event,
            files: limitedFiles,
          }
        })
      }
    }
  }

  function handleFileFromInput(event: Event) {
    let selectedFiles: FileList | null = (<HTMLInputElement>event.target).files;
    let limitedFiles: File[]

    if (selectedFiles) {
      if(maxFiles !== undefined) {
        let freeSlots = Math.max(0, maxFiles - (files?.length || 0))
        limitedFiles = Array.from(selectedFiles).slice(0, freeSlots)
      } else {
        limitedFiles = Array.from(selectedFiles)
      }

      if (!persistOverUpload) files = limitedFiles;
      else
        files = files
          ? [...files, ...limitedFiles]
          : limitedFiles;

      if(onfileSelect){
        onfileSelect({
          detail: {
            nativeEvent: event,
            files: limitedFiles,
          }
        })
      }
    }
  }
</script>

<div
  onclick={() => inputElement?.click()}
  onkeypress={() => inputElement?.click()}
  ondragover={(e) => {
    e.preventDefault()
    highlight(true)
  }}
  ondragleave={() => highlight(false)}
  ondragend={() => highlight(false)}
  ondrop={(e) => {
    e.preventDefault()
    if (!disabled) handleFileDrop(e);
  }}
  class:disabled
  class="drop-area {clazz}"
  class:active={dropAreaActive}
  role="presentation"
>
  {#if bodySnippet}
    {@render bodySnippet({ active: dropAreaActive})}
  {:else}
    <span> { placeholder || 'Drop file here or click to upload'} </span>
  {/if}

  <input
    type="file"
    multiple
    bind:this={inputElement}
    oninput={handleFileFromInput}
    {onchange}
    {disabled}
  />
</div>

<style>
  .drop-area {
    border-radius: var(
      --file-input-border-radius,
      var(--file-input-default-border-radius)
    );
    height: var(
      --file-input-height,
      var(--file-input-default-height)
    );
    width: var(
      --file-input-width,
      var(--file-input-default-width)
    );
    color: var(
      --file-input-color,
      var(--file-input-default-color)
    );
    background-color: var(
      --file-input-background-color,
      var(--file-input-default-background-color)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    transition: 0.2s;
  }

  .drop-area.active {
    background-color: var(
      --file-input-active-background-color,
      var(--file-input-default-active-background-color)
    );
  }

  .disabled {
    opacity: 0.5;
    cursor: default;
  }
  .drop-area > input {
    display: none;
  }
  .drop-area:hover:not(.disabled) {
    box-shadow: var(
      --file-input-focus-shadow,
      var(--file-input-default-focus-shadow)
    );
  }
</style>
