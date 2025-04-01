<script lang="ts" module>
  export type Element<Data = any> = {
    title: string | number,
    name: string | number,
    description?: string,
    icon?: string,
    data?: Data;
    style?: {
      color?: string,
      backgroundColor?: string
    },
    appendIcon?: string
    disabled?: boolean
  };
</script>

<script lang="ts" generics="Data">
  import '../../../css/main.css'
  import './SelectableVerticalList.css'
  import keyboarder from "$lib/utils/keyboarder";
  import { onMount, type Snippet } from "svelte";
  import Icon from '../media/Icon.svelte';
  import type { KeyboardEventHandler } from 'svelte/elements';

  type ElementData = Element<Data>

  interface Props {
    activeKeyboard?: boolean;
    loopSelection?: boolean;
    focused?: string | number;
    selected?: string | number;
    elements?: ElementData[];
    centered?: boolean;
    bicolor?: boolean
    appendIconSize?: string;
    onselect?: (event: {
      detail: {
        element: ElementData
      }
    }) => void
    onfocus?: (event: {
      detail: {
        element: ElementData
      }
    }) => void
    oniconClick?: (event: {
      detail: {
        index: number,
        element: ElementData
      }
    }) => void
    onkeypress?: KeyboardEventHandler<HTMLDivElement>
    elementSnippet?: Snippet<[{
      selected: boolean
      focused: boolean
    }]>
    titleSnippet?: Snippet<[{
      selected: boolean
      focused: boolean
      element: ElementData
    }]>
    descriptionSnippet?: Snippet<[{
      selected: boolean
      focused: boolean
      element: ElementData
    }]>
  }

  let {
    activeKeyboard = false,
    loopSelection = true,
    focused = $bindable(undefined),
    selected = $bindable(undefined),
    elements = $bindable([]),
    centered = false,
    bicolor = false,
    appendIconSize = "20pt",
    onfocus,
    oniconClick,
    onselect,
    onkeypress,
    elementSnippet,
    descriptionSnippet,
    titleSnippet,
  }: Props = $props();

  let focusedIndex = $derived(elements.findIndex((el) => el.name == focused))

  function handleKeypress(params: {key: string}) {
    if(activeKeyboard && elements.length > 0) {
      if(params.key == 'ArrowDown') {
        let newIndex
        if((focusedIndex === undefined || focusedIndex === -1) || (loopSelection && focusedIndex >= (elements.length - 1))) {
          focused = elements[0].name
          newIndex = 0
        } else if(focusedIndex < (elements.length - 1)) {
          focused = elements[focusedIndex + 1].name
          newIndex = focusedIndex + 1
        }

        if(newIndex !== undefined && onfocus) {
          onfocus({
            detail: {
              element: elements[newIndex]
            }
          })
        }
      } else if(params.key == 'ArrowUp') {
        let newIndex
        if((focusedIndex === undefined || focusedIndex === -1) || (loopSelection && focusedIndex <= 0)) {
          focused = elements[elements.length - 1].name
          newIndex = elements.length - 1
        } else if(focusedIndex > 0) {
          focused = elements[focusedIndex - 1].name
          newIndex = focusedIndex - 1
        }

        if(newIndex !== undefined && onfocus) {
          onfocus({
            detail: {
              element: elements[newIndex]
            }
          })
        }
      } else if(params.key == 'Enter' && focusedIndex !== -1) {
        selected = elements[focusedIndex].name
        if(onselect) {
          onselect({
            detail: {
              element: elements[focusedIndex]
            }
          })
        }
      }
    }
  }

  function handleElementClick(element: Element) {
    selected = element.name
    if(onselect) {
      onselect({
        detail: {
          element
        }
      })
    }
  }

  function handleElementMouseover(element: Element) {
    focused = element.name
    if(onfocus) {
      onfocus({
        detail: {
          element
        }
      })
    }
  }

  onMount(() => {
    keyboarder.on(handleKeypress)

    return () => {
      keyboarder.off(handleKeypress)
    }
  })

  function handleIconClick(index: number, element: Element) {
    if(oniconClick) {
      oniconClick({
        detail: {
          element,
          index
        }
      })
    }
  }

</script>

<ul
  class="list"
  role="listbox"
>
  {#each elements as element, index (element.name)}
  <div
    role="button"
    tabindex="0"
    onkeypress={() => handleElementClick(element)}
    onmouseover={() => handleElementMouseover(element)}
    onfocus={() => handleElementMouseover(element)}
    onclick={() => handleElementClick(element)}
  >
    <li
      class="element"
      class:bicolor
      class:focused={focused == element.name}
      class:disabled={element.disabled}
      class:selected={selected == element.name}
      style:color={element.style?.color}
      style:background-color={element.style?.backgroundColor}
    >
      {#if elementSnippet}
        {@render elementSnippet({ 
          focused: focused == element.name,
          selected: selected == element.name
        })}
      {:else}
        {#if !!element.icon}
          <Icon
            name={element.icon}
          ></Icon>
        {/if}
        <div class="title-description-container" class:centered>
          <div class="title">
            {#if titleSnippet}
              {@render titleSnippet({ 
                focused: focused == element.name,
                selected: selected == element.name,
                element
              })}
            {:else}
              {element.title}
            {/if}
          </div>
          {#if !!element.description}
            <div class="description">
              {#if descriptionSnippet}
                {@render descriptionSnippet({ 
                  focused: focused == element.name,
                  selected: selected == element.name,
                  element
                })}
              {:else}
                {element.description || ''}
              {/if}
            </div>
          {/if}
        </div>
        {#if !!element.appendIcon}
          <div
            role="button"
            tabindex="0"
            class="append"
            onclick={(e) => {
              e.stopPropagation()
              handleIconClick(index, element)
            }}
            {onkeypress}
          >
            <Icon
              name={element.appendIcon}
              --icon-size={appendIconSize}
            ></Icon>
          </div>
        {/if}
      {/if}
    </li>
  </div>
  {/each}
</ul>

<style>
  .list {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: var(
      --selectable-vertical-list-padding,
      var(--selectable-vertical-list-default-padding)
    );
    height: var(
      --selectable-vertical-list-height,
      var(--selectable-vertical-list-default-height)
    );
    max-height: var(
      --selectable-vertical-list-max-height,
      var(--selectable-vertical-list-default-max-height)
    );
    min-height: var(
      --selectable-vertical-list-min-height,
      var(--selectable-vertical-list-default-min-height)
    );
    width: var(
      --selectable-vertical-list-width,
      var(--selectable-vertical-list-default-width)
    );
    max-width: var(
      --selectable-vertical-list-max-width,
      var(--selectable-vertical-list-default-max-width)
    );
    min-width: var(
      --selectable-vertical-list-min-width,
      var(--selectable-vertical-list-default-min-width)
    );
  }

  .title {
    font-size: var(
      --selectable-vertical-list-title-font-size,
      var(--selectable-vertical-list-default-title-font-size)
    );
  }

  .description {
    font-size: var(
      --selectable-vertical-list-description-font-size,
      var(--selectable-vertical-list-default-description-font-size)
    );
    margin-top: 0.2rem;
  }

  .bicolor:nth-child(even) {
    background-color: var(
      --selectable-vertical-list-focus-background-color,
      var(--selectable-vertical-list-default-focus-background-color)
    );
    color: var(
      --selectable-vertical-list-focus-color,
      var(--selectable-vertical-list-default-focus-color)
    )
  }

  .element {
    position: relative;
    padding: var(
      --selectable-vertical-list-element-padding,
      var(--selectable-vertical-list-default-element-padding)
    );
    cursor: var(
      --selectable-vertical-list-element-cursor,
      var(--selectable-vertical-list-default-element-cursor)
    );
    border-radius: var(
      --selectable-vertical-list-element-border-radius,
      var(--selectable-vertical-list-default-element-border-radius)
    );
    height: var(
      --selectable-vertical-list-element-height,
      var(--selectable-vertical-list-default-element-height)
    );
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 10px;
    -webkit-tap-highlight-color: transparent;
  }

  .title-description-container {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
  }

  .element.focused {
    background-color: var(
      --selectable-vertical-list-focus-background-color,
      var(--selectable-vertical-list-default-focus-background-color)
    );
    color: var(
      --selectable-vertical-list-focus-color,
      var(--selectable-vertical-list-default-focus-color)
    )
  }

  .element.selected {
    background-color: var(
      --selectable-vertical-list-selection-background-color,
      var(--selectable-vertical-list-default-selection-background-color)
    );
    color: var(
      --selectable-vertical-list-selection-color,
      var(--selectable-vertical-list-default-selection-color)
    );
  }

  .element.disabled {
    pointer-events: none;
    opacity: 0.5;
  }


  .centered {
    width: 100%;
    text-align: center;
  }

  .append {
    padding: 10px 20px 10px 20px;
    position: absolute;
    right: 0;
  }

</style>