<script lang="ts">
  import { goto } from "$app/navigation";
  import HeaderMenu from "$lib/navigation/HeaderMenu.svelte";
  import Button from "$lib/buttons/Button.svelte";

  function handleLighClick() {
    goto("/navigation/HeaderMenuDark");
  }

  function handleNavigationClick(element) {
    if (element.detail.item.name == "trasparent")
      goto("/navigation/HeaderMenuTransparent");
  }
</script>

<HeaderMenu
  title="Titolo del sito"
  items={[
    { name: "work", title: "Work" },
    { name: "history", title: "History" },
    { name: "trasparent", title: "Transparent" },
  ]}
  on:item-click={handleNavigationClick}
>
  <div slot="append">
    <div style:margin-right="5px">
      <Button
        type="icon"
        icon="mdi-weather-night"
        hoverBackgroundColor="#97979750"
        on:click={handleLighClick}
      />
    </div>
  </div>
</HeaderMenu>
<div style="height: 200vh;">
  <p>
    Sint laborum non labore laboris eu cillum dolore nostrud occaecat amet. Id
    veniam ullamco est nostrud cillum sit est consectetur in sint aliquip velit
    veniam amet. Do velit ut nisi magna et eiusmod aliqua ex exercitation elit
    consequat ex. Excepteur eiusmod deserunt culpa ea cupidatat non qui nisi
    quis est exercitation ea. Reprehenderit est est duis ad tempor veniam
    consectetur excepteur officia amet duis aliqua ullamco. Reprehenderit culpa
    laborum culpa ipsum dolor est consequat tempor excepteur irure veniam
    consequat exercitation aliquip.
  </p>
  <h1>Secondo titolo</h1>
  <p>
    Sint laborum non labore laboris eu cillum dolore nostrud occaecat amet. Id
    veniam ullamco est nostrud cillum sit est consectetur in sint aliquip velit
    veniam amet. Do velit ut nisi magna et eiusmod aliqua ex exercitation elit
    consequat ex. Excepteur eiusmod deserunt culpa ea cupidatat non qui nisi
    quis est exercitation ea. Reprehenderit est est duis ad tempor veniam
    consectetur excepteur officia amet duis aliqua ullamco. Reprehenderit culpa
    laborum culpa ipsum dolor est consequat tempor excepteur irure veniam
    consequat exercitation aliquip.
  </p>
  <h1>Terzo titolo</h1>
  <p>
    Sint laborum non labore laboris eu cillum dolore nostrud occaecat amet. Id
    veniam ullamco est nostrud cillum sit est consectetur in sint aliquip velit
    veniam amet. Do velit ut nisi magna et eiusmod aliqua ex exercitation elit
    consequat ex. Excepteur eiusmod deserunt culpa ea cupidatat non qui nisi
    quis est exercitation ea. Reprehenderit est est duis ad tempor veniam
    consectetur excepteur officia amet duis aliqua ullamco. Reprehenderit culpa
    laborum culpa ipsum dolor est consequat tempor excepteur irure veniam
    consequat exercitation aliquip.
  </p>
</div>
