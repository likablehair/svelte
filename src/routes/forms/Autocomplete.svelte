<script lang="ts" context="module">
  import type { Item } from '$lib/forms/Autocomplete.svelte'
</script>
<script lang="ts">
  let value: Item[] = [],
    items: Item[] = [
      { value: 'apple', label: 'Mela' },
      { value: 'orange', label: 'Arancia' },
      { value: 'kiwi', label: 'Kiwi' },
      { value: 'banana', label: 'Banana' },
      { value: 'peach', label: 'Pesca' },
      { value: 'pear', label: 'Pera' },
      { value: 'cherry', label: 'Ciliegia' },
      { value: 'apricot', label: 'Albicocca' },
      { value: 'strawberry', label: 'Fragola' },
      { value: 'raspberry', label: 'Lampone' },
    ]

  import Autocomplete from '$lib/forms/Autocomplete.svelte';
</script>

<style>
  .card-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>

<div class="card-container">
  <Autocomplete
    bind:values={value}
    bind:items={items}
    maxWidth="300px"
    width="300px"
  ></Autocomplete>
  <div
    style:margin-top="30px"
  >
    {value.map((el) => el.label)}
  </div>

  <Autocomplete
    values={[
      items[0]
    ]}
    bind:items={items}
    maxWidth="300px"
    width="300px"
    disabled={true}
  ></Autocomplete>
</div>