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

  export let addFilterLabel: string = "Filters",
    columnSelectableLabel: string = "Columns",
    filters: Filter[] = [],
    columns: Column[] = [],
    cancelFilterLabel : string = "Cancel",
    applyFilterLabel : string = "Apply Filter"
    

  let dispatch = createEventDispatcher<{
    'addFilterClick': undefined,
    'selectFilterClick': undefined,
    'applyFilterClick': Filter
  }>()

  let open: boolean = false,
    activator: HTMLElement;

  function handleAddFilterClick() {
    dispatch('addFilterClick')
    open = true
  }

  function handleExtraActions() {

  }

  $: columnsOption = columns.map((c) => {
    return {
      title: c.label
    }
  })

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


  let columnFilterActivator:  HTMLElement | undefined
  let columnFilterMenuOpened: boolean = false
  
  $: selectedFilter = selected === undefined ? undefined : filters.find((f) => {return f.name === selected})

  function handleFilterSelection(e: CustomEvent) {
    singleFilterMenuOpened = true;
    selected = e.detail.element.name
  }

  function handleColumnSelectionClick(e: CustomEvent) {
    columnFilterMenuOpened = true;
  }

  function handleExtraActionsClick(e: CustomEvent) {
   
  }

  function handleColumnSelection(e: CustomEvent) {

  }

  function handleCancelFilterClick(e: CustomEvent) {
    open = false
    singleFilterMenuOpened = false;
  }

  function handleApplyFilterClick(e: CustomEvent) {
    dispatch('applyFilterClick', selectedFilter )
    open = false
    singleFilterMenuOpened = false;
  }

</script>


<div 
  class="filter-button"
  bind:this={activator}
>
  <Button
    --button-color="var(--chip-color, var(--chip-default-color))"
    on:click={handleAddFilterClick}
  >
    <Icon name="mdi-filter"></Icon>
    {addFilterLabel}
  </Button>
  <Button
    on:click={handleColumnSelectionClick}
   >
    <Icon name="mdi-table-column-plus-after"></Icon>
    {columnSelectableLabel}
  </Button>
  <Button
    on:click={handleExtraActionsClick}
   >
    <Icon name=" mdi-dots-vertical"></Icon>
    
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
      <div style:height="160px" style:background-color="rgb(var(--global-color-background-200))" >
        <div class="filter-title">
            Filtra per {selectedFilter?.label}
        </div>

        <div class="sub-filter-container">
            <div class="filter-conditions">
            </div>
            
            <SimpleTextField 
              class={{ }}
              type="text"
              placeholder={selectedFilter?.label}
              appendInnerIcon="mdi-check"
            ></SimpleTextField>

            <div class="sub-filter-button">

              <Button
              --button-background-color="rgb(var(--global-color-background-200))"
              on:click={handleCancelFilterClick}
              >
              {cancelFilterLabel}
              
            </Button>

            
            <Button
            --button-min-width="100px"
            --button-background-color="rgb(var(--global-color))"
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
  }

  .filter-conditions{
    display: flex;
  }

  .sub-filter-button {
    display: flex;
    column-gap: 10px;
    flex-direction: row;
    align-items: start;
  }

</style>