<script lang="ts" context="module">
  export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
  export type Column ={
    label: string,
  }
</script>

<script lang="ts">
  import './Filters.css'
  import '../../../css/main.css'
  import Drawer from '$lib/components/simple/navigation/Drawer.svelte';
  import Menu from '$lib/components/simple/common/Menu.svelte';
  import MediaQuery from '$lib/components/simple/common/MediaQuery.svelte';
  import Button from '$lib/components/simple/buttons/Button.svelte';
  import Icon from '$lib/components/simple/media/Icon.svelte';
  import { createEventDispatcher, type ComponentProps } from 'svelte';
  import type { Filter } from '$lib/utils/filters/filters';
  import SelectableVerticalList from '$lib/components/simple/lists/SelectableVerticalList.svelte';
  import SimpleTextField from '$lib/components/simple/forms/SimpleTextField.svelte';
  import Chip from '$lib/components/simple/navigation/Chip.svelte';
  import Checkbox from '$lib/components/simple/forms/Checkbox.svelte';

  export let 
    addFilterLabel: string = "Filters",
    counterFilterLabel: number = 0,
    filters: Filter[] = [{
      name:"customerName", 
      label:"Customer Name", 
      active:true, 
      type:"string", 
      column:"customerName", 
      value: "",
      mode: 'ilike'
    }],
    cancelFilterLabel : string = "Cancel",
    applyFilterLabel : string = "Apply Filter",
    openExtendAppliedFilterLabel: string= "Mostra filtri applicati",
    closeExtendAppliedFilterLabel: string = "Nascondi filtri applicati",
    extendAppliedFilterLabel: string = closeExtendAppliedFilterLabel,
    filterTitleLabel: string = "Filtra per "

  let dispatch = createEventDispatcher<{
    'addFilterClick': undefined,
    'selectFilterClick': undefined,
  }>()

  let open: boolean = false,
    activator: HTMLElement,
    filterSlots: Filter  [] = [],
    showAppliedFilter : boolean = true


  function handleAddFilterClick() {
    dispatch('addFilterClick')
    open = true
  }


  $: filterOptions = filters.map((f) => {
    return {
      title: f.label,
      name: f.name,
    }
  })


  let selected: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  let focused: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  $: if(!!focused && !open) focused = undefined


  let singleFilterActivator:  HTMLElement | undefined
  let singleFilterMenuOpened: boolean = false

  let selectedFilter : Filter | undefined = undefined
  $: selectedFilter = selected === undefined ? undefined : filters.find((f) => {return f.name === selected})

  function handleFilterSelection(e: CustomEvent) {
    singleFilterMenuOpened = true;
    selected = e.detail.element.name
  }

  function handleCancelFilterClick(e: CustomEvent) {
    open = false
    singleFilterMenuOpened = false;
  }

  function handleApplyFilterClick() {
    counterFilterLabel++;
    if(!!selectedFilter && selectedFilter.type == "string") {
      let _filterApplied = {
        name: selectedFilter.name, 
        label: selectedFilter.label, 
        active: selectedFilter.active, 
        type: selectedFilter.type, 
        column: selectedFilter.column, 
        value: selectedFilter?.value,
        mode: selectedFilter.mode
      }


      filterSlots = [...filterSlots, _filterApplied]
      open = false
      singleFilterMenuOpened = false;
    }
  }
  
  function handleAppliedFilterClick(){
    showAppliedFilter = !showAppliedFilter
    extendAppliedFilterLabel = !!showAppliedFilter ? closeExtendAppliedFilterLabel : openExtendAppliedFilterLabel
  }

  function handleRemoveFilter (){
    filterSlots.pop()    
    filterSlots = filterSlots
  }



</script>
 {#if filterSlots.length > 0}
  <div 
    class="extend-filter-applyed" 
    on:keypress={handleAppliedFilterClick} 
    on:click={handleAppliedFilterClick}>
    {extendAppliedFilterLabel}
  </div>
{/if}
{#if showAppliedFilter}
<div class="filter-slots-container">
  {#each filterSlots as filterSlot}  
      <div class="filter-slot">
        {#if !!filterSlot && filterSlot.type === "string" }
          <Chip label close on:close={handleRemoveFilter}>
            <b> {filterSlot.label} </b> 
            {filterSlot.mode}  <b>{filterSlot.value}</b> 
          </Chip>
        {/if}
      </div>
  {/each}
</div>
{/if}

<div 
  class="filter-button"
  bind:this={activator}
>
  <Button
    --button-color="var(--chip-color, var(--chip-default-color))"
    on:click={handleAddFilterClick}
  >
    <Icon name="mdi-filter"></Icon>
    {addFilterLabel}  {#if filterSlots.length> 0 } ({counterFilterLabel}) {/if}
  </Button>
  
</div>

<MediaQuery let:mAndDown>
  {#if mAndDown}
    <Drawer
      bind:open={open}
      position="bottom"
      on:item-click
    >
      <SelectableVerticalList
        bind:selected
        bind:focused
        bind:elements={filterOptions}
        --selectable-vertical-list-default-width="100%"
        --selectable-vertical-list-default-element-height="56px"
        --selectable-vertical-list-default-title-font-size="null"
        on:select={handleFilterSelection}
      ></SelectableVerticalList>
    </Drawer>
  {:else}
    <Menu
      bind:activator={activator}
      bind:open={open}
      closeOnClickOutside
      _boxShadow="rgb(var(--global-color-grey-900), .5) 0px 2px 4px"
      _height="fit-content"
      _maxHeight="300px"
      _minWidth="10vw"
      _borderRadius="5px"
      anchor="bottom"
    >
    <div
      style:background-color="rgb(var(--global-color-background-200))"
      bind:this={singleFilterActivator} >
      <SelectableVerticalList
        bind:selected
        bind:focused
        bind:elements={filterOptions}
        --selectable-vertical-list-default-width="100%"
        --selectable-vertical-list-default-element-height="56px"
        --selectable-vertical-list-default-title-font-size="null"
        on:select={handleFilterSelection}
      >
      </SelectableVerticalList>
    </div>
    </Menu>
    <Menu
      _width="350px"
      _borderRadius="10px"
      _boxShadow="rgb(var(--global-color-grey-900), .5) 0px 2px 4px"
      activator={singleFilterActivator}
      bind:open={singleFilterMenuOpened}
      anchor="right-center"
      closeOnClickOutside
      openingId="second-menu"
      flipOnOverflow
    >
      <div style:min-height="160px" style:background-color="rgb(var(--global-color-background-200))" >
        <div class="filter-title">
            {filterTitleLabel} {selectedFilter?.label}
        </div>

        <div class="sub-filter-container">
            
            {#if !!selectedFilter && selectedFilter.type === "string"}
              <SimpleTextField 
                bind:value={selectedFilter.value}
                class={{ }}
                type="text"
                placeholder={selectedFilter?.label}
                appendInnerIcon="mdi-check"
              ></SimpleTextField>
            {/if}
<!-- 
            {#if !!selectedFilter && selectedFilter.type === "choice"}
              {#each selectedFilter.options as option }
                <Checkbox /> {option}
              {/each}
            {/if} -->

            <div class="sub-filter-button">
              <Button
              --button-background-color="rgb(var(--global-color-background-200))"
              --button-color="rgb(var(--global-color-contrast-900))"
              on:click={handleCancelFilterClick}
              >
                {cancelFilterLabel}
              </Button>

              <Button
              --button-min-width="100px"
              on:click={handleApplyFilterClick}
              >
              {applyFilterLabel}
              
            </Button>
          </div>
            
        </div>
      </div>
    </Menu>
  {/if}
</MediaQuery>



<style>
  .filter-button {
    display: flex;
    column-gap: 10px;

  }
  .filter-title{
    display: flex;
    justify-content: center;
  }

  .sub-filter-container {
    display: flex;
    flex-direction: column;
    align-items: left;
    margin: 10%;
    gap:20px;
  }

  .sub-filter-button {
    display: flex;
    column-gap: 10px;
    flex-direction: row;
    align-items: start;
    margin: 10px;
  }

  .filter-slots-container {
    display: flex;
    align-items: flex-start;
    column-gap: 10px;
  }

  .filter-slot {
    font-size: 0.70rem;
    font-weight: 0;
  }
  
  .extend-filter-applyed{
    left: 0;
    top:0;
    font-size: 0.7em;
  }
  .extend-filter-applyed:hover{
      cursor: pointer;
  }
</style>