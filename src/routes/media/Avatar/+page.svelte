<script lang="ts">
  import Avatar from "$lib/media/Avatar.svelte";
</script>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Avatar
    src="http://localhost:4000/avatars/avatar1.jpeg"
  ></Avatar>
</div>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Avatar
    width="80px"
    height="80px"
    src="http://localhost:4000/avatars/avatar1.jpeg"
  ></Avatar>
</div>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Avatar
    width="70px"
    height="70px"
    borderRadius="30%"
    src="http://localhost:4000/avatars/avatar1.jpeg"
  ></Avatar>
</div>
<div
  style="height: 130vh;"
></div>
<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <div>lazy-loaded</div>
  <Avatar
    width="70px"
    height="70px"
    borderRadius="30%"
    src="http://localhost:4000/avatars/avatar2.jpeg"
  ></Avatar>
</div>