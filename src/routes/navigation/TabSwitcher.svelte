<script lang="ts">
  let selected: string

  import TabSwitcher from "$lib/navigation/TabSwitcher.svelte";
</script>

<div class="flex flex-col justify-center items-center h-screen w-screen">
  <TabSwitcher
    tabs={[
      {name: 'pippo', label: 'Pippo'},
      {name: 'pluto', label: 'Pluto'},
      {name: 'gianniPinotto', label: 'Gianni pinotto e pinco pallo'},
    ]}
    --width="90vw"
    --color="#008080"
    bind:selected={selected}
  ></TabSwitcher>
  <div class="mt-6">
    {selected}
  </div>
</div>