<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let files: File[] | undefined = undefined,
    persistOverUpload = true,
    height = "100%",
    width = "100%",
    backgroundColor = "rgba(255,255,255,0)",
    textColor = "black",
    rounded = true,
    disabled = false,
    focusShadow =
      "inset 0 0 0 1px rgb(255 255 255/0.1), 0 0 #0000, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";

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
    if (droppedFiles) {
      if (!persistOverUpload) files = Array.from(droppedFiles);
      else
        files = files
          ? [...files, ...Array.from(droppedFiles)]
          : Array.from(droppedFiles);

      dispatch("fileDrop", {
        nativeEvent: event,
        files: Array.from(droppedFiles),
      });
    }
  }

  function handleFileFromInput(event: Event) {
    let selectedFiles: FileList | null = (<HTMLInputElement>event.target).files;

    if (selectedFiles) {
      if (!persistOverUpload) files = Array.from(selectedFiles);
      else
        files = files
          ? [...files, ...Array.from(selectedFiles)]
          : Array.from(selectedFiles);

      dispatch("fileSelect", {
        nativeEvent: event,
        files: Array.from(selectedFiles),
      });
    }
  }
</script>

<div
  class="drop-area"
  on:click={() => inputElement?.click()}
  on:keypress={() => inputElement?.click()}
  on:dragover|preventDefault={() => highlight(true)}
  on:dragleave={() => highlight(false)}
  on:dragend={() => highlight(false)}
  on:drop|preventDefault={(e) => {
    if (!disabled) handleFileDrop(e);
  }}
  on:mouseenter={() => highlight(true)}
  on:mouseleave={() => highlight(false)}
  style:height
  style:width
  style:background-color={backgroundColor}
  style:color={textColor}
  class:rounded
  class:disabled
  style:--file-input-focus-shadow={focusShadow}
>
  <slot name="body" active={dropAreaActive}>
    <span> Drop file here or click to upload </span>
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
    box-shadow: var(--file-input-focus-shadow);
  }
  .rounded {
    border-radius: 5px;
  }
</style>