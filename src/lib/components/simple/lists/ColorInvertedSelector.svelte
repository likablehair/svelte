<script lang="ts" module>
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
  import type { Snippet } from 'svelte';

  interface Props {
    options: Option[];
    selectedIndex?: number;
    deletable?: boolean;
    class?: {
      container?: string,
      element?: string,
      selected?: string,
    }
    onselect?: (event: {
      detail: {
        option: Option,
        selectedIndex: number | undefined,
        native: Event
      }
    }) => void
    ondelete?: (event: {
      detail: {
        option: Option,
      index: number
      }
    }) => void
    prependSnippet?: Snippet<[{
      option: Option,
      index: number,
      handleClickClose: (option: Option, index: number) => void
    }]>
    optionSnippet?: Snippet<[{
      option: Option,
    }]>
    appendSnippet?: Snippet<[{
      option: Option,
      handleClickClose: (option: Option, index: number) => void
    }]>
  }

  let { 
      options, 
      selectedIndex = $bindable(undefined), 
      deletable = true,
      class: clazz = {},
      ondelete,
      onselect,
      appendSnippet,
      optionSnippet,
      prependSnippet,
  }: Props = $props();


  function handleOptionClick(option: Option, index: number, e: Event) {
    if(onselect){
      onselect({
        detail: {
          option,
          selectedIndex,
          native: e
        }
      })
    }
    
    selectedIndex = index
  }

  function handleClickClose(option: Option, index: number) {
    if(ondelete){
      ondelete({
        detail: {
          option,
          index
        }
      })
    }
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
        onclick={(e) => handleOptionClick(option, index, e)}
        onkeydown={() => { }}
      >
        <div class="icon-and-title">
          <div>
            {#if prependSnippet}
                {@render prependSnippet({ option, handleClickClose, index })}
            {:else}
              {#if !!option.icon}
                <Icon
                  name={option.icon}
                ></Icon>
              {/if}
            {/if}
          </div>
          {#if optionSnippet}
            {@render optionSnippet({ option })}
          {:else}
            <div class="label">
              {option.label}
            </div>
          {/if}
        </div>
        <div
          onclick={(e) => { e.stopPropagation() }}
          onkeydown={() => { }}
          role="presentation"
        >
          {#if appendSnippet}
            {@render appendSnippet({ option, handleClickClose })}
          {:else}
            {#if deletable}
              <Icon
                name="mdi-close"
                onclick={() => handleClickClose(option, index)}
              ></Icon>
            {/if}
          {/if}
        </div>
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