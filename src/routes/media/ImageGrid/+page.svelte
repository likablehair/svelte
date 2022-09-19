<script lang="ts">
  let images = [
    {
      url: 'http://localhost:4000/guitars/guitar1.jpg',
      description: 'Some guitar',
      title: 'Some guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar2.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar3.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar4.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar5.jpg',
      description: 'Some guitar',
      title: 'Some guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar6.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar7.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    // repeat
    {
      url: 'http://localhost:4000/guitars/guitar1.jpg',
      description: 'Some guitar',
      title: 'Some guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar2.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar3.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar4.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar5.jpg',
      description: 'Some guitar',
      title: 'Some guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar6.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar7.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar1.jpg',
      description: 'Some guitar',
      title: 'Some guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar2.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar3.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar4.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar5.jpg',
      description: 'Some guitar',
      title: 'Some guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar6.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar7.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar1.jpg',
      description: 'Some guitar',
      title: 'Some guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar2.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar3.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar4.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar5.jpg',
      description: 'Some guitar',
      title: 'Some guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar6.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
    {
      url: 'http://localhost:4000/guitars/guitar7.jpg',
      description: 'Some othe guitar',
      title: 'Some othe guitar'
    },
  ]
  
  import ImageGrid from "$lib/media/ImageGrid.svelte";
</script>


<div class="image-grid-container">
  <ImageGrid 
    images={images} 
    imageMaxWidth="32vw" 
    imageMinWidth="32vw"
    imageHeight="400px"
  />
</div>

<style>
  .image-grid-container {
    padding: 15px;
  }
</style>


