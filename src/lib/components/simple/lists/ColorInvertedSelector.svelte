<script lang="ts" context="module">
  export type Option = {
    label: string,
    name: string
  };
</script>

<script lang="ts">
  import '../../../css/main.css'
  import './ColorInvertedSelector.css'
  import Icon from '../media/Icon.svelte'
  import { createEventDispatcher } from "svelte";

  let clazz: {
    container?: string,
    element?: string,
    selected?: string,
  } = {};
	export { clazz as class };

  let dispatch = createEventDispatcher<{
    'select': {
      option: Option,
      selectedIndex: number
    },
    'delete': {
      option: Option,
      index: number
    }
  }>()

  export let options: Option[],
    selectedIndex: number


  function handleOptionClick(option: Option, index: number) {
    dispatch('select', {
      option: option,
      selectedIndex
    })
    
    selectedIndex = index
  }

  function handleClickClose(option: Option, index: number) {
    dispatch('delete', {
      option: option,
      index: index
    })
  }
</script>

<div class="selector-container {clazz?.container || ''}">
  {#each options as option, index}
    <div
      class:selected={selectedIndex == index}
      class="element {clazz?.element || ''} {selectedIndex == index ? clazz.selected : ''}"
      on:click={() => handleOptionClick(option, index)}
      on:keydown={() => { }}
    >
      <div>
        <slot name="option" {option}>{option.name}</slot>
      </div>
      <div
        on:click|stopPropagation={() => { }}
        on:keydown={() => { }}
      >
        <slot name="append" {option} {handleClickClose}>
          <Icon
            name="mdi-close"
            click
            on:click={() => handleClickClose(option, index)}
            on:keydown={() => { }}
          ></Icon>
        </slot>
      </div>
    </div>
  {/each}
</div>

<style>
  .selector-container {
    background-color: var(
      --color-inverted-selector-background-color,
      var(--color-inverted-selector-default-background-color)
    );
    width: var(
      --color-inverted-selector-width,
      var(--color-inverted-selector-default-width)
    );
    height: var(
      --color-inverted-selector-height,
      var(--color-inverted-selector-default-height)
    );
    border-radius: 5px;
    padding: 10px 10px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: var(
      --color-inverted-selector-vertical-gap, 
      var(--color-inverted-selector-default-vertical-gap)
    );
  }

  .element {
    padding: 5px 5px 5px 10px;
    cursor: pointer;
    transition: all .1s ease-in;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .selected {
    color: var(
      --color-inverted-selector-selected-color,
      var(--color-inverted-selector-default-selected-color)
    );
    background-color: var(
      --color-inverted-selector-selected-background-color,
      var(--color-inverted-selector-default-selected-background-color)
    );
    font-weight: 700;
  }
</style>