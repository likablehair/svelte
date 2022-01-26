<script>
  import ProductCard from "$lib/shop/ProductCard.svelte";
  import '$lib/common/tailwind.css';
</script>

<div class="flex justify-center items-center h-screen">
  <ProductCard
    --height="400px"
    --width="300px"
    --max-width="90vw"
    sale={true}
    image="http://localhost:4000/guitars/guitar6.jpg"
    title="Chitarra acustica per suonatori"
    price={699.99}
    discount={200}
  ></ProductCard>
</div>