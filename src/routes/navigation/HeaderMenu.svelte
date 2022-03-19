<script>
  import HeaderMenu from "$lib/navigation/HeaderMenu.svelte";
  import Icon from '$lib/media/Icon.svelte';
</script>

<HeaderMenu
  title="Titolo del sito"
  items={[
    {name: 'work', title: 'Work'}
  ]}
>
  <div slot="append">
    
  </div>
</HeaderMenu>
<div style="height: 200vh;">
</div>