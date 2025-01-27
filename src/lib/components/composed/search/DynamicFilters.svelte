<script lang="ts">
	import { FilterEditor, Icon } from "$lib";
	import type { Filter } from "$lib/utils/filters/filters";
	import { createEventDispatcher } from "svelte"


	export let filters: Filter[] = [],
		lang: "it" | "en" = "en",
		mAndDown: boolean = false;		

	let selectedFilter: Filter | undefined;
	let tmpFilters: { [filterName: string]: Filter } = filters.reduce((acc, f) => {
    if (f.active) {
        acc[f.name] = f; 
    }
    return acc;
	}, {} as { [filterName: string]: Filter });

  const dispatch = createEventDispatcher<{
    'removeAllFilters': {},
		'change': { filter: Filter }
  }>()

	let activeFilter = Object.values(tmpFilters).reduce((count, filter) => {
		if ((filter as any).value !== undefined ||
			(filter as any).from !== undefined ||
			(filter as any).to !== undefined ||
			((filter as any).values !== undefined && (filter as any).values.length > 0)
		) count++;
		return count;
	}, 0);

	type LabelMapper = {
		[label: string]: { extended?: string; short: string };
	};
	
	let labelsMapper: LabelMapper = {
		equal: { extended: "equal to", short: "equal" },
		like: { short: "includes" },
		ilike: { short: "includes" },
		contains: { short: "contains" },
		greater: { short: "greater", extended: "greater than" },
		lower: { short: "lower", extended: "lower than" },
		between: { short: "between", extended: "is between" },
		different: { short: "different", extended: "different from" },
	};

	function selectFilter(filter: Filter) {
		selectedFilter = filter === selectedFilter ? undefined : filter;
	}
	
	function handleKeyPress(event: any, filter: Filter) {
		if (event.key === "Enter" || event.key === " ") {
			selectFilter(filter);
		}
	}
	
	function clearFilters() {
		tmpFilters = {};
		dispatch('removeAllFilters', {})
	}

	function handleFilterChange() {
		if(!!selectedFilter){
			dispatch('change', { filter: tmpFilters[selectedFilter.name] })
		}
	}
</script>

<div class="custom-filters-container">
	<div class="filters-selection">
	
		{#if activeFilter > 0}
			<div class="filter-info">
				{activeFilter} applied
				<button class="clear-button" on:click={clearFilters}>✕</button>
			</div>
		{/if}

	
		{#each filters as filter}
			<div
				tabindex="0"
				role="button"
				class="filters-selection-item"
				class:selected={filter === selectedFilter}
				on:click={() => selectFilter(filter)}
				on:keydown={(event) => handleKeyPress(event, filter)}
				aria-pressed={filter === selectedFilter}
			>
				<div class="filters-selection-title">
					{filter.label}
					<Icon name="mdi-chevron-right-circle-outline" />
				</div>
			</div>
		{/each}
	</div>

	
	<div class="filters-content">
		{#if selectedFilter}
			<div class="filters-content-box">
				<h2>{selectedFilter.label}</h2>				
				<FilterEditor
					bind:filter={selectedFilter}
					{lang}
					{labelsMapper}
					editFilterMode="one-edit"
					bind:tmpFilter={tmpFilters[selectedFilter.name]}
					mobile={mAndDown}
					on:change={handleFilterChange}
					--simple-textfield-border-radius="5px"
					--chip-default-color="rgb(var(--global-color-primary-foreground))"
				>
				<svelte:fragment slot="custom" let:filter>
					<slot name="custom" {filter} {mAndDown}></slot>
				</svelte:fragment>
				</FilterEditor>
			</div>
		{:else}
			<div class="filters-content-box">
				<p>Please select a filter to display content.</p>
			</div>
		{/if}
	</div>
</div>

<style>
  
.custom-filters-container {
    display: flex;
    height: 70vh;
    overflow-y: scroll;
  }

  .filters-selection {
    width: 40%;
    padding: 1rem;

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

  .filters-selection-item.selected {
    border: 1px solid rgb(var(--global-color-primary-500));
    background-color:  rgb(var(--global-color-background-500));
  }

	.filters-content {
    width: 60%;
  }
  .filters-content-box {
    padding: 1rem;
  }

  .filters-content-box>h2 {
    font-size: larger;
    text-align: center;
    font-weight: bold;
  }

  .filter-info {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    background-color: rgb(var(--global-color-background-700));
    color: rgb(var(--global-color-primary-600));
    border-radius: 1rem;
    font-weight: bold;
    font-size: 0.9rem;
		margin-bottom: 10px;
  }

  .clear-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 1rem;
    height: 1rem;
    margin-left: 0.5rem;
    border-radius: 50%;
    background-color: rgb(var(--global-color-background-700));
    color: rgb(var(--global-color-primary-600));
    font-weight: bold;
    cursor: pointer;
    font-size: 0.8rem;
    border: none;
  }

  .clear-button:hover {
    background-color: rgb(var(--global-color-background-500));
  }
</style>