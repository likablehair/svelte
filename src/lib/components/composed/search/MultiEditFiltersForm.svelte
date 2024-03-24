<script lang="ts">
    import Button from "$lib/components/simple/buttons/Button.svelte";
    import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
    import type { Filter } from "$lib/utils/filters/filters";
    import { createEventDispatcher, onMount } from "svelte";
    import FilterEditor from "./FilterEditor.svelte";
    import type { LabelMapper } from "./Filters.svelte";
    import Validator from "$lib/utils/filters/validator";

  export let filters: Filter[],
    title: string,
    lang: 'it' | 'en',
    labelsMapper: LabelMapper,
    cancelFilterLabel : string = lang == 'en' ? "Cancel" : "Annulla",
    removeFiltersLabel: string = lang == 'en' ? "Remove filters" : "Rimuovi filtri",
    applyFilterLabel : string = lang == 'en' ? "Apply filter" : "Applica filtri",
    betweenFromLabel: string = lang == 'en' ? "From" : "Da",
    betweenToLabel: string = lang == 'en' ? "To" : "A"

  let tmpFilters: {[filterName: string]: Filter} = {}

  const dispatch = createEventDispatcher<{
    'cancel': undefined
    'remove': undefined
    'apply': undefined
  }>()

  function updateCustomFilterValue(filterName: string, newValue: any) {
    let filter = filters.find(f => f.name == filterName)
    if(!filter) throw new Error('cannot find filter')
    // filter.active = true
    // filters = filters
  }

  function handleCancelFilterClick() {
    dispatch('cancel')
  }

  function handleRemoveFilterClick() {
    dispatch('remove')
  }

  function handleApplyFilterClick() {
    for(let i = 0; i < filters.length; i += 1) {
      if(!!filters[i] && !!tmpFilters[filters[i].name]) {
        filters[i] = {...tmpFilters[filters[i].name]}
        filters[i].active = Validator.isValid(tmpFilters[filters[i].name])
      }
    }
    filters = filters
    dispatch('apply')
  }

</script>

<MediaQuery let:mAndDown>
  <div class="form-container">
    <div class="header">
      <h1>{title}</h1>
    </div>
    <div class="body">
      <slot name="content" {mAndDown} {updateCustomFilterValue}>
        <div class="filters-container">
          {#each filters as filter, i}
            {#if filter.type === 'custom'}
              <slot name="custom"></slot>
            {:else}
              <div class="filter">
                <slot name="filter" {filter} {updateCustomFilterValue} {mAndDown}>
                  <div class="input">
                    {#if !filter.advanced}
                      <div class="label">
                        {filter.label}
                      </div>
                    {/if}
                    <div class="field">
                      <FilterEditor
                        bind:filter={filter}
                        {lang}
                        {labelsMapper}
                        editFilterMode="multi-edit"
                        {betweenFromLabel}
                        {betweenToLabel}
                        bind:tmpFilter={tmpFilters[filter.name]}
                      ></FilterEditor>
                    </div>
                  </div>
                </slot>
              </div>
            {/if}
          {/each}
        </div>
      </slot>
    </div>
    <div class="footer">
      <slot name="footer" {mAndDown}>
        <div class="actions">
          <Button
            --button-color="rgb(var(--global-color-primary-400))"
            --button-background-color="transparent"
            --button-hover-background-color="rgb(var(--global-color-primary-500))"
            --button-hover-box-shadow="0 0 0.5rem rgba(0, 0, 0, 0.3)"
            --button-box-shadow="none"
            on:click={handleCancelFilterClick}
          >
            {cancelFilterLabel}
          </Button>
          <Button
            --button-color="rgb(var(--global-color-primary-400))"
            --button-background-color="transparent"
            --button-hover-background-color="rgb(var(--global-color-primary-500))"
            --button-hover-box-shadow="0 0 0.5rem rgba(0, 0, 0, 0.3)"
            --button-box-shadow="none"
            on:click={handleRemoveFilterClick}
          >
            {removeFiltersLabel}
          </Button>
          <Button
            --button-min-width="100px"
            on:click={handleApplyFilterClick}
            disabled={/*applyFilterDisabled*/ false}
          >
            {applyFilterLabel}
          </Button>
        </div>
      </slot>
    </div>
  </div>
</MediaQuery>

<style>

  .form-container {
    background-color: rgb(var(--global-color-background-100));
    border-radius: 10px;
    width: 50vw;
    padding: 20px;
  }

  .filters-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px
  }

  .filter {
    display: flex;
    align-items: center;
  }

  .input {
    width: 100%;
  }

  .input .label {
    margin-bottom: 5px;
  }

  .footer {
    margin-top: 40px;
  }

  .footer .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-right: 20px;
  }

</style>