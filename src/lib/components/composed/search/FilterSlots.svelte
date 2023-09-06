<script lang="ts" context="module">
  export type FilterSlots = {};
</script>

<script lang="ts">
  import Chip from "$lib/components/simple/navigation/Chip.svelte";

  export let filterSlots: { label: string }[] = [{ label: "pippo" }];


  function handleRemoveFilter (){
    filterSlots.pop()    
    filterSlots = filterSlots
  }
</script>

<div class="filter-slots-container">
  {#each filterSlots as slot}
    <div class="filter-slot">
      <Chip label close on:close={handleRemoveFilter}><b>{slot.label}</b> uguale a <b>ciao</b> </Chip>
    </div>
  {/each}
</div>

<style>
  .filter-slots-container {
    display: flex;
    align-items: flex-start;
    column-gap: 10px;
  }

  .filter-slot {
    font-size: 0.70rem;
    font-weight: 0;
  }
</style>
