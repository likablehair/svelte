<script lang="ts">
  import Navigator from "$lib/navigation/Navigator.svelte";
</script>

<div
  style:height="100px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Navigator
    items={[
      { name: "menu", title: "Menù" },
      { name: "restaurant", title: "Ristorante" },
      { name: "contacts", title: "Contatti" },
      { name: "about", title: "Informazioni" },
    ]}
  />
</div>

<div
  style:height="200px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Navigator
    vertical={true}
    items={[
      { name: "menu", title: "Menù" },
      { name: "restaurant", title: "Ristorante" },
      { name: "contacts", title: "Contatti" },
      { name: "about", title: "Informazioni" },
    ]}
  />
</div>
