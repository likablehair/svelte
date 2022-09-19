<script>
  import ProductsGrid from "$lib/shop/ProductsGrid.svelte";
</script>

<div style:padding="20px" >
  <ProductsGrid
    width="90vw"
    productMinWidth="200px"
    productMinHeight="200px"
    productHeight="400px"
    productWidth="300px"
    products={[
      {
        image: "http://localhost:4000/guitars/guitar6.jpg",
        title: "Chitarra acustica per suonatori",
        price: 999
      },
      {
        image: "http://localhost:4000/guitars/guitar5.jpg",
        title: "Chitarra elettrica per suonatori",
        price: 649
      },
      {
        image: "http://localhost:4000/guitars/guitar3.jpg",
        title: "Chitarra elettrica simil tele (o forse vera)",
        price: 1205,
        sale: true,
        discount: 44
      },
      {
        image: "http://localhost:4000/guitars/guitar1.jpg",
        title: "La chitarra perfetta per i suonatori",
        price: 1555
      }
    ]}
  ></ProductsGrid>
</div>