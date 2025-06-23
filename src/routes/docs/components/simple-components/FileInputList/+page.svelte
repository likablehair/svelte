<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import FileInputList from "$lib/components/simple/forms/FileInputList.svelte";
</script>

<h1>FileInputList</h1>
<ComponentSubtitle>Drop it like it's hot (the list).</ComponentSubtitle>
<h2>Example with standard input</h2>
<div class="example">
  <FileInputList
    --file-input-list-height="100%"
    --file-input-list-width="100%"
    --file-input-list-border-radius="10px"
  />
</div>

<h2>Example with preview input</h2>
<div class="example">
  <FileInputList
    previewFiles={true}
    --file-input-list-height="100%"
    --file-input-list-width="100%"
    --file-input-list-border-radius="10px"
  />
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "files", type: "File[]", description: "List of selected files", default: "[]" },
    { name: "persistOverUpload", type: "boolean", description: "Whether to keep previous files when adding new ones", default: "true" },
    { name: "dropAreaActive", type: "boolean", description: "Whether the drop area is active", default: "true" },
    { name: "icon", type: "string", description: "Icon for file representation", default: "'mdi-file-document'" },
    { name: "message", type: "string", description: "Message displayed when no files are selected", default: "'Drop file here or click to upload'" },
    { name: "disabled", type: "boolean", description: "Whether the file input is disabled", default: "false" },
    { name: "maxFiles", type: "number", description: "Maximum number of files allowed", default: "undefined" },
    { name: "class", type: "string", description: "Additional CSS classes", default: "''" },
    { name: "previewFiles", type: "boolean", description: "When true, image files are displayed as a preview. Non-image files will show the document title and icon.", default: "false" }
  ]}
  styleProps={[
    { name: "--file-input-list-height", type: "size", description: "Height of the file input list", default: "64px" },
    { name: "--file-input-list-background-color", type: "color", description: "Background color of the file input list", default: "rgb(var(--global-color-background-300))" },
    { name: "--file-input-list-color", type: "color", description: "Text color of the file input list", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--file-input-list-selected-row-color", type: "color", description: "Text color of the selected file row", default: "rgb(var(--global-color-contrast-1000))" },
    { name: "--file-input-list-selected-row-background", type: "color", description: "Background color of the selected file row", default: "rgb(var(--global-color-background-500))" },
    { name: "--file-input-list-hover-color", type: "color", description: "Text color when hovering over the file input list", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--file-input-list-border-color", type: "color", description: "Border color of the file input list", default: "rgb(var(--global-color-primary-100))" },
    { name: "--file-input-list-border-radius", type: "size", description: "Border radius of the file input list", default: "5px" }
  ]}
/>

<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "bodySnippet", default: `
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
    `, description: "Custom content inside the file input area", properties: [{ name: "active", type: "boolean", description: "Whether the drop area is active" }] },
    { name: "messageSnippet", default: "<span>{message}</span>", description: "Custom message when no files are selected", properties: [{ name: "message", type: "string | undefined", description: "The message to display" }] },
    { name: "fileListSnippet", default: `
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
    `, description: "Custom file list display", properties: [{ name: "files", type: "File[]", description: "List of selected files" }] }
  ]}
/>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onchange", description: "Triggered when the file selection changes" },
    { name: "onfileChange", description: "Triggered when files are added or removed", properties: [{ name: "files", type: "File[]", description: "Updated list of files" }] },
    { name: "onfileDrop", description: "Triggered when files are dropped" },
    { name: "onfileSelect", description: "Triggered when files are selected via input" }
  ]}
/>

<style>
  .example {
    height: 200px;
    width: 100%;
  }
</style>
