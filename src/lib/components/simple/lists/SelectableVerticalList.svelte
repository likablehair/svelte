<script lang="ts" context="module">
  export type Element = {
    title: string | number,
    name: string | number,
    description?: string,
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    data?: any;
  };
</script>

<script lang="ts">
  import keyboarder from "$lib/utils/keyboarder";
  import { createEventDispatcher, onMount } from "svelte";

  export let activeKeyboard: boolean = false,
    loopSelection: boolean = true,
    focused: string | number | undefined = undefined,
    selected: string | number | undefined = undefined,
    elements: Element[] = []

  let dispatch = createEventDispatcher<{
    'select': {
      element: Element
    },
    'focus': {
      element: Element
    }
  }>()

  $: selectedIndex = elements.findIndex((el) => el.name == selected)
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
</script>

<ul
  class="list"
  role="listbox"
>
  {#each elements as element, index (element.name)}
    <li
      class="element"
      class:focused={focused == element.name}
      aria-selected={selected == element.name}
      on:mouseover={() => handleElementMouseover(element)}
      on:focus={() => handleElementMouseover(element)}
      on:click={() => handleElementClick(element)}
      on:keypress={() => handleElementClick(element)}
    >
      <slot 
        name="element"
        focused={focused == element.name}
        selected={selected == element.name}
      >
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
      </slot>
    </li>
  {/each}
</ul>

<style>
  .list {
    --selectable-vertical-list-default-element-padding: .75rem 1rem .75rem 1rem;
    --selectable-vertical-list-default-element-cursor: pointer;
    --selectable-vertical-list-default-selection-background-color: rgb(var(--global-color-background-300));
    --selectable-vertical-list-default-selection-color: inherit;
    --selectable-vertical-list-default-focus-background-color: rgb(var(--global-color-background-300), .5);
    --selectable-vertical-list-default-focus-color: inherit;
    --selectable-vertical-list-default-element-border-radius: 0px;
    --selectable-vertical-list-default-padding: 0px;

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
    font-size: 1.1rem;
  }

  .description {
    font-size: .875rem;
    margin-top: 0.2rem;

  }

  .element {
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
</style>