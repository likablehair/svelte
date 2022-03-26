<script context="module" lang="ts">
  export type TimeLineItem = {
    
  }
</script>

<script lang="ts">
  export let items: TimeLineItem[] = []
</script>

<div class="container">
  {#each items as item }
    <div class="time-line-item">
      <div></div>
    </div>
  {/each}
</div>

<style>
  .container {
    height: var(--height);
    width: var(--width);
  }

  .time-line-item {
    display: flex;
  }
</style>