<script lang="ts">
  export let image: string = '',
    title: string = '',
    sale: boolean = false,
    saleText: string = 'SALE',
    price: number = undefined,
    currency: string = '€',
    discount: number = undefined

  $: priceLessDiscount = Number((price - discount).toFixed(2))

  import Image from '$lib/media/Image.svelte';
  import '$lib/common/tailwind.css';
</script>

<style>
  .container {
    height: var(--height);
    width: var(--width);
    max-height: var(--max-height);
    max-width: var(--max-width);
    min-height: var(--min-height);
    min-width: var(--min-width);
  }

  .info {
    height: var(--info-height, 100px);
  }
</style>

<div class="container rounded-md shadow-lg">
  <Image
    src={image}
    width="100%"
    height="calc(100% - var(--info-height, 100px))"
    disableHover={true}
    --border-radius="10px 10px 0px 0px"
  >
    {#if sale}
      <div class="font-semibold text-sm text-stone-50 bg-red-500 rounded-md top-2 right-2 w-fit absolute px-2">{saleText}</div>
    {/if}
  </Image>
  <div class="info p-2 relative ">
    <div class="font-semibold">{title}</div>
    {#if (price !== undefined && price !== null) || (discount !== undefined && discount !== null)}
      <div class="absolute bottom-2 right-2">
        {#if discount !== undefined && discount !== null }
          <span class="line-through text-md tracking-wide font-normal text-gray-400">
            {priceLessDiscount} {currency}
          </span>
        {/if}

        {#if price !== undefined && price !== null }
          <span class="text-lg tracking-wide font-semibold">
            {price} {currency}
          </span>
        {/if}
      </div>
    {/if}
    <div class="absolute bottom-2 left-2">
      <slot name="sizes">

      </slot>
    </div>
  </div>
</div>

