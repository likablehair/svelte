<script lang="ts">
  let images = [
    {
      url: '/guitars/guitar1.jpg',
      description: 'Some guitar'
    },
    {
      url: '/guitars/guitar2.jpg',
      description: 'Some othe guitar'
    },
    {
      url: '/guitars/guitar3.jpg',
      description: 'Some othe guitar'
    },
    {
      url: '/guitars/guitar4.jpg',
      description: 'Some othe guitar'
    }
  ]

  import ImageGrid from "$lib/ImageGrid/ImageGrid.svelte";
</script>

<h1>Image grid</h1>

<div class="image-grid-container">
  <ImageGrid 
    images={images} 
    imageMaxWidth="300px" 
    imageMinWidth="300px"
    imageMaxHeight="300px" 
    imageMinHeight="300px"
  />
</div>
