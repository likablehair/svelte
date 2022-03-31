<script lang="ts">
  import type { BreadcrumbItem } from "$lib/navigation/Breadcrumb.svelte";
  import Breadcrumb from "$lib/navigation/Breadcrumb.svelte";

  let items: BreadcrumbItem[] = [
    {
      name: "firstMenu",
      title: "Primo menu",
      url: "https://google.it",
    }, {
      name: "secondMenu",
      title: "Secondo menu",
      url: "https://google.it",
    }, {
      name: "secondMenu",
      title: "Secondo menu",
      url: "https://google.it",
    },
  ]
  let message = ""

  function handleBreacrumItem(event) {
    message = "Hai cliccato " + event.detail.item.name
  }
</script>


<div
  style:height="200px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Breadcrumb
    items={items}
    on:item-click={handleBreacrumItem}
  ></Breadcrumb>
  <div style:margin-top="15px">
    {message}
  </div>
</div>
<div
  style:height="200px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Breadcrumb
    items={items}
    on:item-click={handleBreacrumItem}
    underliner={false}
    spacing="90px"
    separatorIcon="mdi-arrow-right"
    separatorIconSize={13}
  ></Breadcrumb>
  <div style:margin-top="15px">
    {message}
  </div>
</div>