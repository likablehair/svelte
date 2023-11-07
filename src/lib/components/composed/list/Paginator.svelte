<script lang="ts">
	import '../../../css/main.css'
  import './Paginator.css'

  import Button from "$lib/components/simple/buttons/Button.svelte";

  import { createEventDispatcher } from "svelte";
  let dispatch = createEventDispatcher<{
    'change': {
      page: number
    }
  }>()

  export let page: number = 1,
    maxPage: number | undefined = undefined

  function goToPage(p: number) {
    if(p <= 0 || (!!maxPage && p > maxPage)) return
    page = p
    emitChange()
  }

  function previousPage() {
    if(page == 1) return
    page -= 1
    emitChange()
  }

  function hardPrevious() {
    page = 1
    emitChange()
  }

  function nextPage() {
    if(!!maxPage && page >= maxPage) return
    page += 1
    emitChange()
  }

  function hardNext() {
    if(!maxPage) return
    page = maxPage
    emitChange()
  }

  function emitChange() {
    dispatch('change', {
      page
    })
  }

  $: if(!!maxPage && page > maxPage) page = maxPage
</script>

<div class="paginator-container">
  <Button
    icon="mdi-chevron-double-left"
    on:click={hardPrevious}
    --button-default-background-color="transparent"
    --button-default-focus-background-color="rgb(var(--global-color-primary-500), .3)"
    --button-default-focus-color="rgb(var(--global-color-contrast-900))"
    --button-default-hover-background-color="rgb(var(--global-color-primary-500))"
    --button-default-box-shadow="none"
    --button-default-color="rgb(var(--global-color-contrast-900))"
  ></Button>
  <Button
    icon="mdi-chevron-left"
    on:click={previousPage}
    --button-default-background-color="transparent"
    --button-default-focus-background-color="rgb(var(--global-color-primary-500), .3)"
    --button-default-focus-color="rgb(var(--global-color-contrast-900))"
    --button-default-hover-background-color="rgb(var(--global-color-primary-500))"
    --button-default-box-shadow="none"
    --button-default-color="rgb(var(--global-color-contrast-900))"
  ></Button>
  {#if page != 1}
    <Button
      on:click={() => goToPage(page - 1)}
      --button-default-background-color="transparent"
      --button-default-focus-background-color="rgb(var(--global-color-primary-500), .3)"
      --button-default-focus-color="rgb(var(--global-color-contrast-900))"
      --button-default-hover-background-color="rgb(var(--global-color-primary-500))"
      --button-default-box-shadow="none"
      --button-default-color="rgb(var(--global-color-contrast-900))"
      --button-default-padding=".5rem .8rem"
    >{page - 1}</Button>
  {/if}
  <div 
    class="page-button" 
    class:selected={true}
  >
    {page}
  </div>
  {#if !maxPage || (!!maxPage && page < maxPage)}
    <Button
      on:click={() => goToPage(page + 1)}
      --button-default-background-color="transparent"
      --button-default-focus-background-color="rgb(var(--global-color-primary-500), .3)"
      --button-default-focus-color="rgb(var(--global-color-contrast-900))"
      --button-default-hover-background-color="rgb(var(--global-color-primary-500))"
      --button-default-box-shadow="none"
      --button-default-color="rgb(var(--global-color-contrast-900))"
      --button-default-padding=".5rem .8rem"
    >{page + 1}</Button>
  {/if}
  <Button
    on:click={nextPage}
    icon="mdi-chevron-right"
    --button-default-background-color="transparent"
    --button-default-focus-background-color="rgb(var(--global-color-primary-500), .3)"
    --button-default-focus-color="rgb(var(--global-color-contrast-900))"
    --button-default-hover-background-color="rgb(var(--global-color-primary-500))"
    --button-default-box-shadow="none"
    --button-default-color="rgb(var(--global-color-contrast-900))"
  ></Button>
  {#if !!maxPage}
    <Button
      on:click={hardNext}
      icon="mdi-chevron-double-right"
      --button-default-background-color="transparent"
      --button-default-focus-background-color="rgb(var(--global-color-primary-500), .3)"
      --button-default-focus-color="rgb(var(--global-color-contrast-900))"
      --button-default-hover-background-color="rgb(var(--global-color-primary-500))"
      --button-default-box-shadow="none"
      --button-default-color="rgb(var(--global-color-contrast-900))"
    ></Button>
  {/if}
</div>

<style>
  .paginator-container {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .page-button {
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-content: center;
    padding: .2rem .7rem;
  }

  .selected {
    background-color: var(
      --paginator-selected-background-color,
      var(--paginator-default-selected-background-color)
    );
    color: var(
      --paginator-selected-color,
      var(--paginator-default-selected-color)
    );
    cursor: default;
  }
</style>