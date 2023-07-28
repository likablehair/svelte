<!-- <script lang="ts" context="module">
  export type Header = {
    value: string;
    label: string;
    type: "boolean" | "string" | "number" | "date" | "custom";
    width?: string;
    minWidth?: string;
    data?: { [key: string]: any };
  };
</script>

<script lang="ts">
  import { onMount } from 'svelte';
	import type { Filter } from '$lib/types/filter';
	import StandardPaginator from './StandardPaginator.svelte';
	import StandardSelect from './StandardSelect.svelte';
	import StandardTable from "./StandardTable.svelte";

  export let headers: Header[] = [],
    filters: Filter[] = [],
    width: string = "auto",
    page: number = 1,
    perPage: number = 20,
    perPageOptions: number[] = [20, 50, 100],
    reload: boolean = false,
    loading: boolean = false,
    loadingText: string = "Caricamento ...",
    noDataText: string = "Nessun elemento disponibile",
    fetcher: (params: {
      page: number,
      perPage: number,
      filters: Filter[]
    }) => Promise<{
      data: any[],
      meta: PaginationData
    }>

  let items: { [key: string]: any }[] = [],
    maxPage: number | undefined = undefined

  onMount(() => {
    loadRows()
  })

  async function loadRows() {
    if(!!fetcher) {
      loading = true
      let results = await fetcher({page, perPage, filters})

      items = results.data
      page = results.meta.currentPage
      maxPage = results.meta.lastPage
      loading = false
    }
  }

  function handlePaginationChange() {
    loadRows()
  }

  function handlePerPageChange() {
    page = 1
    loadRows()
  }

  $: perPageOptionsFormatted = perPageOptions.map((el) => {
    return {
      value: el,
      text: el.toString()
    }
  })
  $: if(reload) {
    loadRows().then(() => {
      reload = false
    })
  }

  $: filters && loadRows()

</script>

<div class="top-actions">

</div>
<div class="table">
  <StandardTable
    headers={headers}
    width={width}
    items={items}
  >
    <svelte:fragment slot="appendLastColumn" let:item>
      <slot name="appendLastColumn" item={item}></slot>
    </svelte:fragment>

    <svelte:fragment slot="customColumn" let:item let:header>
      <slot name="customColumn" item={item} header={header}></slot>
    </svelte:fragment>
  </StandardTable>
  {#if loading}
    <div class="loading-text">
      {loadingText}
    </div>
  {:else if items.length == 0}
    <div class="no-data">
      {noDataText}
    </div>
  {/if}
</div>
<div class="footer">
  <div>
    <StandardSelect
      bind:value={perPage}
      options={perPageOptionsFormatted}
      on:change={handlePerPageChange}
    ></StandardSelect>
  </div>
  <div>
    <StandardPaginator
      bind:page={page}
      bind:maxPage={maxPage}
      on:change={handlePaginationChange}
    ></StandardPaginator>
  </div>
</div>

<style>
  .footer {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }

  .loading-text {
    height: 200px;
    max-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--global-light-contrast-color);
    font-size: .9rem;
  }

  .no-data {
    height: 200px;
    max-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--global-light-contrast-color);
    font-size: .9rem;
  }
</style> -->