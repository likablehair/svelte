<script lang="ts">
  let open: boolean = false

  let position: 'left' | 'right' | 'bottom' | 'top' = 'left'
  function openDrawer(p: 'left' | 'right' | 'bottom' | 'top') {
    position = p
    open = !open
  }

  import Drawer from '$lib/navigation/Drawer.svelte'
  import Button from '$lib/buttons/Button.svelte'
</script>

<Drawer
  position={position}
  bind:open={open}
  backgroundColor="#B1D4E0"
  items={[
      { name: 'menu', title: 'Menù'},
      { name: 'restaurant', title: 'Ristorante'},
      { name: 'contacts', title: 'Contatti'},
      { name: 'about', title: 'Informazioni'},
    ]}
></Drawer>
<div
  style:margin-top="40px"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <Button 
    on:click={() => openDrawer('left')}
    type="text"
    padding="10px"
  >Apri a destra</Button>
  <Button 
    on:click={() => openDrawer('right')}
    type="text"
    padding="10px"
  >Apri a sinistra</Button>
  <Button 
    on:click={() => openDrawer('bottom')}
    type="text"
    padding="10px"
  >Apri sotto</Button>
  <div style="margin-top: 100px">
    <Button 
      on:click={() => openDrawer('top')}
      type="text"
      padding="10px"
    >Apri sopra</Button>
  </div>
</div>