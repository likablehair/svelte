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
    productWidth: string = '200px'

  $: cssVariables = Object.entries({
      '--min-width': productMinWidth || productWidth || '200px',
      '--product-width': productWidth || '200px'
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');

  import ProductCard from './ProductCard.svelte'
</script>

<div 
  class="product-grid-container"
  style={cssVariables}
>
  {#each products as product }
    <div class="product-container">
      <ProductCard
        --height={productHeight}
        --width={productWidth}
        --max-width={productMaxWidth}
        --min-width={productMinWidth}
        --max-height={productMaxHeight}
        --min-height={productMinHeight}
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
    width: var(--width, 100%);
    display: grid;
    gap: var(--gap, 1rem);
    align-content: space-between;
    grid-template-columns: repeat(auto-fit, minmax(var(--min-width), var(--product-width)));
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