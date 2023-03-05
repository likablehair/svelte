<script lang="ts">
  let images = [
    {
      url: "http://localhost:4000/guitars/guitar1.jpg",
      description: "Some guitar",
      title: "Some guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar2.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar3.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
  ];

  import Carousel from "$lib/media/Carousel.svelte";
</script>

<Carousel {images} height="500px" width="1000px" max-width="100vw" />
