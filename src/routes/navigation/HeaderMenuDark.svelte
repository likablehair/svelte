<script>
  import { goto } from '$app/navigation'
  import HeaderMenu from "$lib/navigation/HeaderMenu.svelte";
  import Button from '$lib/buttons/Button.svelte';

  function handleLighClick() {
    goto('/navigation/HeaderMenu')
  }
</script>

<HeaderMenu
  title="Titolo del sito"
  items={[
    {name: 'work', title: 'Work'},
    {name: 'history', title: 'History'},
  ]}
  --color="white"
  --background-color="black"
>
  <div slot="append">
    <Button 
      type="icon"
      icon="mdi-white-balance-sunny"
      --hover-background-color="#97979750"
      class="mr-2"
      on:click={handleLighClick}
    ></Button>
  </div>
</HeaderMenu>
<div style="height: 200vh; background-color: black; color: white">
  <h1>Primo titolo</h1>
  <p>Sint laborum non labore laboris eu cillum dolore nostrud occaecat amet. Id veniam ullamco est nostrud cillum sit est consectetur in sint aliquip velit veniam amet. Do velit ut nisi magna et eiusmod aliqua ex exercitation elit consequat ex. Excepteur eiusmod deserunt culpa ea cupidatat non qui nisi quis est exercitation ea. Reprehenderit est est duis ad tempor veniam consectetur excepteur officia amet duis aliqua ullamco. Reprehenderit culpa laborum culpa ipsum dolor est consequat tempor excepteur irure veniam consequat exercitation aliquip.</p>
  <h1>Secondo titolo</h1>
  <p>Sint laborum non labore laboris eu cillum dolore nostrud occaecat amet. Id veniam ullamco est nostrud cillum sit est consectetur in sint aliquip velit veniam amet. Do velit ut nisi magna et eiusmod aliqua ex exercitation elit consequat ex. Excepteur eiusmod deserunt culpa ea cupidatat non qui nisi quis est exercitation ea. Reprehenderit est est duis ad tempor veniam consectetur excepteur officia amet duis aliqua ullamco. Reprehenderit culpa laborum culpa ipsum dolor est consequat tempor excepteur irure veniam consequat exercitation aliquip.</p>
  <h1>Terzo titolo</h1>
  <p>Sint laborum non labore laboris eu cillum dolore nostrud occaecat amet. Id veniam ullamco est nostrud cillum sit est consectetur in sint aliquip velit veniam amet. Do velit ut nisi magna et eiusmod aliqua ex exercitation elit consequat ex. Excepteur eiusmod deserunt culpa ea cupidatat non qui nisi quis est exercitation ea. Reprehenderit est est duis ad tempor veniam consectetur excepteur officia amet duis aliqua ullamco. Reprehenderit culpa laborum culpa ipsum dolor est consequat tempor excepteur irure veniam consequat exercitation aliquip.</p>
</div>