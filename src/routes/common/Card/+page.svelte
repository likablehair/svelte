<script>
  import Card from "$lib/common/Card.svelte";
</script>

<div class="card-container">
  <Card padding="10px" height="200px" backgroundColor="green" color="white">
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
    <div>Really can't</div>
    <div>Really can't</div>
    <div>Really can't</div>
    <div>Really can't</div>
    <div>Really can't</div>
    <div>Really can't</div>
    <svelte:fragment slot="footer">In the footer</svelte:fragment>
  </Card>
</div>

<style>
  .card-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
  }
</style>
