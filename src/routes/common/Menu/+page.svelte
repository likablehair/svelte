<script lang="ts">
  import Menu from "$lib/common/Menu.svelte";
  import Button from "$lib/buttons/Button.svelte";

  let menuTop: number,
    menuLeft: number,
    open = false;
  function handleClick(e: MouseEvent) {
    open = true;

    menuTop = e.pageY;
    menuLeft = e.pageX;
  }

  function handleKeypress() {}

  let homeButton1: HTMLElement,
    openByHomeButton1 = false,
    homeButton2: HTMLElement,
    openByHomeButton2 = false;
</script>

<div
  style:height="200px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
>
  <div bind:this={homeButton1}>
    <Button
      type="icon"
      icon="mdi-home"
      on:click={() => (openByHomeButton1 = !openByHomeButton1)}
    />
  </div>
</div>

<Menu
  activator={homeButton1}
  width="200px"
  height="auto"
  bind:open={openByHomeButton1}
>
  <div
    style:border="1px solid black"
    style:background-color="white"
    style:box-shadow="rgba(149, 157, 165, 0.2) 0px 8px 24px"
    style:border-radius="5px"
    style:padding="10px"
  >
    Io sono attivato dal bottone.
  </div>
</Menu>

<Menu top={menuTop} left={menuLeft} width="200px" height="auto" bind:open>
  <div
    style:border="1px solid black"
    style:background-color="white"
    style:box-shadow="rgba(149, 157, 165, 0.2) 0px 8px 24px"
    style:border-radius="5px"
    style:padding="10px"
  >
    ciao ciao
  </div>
</Menu>

<div
  style:display="flex"
  style:align-items="center"
  style:flex-direction="column"
  style:width="150vw"
  on:click={handleClick}
  on:keypress={handleKeypress}
>
  {#each [...Array(15).keys()] as index}
    <div style:margin-top="30px" style:margin-bottom="30px">
      Clicca da qualsiasi parte per aprire un menù
    </div>
  {/each}
</div>

<div
  style:height="200px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
>
  <div bind:this={homeButton2}>
    <Button
      type="icon"
      icon="mdi-home"
      on:click={() => (openByHomeButton2 = !openByHomeButton2)}
    />
  </div>
</div>

<Menu
  activator={homeButton2}
  width="200px"
  height="auto"
  bind:open={openByHomeButton2}
  anchor="bottom-center"
  closeOnClickOutside
>
  <div
    style:border="1px solid black"
    style:background-color="white"
    style:box-shadow="rgba(149, 157, 165, 0.2) 0px 8px 24px"
    style:border-radius="5px"
    style:padding="10px"
  >
    Io sono di nuovo attivato dal bottone.
    <input type="text" />
    <Button type="text">Un bottone casuale</Button>
  </div>
</Menu>
