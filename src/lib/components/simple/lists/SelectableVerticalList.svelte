<script lang="ts" context="module">
  export type Element = {
    title: string | number,
    name: string | number,
    description?: string,
    icon?: string,
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    data?: any;
    style?: {
      color?: string,
      backgroundColor?: string
    },
    appendIcon?: string
  };
</script>

<script lang="ts">
  import '../../../css/main.css'
  import './SelectableVerticalList.css'
  import keyboarder from "$lib/utils/keyboarder";
  import { createEventDispatcher, onMount } from "svelte";
  import Icon from '../media/Icon.svelte';

  export let activeKeyboard: boolean = false,
    loopSelection: boolean = true,
    focused: string | number | undefined = undefined,
    selected: string | number | undefined = undefined,
    elements: Element[] = [],
    centered: boolean = false,
    bicolor: boolean = false,
    appendIconSize: string = "20pt"

  let dispatch = createEventDispatcher<{
    'select': {
      element: Element
    },
    'focus': {
      element: Element
    },
    'iconClick': {
      index: number,
      element: Element
    }
  }>()

  $: focusedIndex = elements.findIndex((el) => el.name == focused)

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

        if(newIndex !== undefined) dispatch('focus', { element: elements[newIndex] })
      } else if(params.key == 'ArrowUp') {
        let newIndex
        if((focusedIndex === undefined || focusedIndex === -1) || (loopSelection && focusedIndex <= 0)) {
          focused = elements[elements.length - 1].name
          newIndex = elements.length - 1
        } else if(focusedIndex > 0) {
          focused = elements[focusedIndex - 1].name
          newIndex = focusedIndex - 1
        }

        if(newIndex !== undefined) dispatch('focus', { element: elements[newIndex] })
      } else if(params.key == 'Enter' && focusedIndex !== -1) {
        selected = elements[focusedIndex].name
        dispatch('select', { element: elements[focusedIndex] })
      }
    }
  }

  function handleElementClick(element: Element) {
    selected = element.name
    dispatch('select', { element })
  }

  function handleElementMouseover(element: Element) {
    focused = element.name
    dispatch('focus', { element })
  }

  onMount(() => {
    keyboarder.on(handleKeypress)

    return () => {
      keyboarder.off(handleKeypress)
    }
  })

  function handleIconClick(index: number, element: Element) {
    dispatch('iconClick', {
      index,
      element
    })
  }

</script>

<ul
  class="list"
  role="listbox"
>
  {#each elements as element, index (element.name)}
    <li
      class="element"
      class:bicolor
      class:focused={focused == element.name}
      aria-selected={selected == element.name}
      on:mouseover={() => handleElementMouseover(element)}
      on:focus={() => handleElementMouseover(element)}
      on:click={() => handleElementClick(element)}
      on:keypress={() => handleElementClick(element)}
      style:color={element.style?.color}
      style:background-color={element.style?.backgroundColor}
    >
      <slot
        name="element"
        focused={focused == element.name}
        selected={selected == element.name}
      >
        {#if !!element.icon}
          <Icon
            name={element.icon}
          ></Icon>
        {/if}
        <div class="title-description-container" class:centered>
          <div class="title">
            <slot
              name="title"
              focused={focused == element.name}
              selected={selected == element.name}
              element={element}
            >
              {element.title}
            </slot>
          </div>
          {#if !!element.description}
            <div class="description">
              <slot
                name="description"
                focused={focused == element.name}
                selected={selected == element.name}
                element={element}
              >
                {element.description || ''}
              </slot>
            </div>
          {/if}
        </div>
        {#if !!element.appendIcon}
          <div
            class="append"
            on:click|stopPropagation={() => {handleIconClick(index, element)}}
            on:keypress
          >
            <Icon
              name={element.appendIcon}
              --icon-size={appendIconSize}
            ></Icon>
          </div>
        {/if}
      </slot>
    </li>
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

  .element[aria-selected=true] {
    background-color: var(
      --selectable-vertical-list-selection-background-color,
      var(--selectable-vertical-list-default-selection-background-color)
    );
    color: var(
      --selectable-vertical-list-selection-color,
      var(--selectable-vertical-list-default-selection-color)
    )
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