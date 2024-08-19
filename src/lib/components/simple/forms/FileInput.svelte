<script lang="ts">
  import '../../../css/main.css'
  import './FileInput.css'
  import { createEventDispatcher } from "svelte";

  let clazz: string = '';
	export { clazz as class };

  /*
    Styles

    --file-input-default-height
    --file-input-default-width
    --file-input-default-color
    --file-input-default-background-color
    --file-input-default-focus-shadow
    --file-input-border-radius
  */

  export let files: File[] | undefined = undefined,
    placeholder: string | undefined = undefined,
    persistOverUpload : boolean = true,
    disabled : boolean = false,
    limit: number | undefined = undefined;

  let inputElement: HTMLElement | undefined = undefined;
  let dropAreaActive = false;

  const highlight: (highlighted: boolean) => void = (highlighted) => {
    dropAreaActive = highlighted && !disabled;
  };

  const dispatch = createEventDispatcher<{
    fileDrop: {
      nativeEvent: DragEvent;
      files: File[];
    };
    fileSelect: {
      nativeEvent: Event;
      files: File[];
    };
  }>();

  function handleFileDrop(event: DragEvent) {
    let droppedFiles: FileList | undefined = event.dataTransfer?.files;
    let limitedFiles: File[]

    if (droppedFiles) {
      if(limit !== undefined) {
        let freeSlots = Math.max(0, limit - (files?.length || 0))
        limitedFiles = Array.from(droppedFiles).slice(0, freeSlots)
      } else {
        limitedFiles = Array.from(droppedFiles)
      }

      if (!persistOverUpload) files = limitedFiles;
      else
        files = files
          ? [...files, ...limitedFiles]
          : limitedFiles;

      dispatch("fileDrop", {
        nativeEvent: event,
        files: limitedFiles,
      });
    }
  }

  function handleFileFromInput(event: Event) {
    let selectedFiles: FileList | null = (<HTMLInputElement>event.target).files;
    let limitedFiles: File[]

    if (selectedFiles) {
      if(limit !== undefined) {
        let freeSlots = Math.max(0, limit - (files?.length || 0))
        limitedFiles = Array.from(selectedFiles).slice(0, freeSlots)
      } else {
        limitedFiles = Array.from(selectedFiles)
      }

      if (!persistOverUpload) files = limitedFiles;
      else
        files = files
          ? [...files, ...limitedFiles]
          : limitedFiles;

      dispatch("fileSelect", {
        nativeEvent: event,
        files: limitedFiles,
      });
    }
  }
</script>

<div
  on:click={() => inputElement?.click()}
  on:keypress={() => inputElement?.click()}
  on:dragover|preventDefault={() => highlight(true)}
  on:dragleave={() => highlight(false)}
  on:dragend={() => highlight(false)}
  on:drop|preventDefault={(e) => {
    if (!disabled) handleFileDrop(e);
  }}
  class:disabled
  class="drop-area {clazz}"
>
  <slot name="body" active={dropAreaActive}>
    <span> { placeholder || 'Drop file here or click to upload'} </span>
  </slot>

  <input
    type="file"
    multiple
    bind:this={inputElement}
    on:input={handleFileFromInput}
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
