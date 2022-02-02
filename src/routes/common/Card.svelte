<script>
  import Card from '$lib/common/Card.svelte';
  import { Elevation } from '$lib/enums/index';
</script>

<style>
  .card-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
  }
</style>

<div class="card-container">
  <Card 
    --padding="10px"
    --height="200px"
    --background-color="green"
    --color="white"
    elevation={Elevation.xl}
  >
    <svelte:fragment slot="header">In the header</svelte:fragment>
    <div>Hey I'm in a card</div>
    <div>It's a long story</div>
    <div>I haven't been able to tell anyone</div>
    <div>How will my face be</div>
    <div>Like entire journey</div>
    <div>There's no money</div>
    <div>Can get through</div>
    <div>Really can't</div>
    <div>Really can't</div>
    <svelte:fragment slot="footer">In the footer</svelte:fragment>
  </Card>
</div>