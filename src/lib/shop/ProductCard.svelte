<script lang="ts">
  export let image: string = '',
    title: string = '',
    sale: boolean = false,
    saleText: string = 'SALE',
    price: number = undefined,
    currency: string = '€',
    discount: number = undefined,
    maxWidth: string = undefined,
    maxHeight: string = undefined,
    minWidth: string = undefined,
    minHeight: string = undefined,
    width: string = undefined,
    height: string = undefined

  $: priceLessDiscount = Number((price - discount).toFixed(2))

  import Image from '$lib/media/Image.svelte';
</script>

<style>
  .shadow-lg {
    --shadow-color: #000;
    --ring-inset: inset;
    --ring-offset-width: 0px;
    --ring-color: rgb(255 255 255/0.1);
    --ring-offset-shadow: var(--ring-inset) 0 0 0 calc(1px + var(--ring-offset-width)) var(--ring-color);
    --ring-shadow: 0 0 #0000;
    --shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-colored: 0 10px 15px -3px var(--shadow-color), 0 4px 6px -4px var(--shadow-color);
    box-shadow: var(--ring-offset-shadow, 0 0 #0000), var(--ring-shadow, 0 0 #0000), var(--shadow);
  }

  .info {
    height: var(--info-height, 100px);
  }
</style>

<div 
  style:width={width}
  style:height={height}
  style:max-width={maxWidth}
  style:max-height={maxHeight}
  style:min-width={minWidth}
  style:min-height={minHeight}
  style:border-radius="0.375rem"
  class="container shadow-lg"
>
  <Image
    src={image}
    width="100%"
    height="calc(100% - var(--info-height, 100px))"
    disableHover={true}
    --border-radius="10px 10px 0px 0px"
  >
    {#if sale}
      <div 
        style:font-weight="600"
        style:font-size="14px"
        style:line-height="20px"
        style:color="rgb(250 250 249)"
        style:background-color="rgb(239 68 68)"
        style:border-radius="0.375rem"
        style:top="8px"
        style:right="8px"
        style:width="fit-content"
        style:position="absolute"
        style:padding-left="8px"
        style:padding-right="8px"
      >{saleText}</div>
    {/if}
  </Image>
  <div 
    style:padding="8px"
    style:position="relative"
    class="info"
  >
    <div style:font-weight="600" >{title}</div>
    {#if (price !== undefined && price !== null) || (discount !== undefined && discount !== null)}
      <div 
        style:position="absolute"
        style:bottom="19px"
        style:right="8px"
      >
        {#if discount !== undefined && discount !== null }
          <span 
            style:text-decoration-line="line-through"
            style:font-size=""
            style:letter-spacing="0.025em"
            style:font-weight="400px"
            style:color="rgb(156 163 175)"
          >
            {priceLessDiscount} {currency}
          </span>
        {/if}

        {#if price !== undefined && price !== null }
          <span 
            style:letter-spacing="0.025em"
            style:font-size="18px"
            style:line-height="28px"
            style:font-weight="600"
          >
            {price} {currency}
          </span>
        {/if}
      </div>
    {/if}
    <div 
      style:position="absolute"
      style:bottom="19px"
      style:left="8px"
    >
      <slot name="sizes">

      </slot>
    </div>
  </div>
</div>

