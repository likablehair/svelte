<script lang="ts">
  import LinkButton from "$lib/components/simple/buttons/LinkButton.svelte";

  export let previousText: string | undefined = undefined,
    previousUrl: string | undefined = undefined,
    nextText: string | undefined = undefined,
    nextUrl: string | undefined = undefined
  
  $: justifyContent = !!nextUrl && !!previousUrl ? 'space-between' : !!nextUrl && !previousUrl ? 'flex-end' : 'flex-start'
</script>

<div 
  class="final-button-container"
  style:--final-button-justify-content={justifyContent}
>
  {#if !!previousUrl}
    <div>
      <LinkButton
        href={previousUrl}
        prependIcon="mdi-arrow-left"
        iconSize={14}
      >Previous</LinkButton>
      <div class="link-title">{previousText}</div>
    </div>
  {/if}
  {#if nextUrl}  
    <div>
      <LinkButton
        href={nextUrl}
        appendIcon="mdi-arrow-right"
        iconSize={14}
      >Next</LinkButton>
      <div class="link-title">{nextText}</div>
    </div>
  {/if}
</div>

<style>
  .final-button-container {
    display: flex;
    align-items: center;
    justify-content: var(--final-button-justify-content);
    height: 200px;
  }

  .link-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 1rem;
  }
</style>