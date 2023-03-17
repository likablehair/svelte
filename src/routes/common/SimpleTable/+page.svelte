<script lang="ts">
  import SimpleTable from "$lib/components/simple/common/SimpleTable.svelte";
  import type { Header } from "$lib/components/simple/common/SimpleTable.svelte";
  import Checkbox from "$lib/components/simple/forms/Checkbox.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";

  let headers: Header[] = [
    {
      value: "id",
      label: "ID",
      type: "number",
      width: "5%",
    },
    {
      value: "first_name",
      label: "NOME",
      type: "custom",
      width: "12%",
    },
    {
      value: "last_name",
      label: "COGNOME",
      type: "string",
      width: "12%",
    },
    {
      value: "email",
      label: "EMAIL",
      type: "string",
      width: "26%",
    },
    {
      value: "active",
      label: "ATTIVO",
      type: "custom",
      width: "10%",
    },
    {
      value: "create_at",
      label: "DATA CREAZIONE",
      type: "date",
      width: "20%",
    },
  ];

  let items = [
    {
      id: "1423",
      first_name: "Gabriele",
      last_name: "Garlaschelli",
      email: "gabriele.garlaschelli@likablehair.it",
      active: false,
      create_at: new Date(),
    },
    {
      id: "346512",
      first_name: "Emanuele",
      last_name: "Moia",
      email: "emanuele.moia@likablehair.it",
      active: true,
      create_at: new Date(),
    },
  ];
</script>

<div class="card-container">
  <SimpleTable width="80%" bind:headers bind:items>
    <span slot="customColumn" let:index={itemIndex} let:columnIndex>
      {#if columnIndex == 1}
        <a href=".">{items[itemIndex].first_name}</a>
      {:else}
        <Checkbox bind:value={items[itemIndex].active} />
      {/if}
    </span>
    <span slot="appendLastColumn" let:index={itemIndex}>
      <Button
        backgroundColor="rgba(32,112,9,0.3)"
        on:click={() => {
          alert(items[itemIndex].active);
        }}
      >
        Modifica {items[itemIndex].id}
      </Button>
    </span>
  </SimpleTable>
</div>

<style>
  .card-container {
    padding-top: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
</style>
