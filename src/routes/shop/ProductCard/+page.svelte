<script>
  import ProductCard from "$lib/shop/ProductCard.svelte";
</script>

<div
  style:height="100vh"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:flex-direction="column"
>
  <ProductCard
    height="400px"
    width="300px"
    maxWidth="90vw"
    sale={true}
    image="http://localhost:4000/guitars/guitar6.jpg"
    title="Chitarra acustica per suonatori"
    price={699.99}
    discount={200}
  />
</div>
