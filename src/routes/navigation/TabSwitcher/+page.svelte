<script lang="ts">
  let selected: string;

  import TabSwitcher from "$lib/navigation/TabSwitcher.svelte";
</script>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <TabSwitcher
    tabs={[
      { name: "pippo", label: "Pippo" },
      { name: "pluto", label: "Pluto" },
      { name: "gianniPinotto", label: "Gianni pinotto e pinco pallo" },
    ]}
    width="90vw"
    color="#008080"
    bind:selected
  />
  <div style:margin-top="20px">
    {selected}
  </div>
</div>
