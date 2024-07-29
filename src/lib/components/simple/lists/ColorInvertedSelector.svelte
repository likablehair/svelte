<script lang="ts" context="module">
  export type Option = {
    label: string,
    name: string,
    icon?: string
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
      selectedIndex: number | undefined,
      native: Event
    },
    'delete': {
      option: Option,
      index: number
    }
  }>()

  export let options: Option[],
    selectedIndex: number | undefined,
    deletable: boolean = true


  function handleOptionClick(option: Option, index: number, e: Event) {
    dispatch('select', {
      option: option,
      selectedIndex,
      native: e
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

<ul 
  class="selector-container {clazz?.container || ''}" 
  role="listbox"
>
  {#each options as option, index}
    <li >
      <button
        class:selected={selectedIndex == index}
        class="element {clazz?.element || ''} {selectedIndex == index ? clazz.selected : ''}"
        on:click={(e) => handleOptionClick(option, index, e)}
        on:keydown={() => { }}
      >
        <div class="icon-and-title">
          {#if !!$$slots.prepend || !!option.icon}
            <div>
              <slot name="prepend" {option} {handleClickClose} {index}>
                {#if !!option.icon}
                  <Icon
                    name={option.icon}
                  ></Icon>
                {/if}
              </slot>
            </div>
          {/if}
          <slot name="option" {option}>
            <div class="label">
              {option.label}
            </div>
          </slot>
        </div>
        {#if !!$$slots.append || deletable}
          <div
            on:click|stopPropagation={() => { }}
            on:keydown={() => { }}
          >
            <slot name="append" {option} {handleClickClose}>
              {#if deletable}
                <Icon
                  name="mdi-close"
                  click
                  on:click={() => handleClickClose(option, index)}
                  on:keydown={() => { }}
                ></Icon>
              {/if}
            </slot>
          </div>
        {/if}
      </button>
    </li>
  {/each}
</ul>

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
    list-style: none;
  }

  .icon-and-title {
    display: flex;
    gap: var(
      --color-inverted-selector-icon-gap, 
      var(--color-inverted-selector-default-icon-gap)
    );
    align-items: center;
    font-size: var(
      --color-inverted-selector-font-size, 
      var(--color-inverted-selector-default-font-size)
    );
    max-width: 100%;
    position: var(--color-inverted-selector-icon-and-title-position, relative);
  }

  .element {
    padding: var(
      --color-inverted-selector-element-padding, 
      var(--color-inverted-selector-default-element-padding)
    );
    height: var(
      --color-inverted-selector-element-height, 
      var(--color-inverted-selector-default-element-height)
    );
    cursor: pointer;
    transition: all .1s ease-in;
    border-radius: var(
      --color-inverted-selector-element-border-radius, 
      var(--color-inverted-selector-default-element-border-radius)
    );
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    border: none;
    background-color: transparent;
    font-size: inherit;
    color: inherit;
    position: var(--color-inverted-selector-element-position, relative);
  }

  .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    position: relative;
  }

  .element:not(.selected):hover {
    color: var(
      --color-inverted-selector-hover-color,
      var(--color-inverted-selector-default-hover-color)
    );
    background-color: var(
      --color-inverted-selector-hover-background-color,
      var(--color-inverted-selector-default-hover-background-color)
    );
    font-weight: var(
      --color-inverted-selector-hover-font-weight,
      var(--color-inverted-selector-default-hover-font-weight)
    );
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
    font-weight: var(
      --color-inverted-selector-selected-font-weight,
      var(--color-inverted-selector-default-selected-font-weight)
    );
  }
</style>