<script lang="ts">
  import DescriptiveAvatar from "$lib/media/DescriptiveAvatar.svelte";
</script>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <DescriptiveAvatar
    src="http://localhost:4000/avatars/avatar1.jpeg"
    title="Avar titolo"
    description="Avatar sottotitolo corto"
  ></DescriptiveAvatar>
</div>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <DescriptiveAvatar
    src="http://localhost:4000/avatars/avatar1.jpeg"
    title="Avar titolo"
    description="Avatar sottotitolo corto"
    reverse="{true}"
  ></DescriptiveAvatar>
</div>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <DescriptiveAvatar
    src="http://localhost:4000/avatars/avatar1.jpeg"
    title="Avar titolo"
    description="Avatar sottotitolo corto"
    height="100px"
    width="100px"
  ></DescriptiveAvatar>
</div>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <DescriptiveAvatar
    src="http://localhost:4000/avatars/avatar1.jpeg"
    title="Avar titolo"
    description="Avatar sottotitolo corto"
    direction="column"
  ></DescriptiveAvatar>
</div>