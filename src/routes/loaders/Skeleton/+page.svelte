<script lang="ts">
  import Skeleton from "$lib/loaders/Skeleton.svelte";
</script>

<div
  style:background-color="#a1a1a1"
  style:padding="20px"
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Skeleton
    sections={[
      {
        type: "image",
        height: `100%`,
      },
    ]}
    padding="0px"
    width="50%"
    height="100%"
  />
</div>

<div
  style:padding="20px"
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Skeleton
    sections={[
      {
        type: "image",
        height: `100%`,
      },
    ]}
    padding="0px"
    width="50%"
    height="100%"
    dark={true}
  />
</div>

<div
  style:background-color="#a1a1a1"
  style:padding="20px"
  style:height="200px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Skeleton
    sections={[
      {
        type: "image",
        height: `20px`,
      },
      {
        type: "image",
        height: `40px`,
      },
    ]}
    padding="10px"
    width="50%"
    height="90px"
  />
</div>
