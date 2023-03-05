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
    {
      url: "http://localhost:4000/guitars/guitar4.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar5.jpg",
      description: "Some guitar",
      title: "Some guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar6.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar7.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
    // repeat
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
    {
      url: "http://localhost:4000/guitars/guitar4.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar5.jpg",
      description: "Some guitar",
      title: "Some guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar6.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar7.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
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
    {
      url: "http://localhost:4000/guitars/guitar4.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar5.jpg",
      description: "Some guitar",
      title: "Some guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar6.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar7.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
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
    {
      url: "http://localhost:4000/guitars/guitar4.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar5.jpg",
      description: "Some guitar",
      title: "Some guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar6.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
    {
      url: "http://localhost:4000/guitars/guitar7.jpg",
      description: "Some othe guitar",
      title: "Some othe guitar",
    },
  ];

  import Gallery from "$lib/media/Gallery.svelte";
</script>

<Gallery
  {images}
  imageMaxWidth="32vw"
  imageMinWidth="32vw"
  imageHeight="400px"
/>
