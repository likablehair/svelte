<script lang="ts">
	import { FilterEditor, Icon } from "$lib";
	import type { DateMode, Filter, NumberMode, SelectMode, StringMode } from "$lib/utils/filters/filters";
	import { createEventDispatcher } from "svelte"


	export let filters: Filter[] = [],
		lang: "it" | "en" = "en",
		mAndDown: boolean = false,
		updateMultiFilterValues: (filterName: string, newValue: any, newValid: boolean, mode?: NumberMode | StringMode | SelectMode | DateMode) => void;		

	let selectedFilter: Filter | undefined;
	let tmpFilters: { [filterName: string]: Filter } = filters.reduce((acc, f) => {
    if (f.active) {
        acc[f.name] = f; 
    }
    return acc;
	}, {} as { [filterName: string]: Filter });

  const dispatch = createEventDispatcher<{
		'change': { filter: Filter }
  }>()

	type LabelMapper = {
		[label: string]: { extended?: string; short: string };
	};
	
	let labelsMapper: LabelMapper = lang == 'en' ? {
		equal: { extended: "equal to", short: "equal" },
		like: { short: "includes" },
		ilike: { short: "includes" },
		contains: { short: "contains" },
		greater: { short: "greater", extended: "greater than" },
		lower: { short: "lower", extended: "lower than" },
		between: { short: "between", extended: "is between" },
		different: { short: "different", extended: "different from" },
	} : {
		equal: { extended: "uguale a", short: "uguale" },
		like: { short: "include" },
		ilike: { short: "include" },
		contains: { short: "contiene" },
		greater: { short: "maggiore", extended: "maggiore di" },
		lower: { short: "minore", extended: "minore di" },
		between: { short: "compreso", extended: "è compreso tra" },
		different: { short: "diverso", extended: "diverso da" },
	};

	function selectFilter(filter: Filter) {
		selectedFilter = filter === selectedFilter ? undefined : filter;
	}
	
	function handleKeyPress(event: any, filter: Filter) {
		if (event.key === "Enter" || event.key === " ") {
			selectFilter(filter);
		}
	}

	function handleFilterChange() {
		if(!!selectedFilter){
			dispatch('change', { filter: tmpFilters[selectedFilter.name] })
			filters = filters.map(f => {
				if (f.name === selectedFilter?.name) {
					return tmpFilters[selectedFilter.name]
				}
				return f
			})
		}
	}

	function isActiveFilter(filter: Filter) {
    let newValue: any = {},
      newValid: boolean = false
    if(filter.type == 'select') {
      newValue = filter.values 
      if(!!newValue && newValue.length > 0) {
        newValid = true
      }
    } else if('mode' in filter && filter.mode == 'between') {
      newValue.to = filter.to
      newValue.from = filter.from
      if(!!newValue.from || !!newValue.to) {
        newValid = true
      }
    } else if (filter.type == 'custom') {
      newValue = filter.value
			if ((Array.isArray(newValue) && newValue.length > 0) || (!Array.isArray(newValue) && !!newValue)) {
				newValid = true;
			}
		} else {
      newValue = filter.value
      if(!!newValue) {
        newValid = true
      }
    }

		return newValid
  }

	function updateCustomFilterValues(filterName: string, newValue: any, newValid: boolean, mode?: NumberMode | StringMode | SelectMode | DateMode) {
    let filter = filters.find(f => f.name === filterName)
    if(!filter) throw new Error('cannot find filter with name ' + filterName)
    if(filter.type != 'custom') throw new Error('filter is not custom')
    filter.value = newValue
    filter.active = newValid
		updateMultiFilterValues(filterName, newValue, newValid, mode)
  }
</script>

<div class="custom-filters-container" class:yscroll={mAndDown}>
	<div class="filters-selection">
		{#each filters as filter}
			<div
				tabindex="0"
				role="button"
				class="filters-selection-item"
				class:selected={filter.name === selectedFilter?.name || isActiveFilter(filter)}
				on:click={() => selectFilter(filter)}
				on:keydown={(event) => handleKeyPress(event, filter)}
				aria-pressed={filter.name === selectedFilter?.name}
			>
				<div class="filters-selection-title">
					<div class="filters-selection-title-label">{filter.label}</div>
					<Icon name="mdi-chevron-right-circle-outline" />
				</div>
			</div>
		{/each}
	</div>
	
	<div class="filters-content">
		{#if selectedFilter}
			<div class="filters-content-box">
				<h2>{selectedFilter.label}</h2>	
				{#key selectedFilter.label}			
					<FilterEditor
						bind:filter={selectedFilter}
						{lang}
						{labelsMapper}
						editFilterMode="one-edit"
						bind:tmpFilter={tmpFilters[selectedFilter?.name || '']}
						mobile={mAndDown}
						on:change={handleFilterChange}
						--simple-textfield-border-radius= 0.5rem
						--simple-textfield-background-color= transparent
						--simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
						--simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
						--chip-default-color="rgb(var(--global-color-primary-foreground))"
						--autocomplete-border-radius= 0.5rem
						--autocomplete-border="1px solid rgb(var(--global-color-background-500))"
						--autocomplete-focus-box-shadow="0 0 0 2px rgb(var(--global-color-primary-500))"
						--autocomplete-padding="9.6px 16px"
						--autocomplete-background-color="transparent"
					>
					<svelte:fragment slot="custom" let:filter>
						<slot name="custom" {filter} {mAndDown} {updateCustomFilterValues}></slot>
					</svelte:fragment>
					</FilterEditor>
				{/key}
			</div>
		{:else}
			<div class="filters-content-box">
				<p>{lang == 'en' ? 'Please select a filter to display content.' : 'Seleziona un filtro per mostrarne il contenuto.'}</p>
			</div>
		{/if}
	</div>
</div>
<style>
.custom-filters-container {
    display: flex;
    height: 70vh;
  }

	.yscroll {
		overflow-y: auto;
	}

  .filters-selection {
    width: 40%;
    padding: 1rem;
    overflow-y: auto;
  }

  .filters-selection-item {
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background-color 0.3s, border 0.3s;
    border-radius: 5px;

  }
  .filters-selection-title{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

	.filters-selection-title-label{
		overflow: hidden;
    text-overflow: ellipsis;
  }

  .filters-selection-item.selected {
    border: 1px solid rgb(var(--global-color-primary-500));
    background-color:  rgb(var(--global-color-background-500));
  }

	.filters-content {
		min-width: 60%;
		max-width: 60%;
  }
  .filters-content-box {
    padding: 1rem;
  }

  .filters-content-box>h2 {
    font-size: larger;
    text-align: center;
    font-weight: bold;
  }
</style>