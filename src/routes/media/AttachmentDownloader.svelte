<script lang="ts">
  import AttachmentDownloader from "$lib/media/AttachmentDownloader.svelte";
</script>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <AttachmentDownloader
    title="Documento da scaricare"
    description="Descrizione del documento da scaricare"
  ></AttachmentDownloader>
</div>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <AttachmentDownloader
    title="Il mio file"
    description="Size: 23Mb"
  ></AttachmentDownloader>
</div>


<div
  style:height="200px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <AttachmentDownloader
    width="200px"
    title="Il mio file con un titolo un po' più lungo"
    description="Size: 23Mb"
  ></AttachmentDownloader>
</div>