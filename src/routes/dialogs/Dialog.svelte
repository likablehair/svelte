<script lang="ts">
  let open = false, openSecond = false

  import Dialog from "$lib/dialogs/Dialog.svelte"
  import Button from "$lib/buttons/Button.svelte";
</script>

<div 
  style:margin-top="40px"
  style:width="100%"
  style:display="flex"
  style:justify-content="center"
>
  <Button
    backgroundColor="#bcd6e6"
    padding="10px"
    on:click={() => open = !open}
  >Toggle</Button>
</div>
<div
  style:height="200vh"
  style:margin-top="30px"
>
  <div style:height="150px" style:text-align="center">scrollable</div>
  <div style:height="150px" style:text-align="center">scrollable</div>
  <div style:height="150px" style:text-align="center">scrollable</div>
  <div style:height="150px" style:text-align="center">scrollable</div>
  <div style:height="150px" style:text-align="center">scrollable</div>
  <div style:height="150px" style:text-align="center">scrollable</div>
</div>

<Dialog
  bind:open={open}
>
  <div 
    style:width="300px"
    style:height="300px"
    style:background-color="#ecaceb"
    style:display="flex"
    style:align-items="center"
    style:justify-content="center"
    style:flex-direction="column"
  >
    <div>
      Sono un div per il dialog
    </div>
    <Button
      backgroundColor="#bcd6e6"
      padding="10px"
      on:click={() => open = false}
    >Chiudi</Button>
    <div 
      style:padding-left="10px"
      style:padding-right="10px"
      style:margin-top="10px"
    >
      <Button
        backgroundColor="#bcd6e6"
        padding="10px"
        on:click={() => openSecond = true}
      >Apri altro dialog</Button>
    </div>
  </div>
</Dialog>

<Dialog
  bind:open={openSecond}
  overlayOpacity="80%"
>
  <div 
    style:width="200px"
    style:height="200px"
    style:background-color="#ecaceb"
    style:display="flex"
    style:align-items="center"
    style:justify-content="center"
    style:flex-direction="column"
  >
    <div>Secondo dialogo</div>
  </div>

  <svelte:fragment slot="center-left">
    <Button
      type="icon"
      icon="mdi-chevron-left"
      iconSize={30}
      color="white"
    ></Button>
  </svelte:fragment>
  <svelte:fragment slot="center-right">
    <Button
      type="icon"
      icon="mdi-chevron-right"
      iconSize={30}
      color="white"
    ></Button>
  </svelte:fragment>
</Dialog>