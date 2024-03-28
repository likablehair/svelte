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

  function updateMultiFilterValues(filterName: string, newValue: any) {
    let filter = tmpFilters[filterName]
    if(!filter) throw new Error('cannot find filter with name ' + filterName)
    if(filter.type == 'select') {
      filter.values = newValue
    } else if('mode' in filter && filter.mode == 'between') {
      filter.to = newValue.to
      filter.from = newValue.from
    } else {
      filter.value = newValue
    }
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
  <div class="form-container" style:background-color={mAndDown ? 'transparent' : 'rgb(var(--global-color-background-100))'} style:width={mAndDown ? '100%' : '50vw'} style:box-sizing="border-box">
    <div class="header">
      <h1>{title}</h1>
    </div>
    <div class="body">
      <slot {mAndDown} {updateMultiFilterValues}>
        <div class="filters-container" style:grid-template-columns={mAndDown ? '1fr' : '1fr 1fr'}>
          {#each filters as filter, i}
            <div class="filter">
              <div class="input">
                {#if !filter.advanced && filter.type !== 'custom'}
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
                    mobile={mAndDown}
                  >
                    <slot name="custom" slot="custom" let:updateFunction {updateFunction} {mAndDown} {filter}></slot>
                  </FilterEditor>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </slot>
    </div>
    <div class="footer">
      <slot name="footer" {mAndDown}>
        <div class="actions" style:padding-bottom={mAndDown ? '20px' : undefined}>
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
    border-radius: 10px;
    padding: 20px;
    height: 100%;
  }

  .filters-container {
    display: grid;
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