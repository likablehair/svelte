<script lang="ts">
  type Product = {
    image: string,
    title: string,
    sale?: boolean,
    saleText?: string,
    price?: number,
    currency?: string,
    discount?: number
  }

  export let products: Product[] = [],
    productMaxWidth: string = '90vw',
    productMinWidth: string = '200px',
    productMaxHeight: string = '90vh',
    productMinHeight: string = '300px',
    productHeight: string = '300px',
    productWidth: string = '200px',
    width: string = '100%',
    gap: string = '1rem'

  import ProductCard from './ProductCard.svelte'
</script>

<div 
  style:width={width}
  style:gap={gap}
  style:grid-template-columns={`repeat(auto-fit, minmax(${productMinWidth || productWidth || '200px'}, ${productWidth}))`}
  class="product-grid-container"
>
  {#each products as product }
    <div class="product-container">
      <ProductCard
        height={productHeight}
        width={productWidth}
        max-width={productMaxWidth}
        min-width={productMinWidth}
        max-height={productMaxHeight}
        min-height={productMinHeight}
        image={product.image}
        title={product.title}
        sale={product.sale}
        saleText={product.saleText}
        price={product.price}
        currency={product.currency}
        discount={product.discount}
      >
        <svelte:fragment slot="sizes">
          <slot name="sizes" {product} ></slot>
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