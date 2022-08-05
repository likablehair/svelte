<script context="module" lang="ts">
  export type Item = {
    value: string,
    label?: string,
    data?: any
  }

  import type { VariantOptions } from './Textfield.svelte'
</script>

<script lang="ts">
  import { scrollAtCenter } from "$lib/common/scroller"

  export let values: Item[] = [],
    items: Item[],
    searchFunction: (item: Item, searchText: string) => boolean = undefined,
    multiple: boolean = false,
    width: string = "auto",
    maxWidth: string = undefined,
    // textfield
    textFieldLabel: string = "",
    textFieldPlaceholder: string = "",
    textFieldColor: string = null,
    textFieldValue: string = "",
    textFieldVariant: VariantOptions = 'boxed',
    textFieldMaxWidth: string = "min(100px, 90%)",
    textFieldHeight: string = "auto",
    textFieldTextColor: string = "black",
    textFieldBorderWeight: string = "2px",
    textFieldBorderRadius: string = "5px",
    textFieldBorderColor: string = null,
    textFieldFocusBorderColor: string = null,
    textFieldFocusedBoxShadow: string = undefined,
    textFieldBackgroundColor: string = null,
    textFieldPadding: string = undefined,
    textFieldPaddingLeft: string = undefined,
    textFieldPaddingRight: string = undefined,
    textFieldPaddingBottom: string = undefined,
    textFieldPaddingTop: string = undefined,
    textFieldFontSize: string = undefined,
    menuBackgroundColor: string = "#FFF",
    menuBoxShadow: string = "rgba(149, 157, 165, 0.2) 0px 8px 24px",
    menuBorderRadius: string = "5px",
    focusItemBackgroundColor: string = "#EEEEEE",
    selectedItemBackgroundColor: string = "#D0D0D0",
    border: string = '1px solid black',
    borderRadius: string = '5px',
    chipColor: string = "#D0D0D0",
    chipTextColor: string = "black",
    chipHeight: string = "30px"

  function search(value: string) {

  }

  function select(item: Item) {
    const alreadyPresent = values.findIndex((i) => i.value === item.value) != -1
    if(!alreadyPresent) {
      values = [...values, item]
      refreshMenuWidth()
    }
  }

  function unselect(item: Item) {
    values = values.filter((i) => i.value != item.value)
    refreshMenuWidth()
  }

  function toggle(item: Item) {
    const alreadyPresent = values.findIndex((i) => i.value === item.value) != -1
    if(alreadyPresent) unselect(item)
    else select(item)
  }

  let menuWidth: string = undefined, 
    menuHeight: string = "auto",
    menuOpened: boolean = false,
    refreshPosition: boolean = false
  function openMenu() {
    refreshMenuWidth()
    menuOpened = true
  }

  function closeMenu() {
    menuOpened = false
  }

  function refreshMenuWidth() {
    menuWidth = activator.offsetWidth + 'px'
    refreshPosition = true
  }

  let activator: HTMLElement, focusedIndex: number = undefined
  function handleTextFieldFocus() {
    focusedIndex = undefined
    openMenu()
  }

  function handleTextFieldBlur() { }

  let menuElement: HTMLElement
  function handleWindowKeyDown(event: KeyboardEvent) {
    if(event.key == 'ArrowDown' && (focusedIndex < filteredItems.length - 1 || focusedIndex === undefined)) {
      if(focusedIndex === undefined) focusedIndex = 0
      else focusedIndex += 1

    } else if(event.key == 'ArrowUp' && (focusedIndex > 0 || focusedIndex === undefined)) {
      if(focusedIndex === undefined) focusedIndex = filteredItems.length - 1
      else focusedIndex -= 1
    } else if(event.key == 'Enter' && focusedIndex != undefined) {
      toggle(filteredItems[focusedIndex])
    }
  }

  let input: HTMLElement
  function handleContainerClick() {
    if(!menuOpened) input.focus()
  }

  let searchText: string, filteredItems: Item[] = items
  $: if(!!searchText) {
    focusedIndex = undefined
    filteredItems = items.filter((it) => {
      if(!!searchFunction) return searchFunction(it, searchText)
      else return it.label.toLowerCase().includes(searchText.toLowerCase())
    })
  } else {
    filteredItems = items
  }

  import Textfield from "$lib/forms/Textfield.svelte";
  import Chip from '$lib/navigation/Chip.svelte';
  import Menu from '$lib/common/Menu.svelte';
</script>

<svelte:window></svelte:window>

<div 
  bind:this={activator}
  style:width={width}
  style:max-width={maxWidth}
  on:click={handleContainerClick}
>
  <slot name="selection-container">
    <div 
      class="selection-container"
      style:border={border}
      style:border-radius={borderRadius}
    >
      {#each values as selection}
        <slot name="selection" selection={selection}>
          <div
            style:height={chipHeight}
          >
            <Chip
              color={chipColor}
              textColor={chipTextColor}
              close={true}
              label={true}
              on:close={() => unselect(selection)}
            >{selection.label}</Chip>
          </div>
        </slot>  
      {/each}

      <Textfield
        label={textFieldLabel}
        placeholder={textFieldPlaceholder}
        color={textFieldColor}
        bind:value={searchText}
        variant={textFieldVariant}
        maxWidth={textFieldMaxWidth}
        textColor={textFieldTextColor}
        borderWeight={textFieldBorderWeight}
        borderRadius={textFieldBorderRadius}
        borderColor={textFieldBorderColor}
        focusBorderColor={textFieldFocusBorderColor}
        focusedBoxShadow={textFieldFocusedBoxShadow}
        backgroundColor={textFieldBackgroundColor}
        padding={textFieldPadding}
        paddingLeft={textFieldPaddingLeft}
        paddingRight={textFieldPaddingRight}
        paddingBottom={textFieldPaddingBottom}
        paddingTop={textFieldPaddingTop}
        fontSize={textFieldFontSize}
        height={textFieldHeight}
        on:focus={handleTextFieldFocus}
        on:blur={handleTextFieldBlur}
        on:keydown={handleWindowKeyDown}
        bind:inputElement={input}
      ></Textfield>
    </div>
  </slot>
</div>

<slot name="menu">
  <Menu
    activator={activator}
    width={menuWidth}
    height={menuHeight}
    maxHeight="300px"
    boxShadow={menuBoxShadow}
    borderRadius={menuBorderRadius}
    bind:open={menuOpened}
    anchor="bottom-center"
    closeOnClickOutside
    bind:refreshPosition={refreshPosition}
    bind:menuElement={menuElement}
  >
    <div
      style:background-color={menuBackgroundColor}
    >
      {#each filteredItems as item, index}
        <div
          style:--autocomplete-selected-item-background-color={selectedItemBackgroundColor}
          style:--autocomplete-focus-item-background-color={focusItemBackgroundColor}
          class:selection-item={true}
          class:focused={index == focusedIndex}
          class:selected={values.findIndex((i) => {
            return i.value == item.value
          }) != -1}
          on:click={(event) => toggle(item)}
        >{item.label}</div>
      {/each}
    </div>
  </Menu>
</slot>

<style>
  .selection-container {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 5px
  }

  .selection-item {
    padding: 10px;
  }

  .selection-item.selected {
    background-color: var(--autocomplete-selected-item-background-color);
  }

  .selection-item.focused {
    background-color: var(--autocomplete-focus-item-background-color);
  }

  .selection-item:hover {
    background-color: var(--autocomplete-focus-item-background-color);
  }
</style>