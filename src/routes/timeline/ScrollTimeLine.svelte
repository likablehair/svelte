<script lang="ts">

  import ScrollTimeLine from "$lib/timeline/ScrollTimeLine.svelte";
  import '$lib/common/tailwind.css';
</script>

<div class="w-screen h-screen flex justify-center items-center">
  <ScrollTimeLine
    --height="300px"
    --width="800px"
    --max-width="100vw"
    --max-height="100vh"
  ></ScrollTimeLine>
</div>