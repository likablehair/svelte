<script lang="ts">
  type Product = {
    image: string;
    title: string;
    sale?: boolean;
    saleText?: string;
    price?: number;
    currency?: string;
    discount?: number;
  };

  export let products: Product[] = [],
    productMaxWidth = "90vw",
    productMinWidth = "200px",
    productMaxHeight = "90vh",
    productMinHeight = "300px",
    productHeight = "300px",
    productWidth = "200px",
    width = "100%",
    gap = "1rem";

  import ProductCard from "./ProductCard.svelte";
</script>

<div
  style:width
  style:gap
  style:grid-template-columns={`repeat(auto-fit, minmax(${
    productMinWidth || productWidth || "200px"
  }, ${productWidth}))`}
  class="product-grid-container"
>
  {#each products as product}
    <div class="product-container">
      <ProductCard
        height={productHeight}
        width={productWidth}
        maxWidth={productMaxWidth}
        minWidth={productMinWidth}
        maxHeight={productMaxHeight}
        minHeight={productMinHeight}
        image={product.image}
        title={product.title}
        sale={product.sale}
        saleText={product.saleText}
        price={product.price}
        currency={product.currency}
        discount={product.discount}
      >
        <svelte:fragment slot="sizes">
          <slot name="sizes" {product} />
        </svelte:fragment>
      </ProductCard>
    </div>
  {/each}
</div>

<style>
  .product-grid-container {
    display: grid;
    align-content: space-between;
  }

  .product-container {
    width: fit-content;
  }

  @media only screen and (max-width: 768px) {
    .product-grid-container {
      justify-content: space-around;
    }
  }
</style>
