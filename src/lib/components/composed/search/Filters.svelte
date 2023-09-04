<script lang="ts" context="module">
  export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
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

  export let addFilterLabel: string = "Add filter",
    filters: Filter[] = []

  let dispatch = createEventDispatcher<{
    'addFilterClick': undefined
  }>()

  let open: boolean = false,
    activator: HTMLElement;

  function handleAddFilterClick() {
    dispatch('addFilterClick')
    open = true
  }

  $: filterOptions = filters.map((f) => {
    return {
      title: f.label,
      name: f.name
    }
  })

  let selected: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  let focused: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  $: if(!!selected) selected = undefined
  $: if(!!focused && !open) focused = undefined

  function handleFilterSelection() {

  }
</script>


<div 
  class="add-filter-button"
  bind:this={activator}
>
  <Button
    on:click={handleAddFilterClick}
  >
    <Icon name="mdi-plus"></Icon>
    {addFilterLabel}
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
      _minWidth="100px"
      _borderRadius="5px"
      anchor="bottom-center"
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
    </Menu>
  {/if}
</MediaQuery>

<style>
  .add-filter-button {
    width: fit-content;
  }
</style>