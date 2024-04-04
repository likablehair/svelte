<script lang="ts">
  import "../../../css/main.css";
  import "./Paginator.css";
  import { createEventDispatcher } from "svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";

  let dispatch = createEventDispatcher<{
    change: {
      page: number;
    };
  }>();

  export let page: number = 1,
    maxPage: number | undefined = undefined;

  function goToPage(p: number) {
    if (p <= 0 || (!!maxPage && p > maxPage)) return;
    page = p;
    emitChange();
  }

  function previousPage() {
    if (page == 1) return;
    page -= 1;
    emitChange();
  }

  function hardPrevious() {
    page = 1;
    emitChange();
  }

  function nextPage() {
    if (!!maxPage && page >= maxPage) return;
    page += 1;
    emitChange();
  }

  function hardNext() {
    if (!maxPage) return;
    page = maxPage;
    emitChange();
  }

  function emitChange() {
    dispatch("change", {
      page,
    });
  }

  $: if (!!maxPage && page > maxPage) page = maxPage;
</script>

<div class="paginator-container">
  <button class="page-button" on:click={hardPrevious}
    ><Icon name="mdi-chevron-double-left" /></button
  >
  <button class="page-button" on:click={previousPage}
    ><Icon name="mdi-chevron-left" /></button
  >
  {#if page != 1}
    <button class="page-button" on:click={() => goToPage(page - 1)}
      >{page - 1}</button
    >
  {/if}
  <div class="page-button" class:selected={true}>
    {page}
  </div>
  {#if !maxPage || (!!maxPage && page < maxPage)}
    <button class="page-button" on:click={() => goToPage(page + 1)}
      >{page + 1}</button
    >
  {/if}
  <button class="page-button" on:click={nextPage}
    ><Icon name="mdi-chevron-right" /></button
  >
  {#if !!maxPage}
    <button class="page-button" on:click={hardNext}
      ><Icon name="mdi-chevron-double-right" /></button
    >
  {/if}
</div>

<style>
  button {
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
  }

  .paginator-container {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .page-button {
    background-color: var(
      --paginator-page-button-background-color,
      var(--paginator-default-page-button-background-color)
    );
    color: var(
      --paginator-page-button-color,
      var(--paginator-default-page-button-color)
    );
    border-radius: var(
      --paginator-page-button-border-radius,
      var(--paginator-default-page-button-border-radius)
    );
    display: flex;
    justify-content: center;
    align-content: center;
    padding: var(
      --paginator-page-button-padding,
      var(--paginator-default-page-button-padding)
    );
  }

  .page-button:focus {
    background-color: var(
      --paginator-page-button-focus-background-color,
      var(--paginator-default-page-button-focus-background-color)
    );
    color: var(
      --paginator-page-button-focus-color,
      var(--paginator-default-page-button-focus-color)
    );
  }

  .page-button:hover {
    background-color: var(
      --paginator-page-button-hover-background-color,
      var(--paginator-default-page-button-hover-background-color)
    );
    border-radius: var(
      --paginator-page-button-hover-border-radius,
      var(--paginator-default-page-button-hover-border-radius)
    );
  }

  .selected {
    background-color: var(
      --paginator-page-button-selected-background-color,
      var(--paginator-default-page-button-selected-background-color)
    );
    color: var(
      --paginator-page-button-selected-color,
      var(--paginator-default-page-button-selected-color)
    );
    padding: var(
      --paginator-page-button-selected-padding,
      var(--paginator-default-page-button-selected-padding)
    );
    cursor: default;
  }
</style>