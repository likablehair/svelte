<script context="module" lang="ts">
  export type Item = {
    value: string;
    label?: string;
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    data?: any;
  };

  import type { VariantOptions } from "./Textfield.svelte";
</script>

<script lang="ts">
  export let values: Item[] = [],
    items: Item[],
    searchFunction: ((item: Item, searchText: string) => boolean) | undefined =
      undefined,
    multiple = false,
    disabled = false,
    width = "auto",
    height = "auto",
    maxWidth: string | undefined = undefined,
    // textfield
    textFieldLabel = "",
    textFieldPlaceholder = "",
    textFieldColor: string | null = null,
    textFieldVariant: VariantOptions = "boxed",
    textFieldMaxWidth = "min(100px, 90%)",
    textFieldMinWidth: string | undefined = undefined,
    textFieldHeight = "auto",
    textFieldTextColor = "black",
    textFieldBorderWeight = "2px",
    textFieldBorderRadius = "5px",
    textFieldBorderColor: string | null = null,
    textFieldFocusBorderColor: string | null = null,
    textFieldFocusedBoxShadow: string | undefined = undefined,
    textFieldBackgroundColor: string | null = null,
    textFieldPadding: string | undefined = undefined,
    textFieldPaddingLeft: string | undefined = undefined,
    textFieldPaddingRight: string | undefined = undefined,
    textFieldPaddingBottom: string | undefined = undefined,
    textFieldPaddingTop: string | undefined = undefined,
    textFieldFontSize: string | undefined = undefined,
    // menu
    menuBackgroundColor = "#FFF",
    menuBoxShadow = "rgba(149, 157, 165, 0.2) 0px 8px 24px",
    menuBorderRadius = "5px",
    focusItemBackgroundColor = "#EEEEEE",
    selectedItemBackgroundColor = "#D0D0D0",
    border = "1px solid black",
    borderRadius = "5px",
    chipColor = "#D0D0D0",
    chipTextColor = "black",
    chipHeight = "30px";

  let dispatch = createEventDispatcher<{
    change: {
      unselect: Item | undefined;
      select: Item | undefined;
      selection: Item[];
    };
  }>();

  function select(item: Item) {
    const alreadyPresent =
      values.findIndex((i) => i.value === item.value) != -1;
    if (!alreadyPresent) {
      if (multiple) values = [...values, item];
      else values = [item];
      refreshMenuWidth();

      dispatch("change", {
        unselect: undefined,
        select: item,
        selection: values,
      });
    }
  }

  function unselect(item: Item) {
    values = values.filter((i) => i.value != item.value);
    refreshMenuWidth();

    dispatch("change", {
      unselect: item,
      select: undefined,
      selection: values,
    });
  }

  function toggle(item: Item) {
    const alreadyPresent =
      values.findIndex((i) => i.value === item.value) != -1;

    if (alreadyPresent) unselect(item);
    else select(item);
  }

  let menuWidth: string | undefined = undefined,
    menuHeight = "auto",
    menuOpened = false,
    refreshPosition = false;
  function openMenu() {
    refreshMenuWidth();
    menuOpened = true;
  }

  function refreshMenuWidth() {
    menuWidth = activator.offsetWidth + "px";
    refreshPosition = true;
  }

  let activator: HTMLElement,
    focusedIndex: number | undefined = undefined;
  function handleTextFieldFocus() {
    focusedIndex = undefined;
    openMenu();
  }

  function handleTextFieldBlur() {
    // closeMenu()
  }

  let menuElement: HTMLElement;
  function handleWindowKeyDown(event: KeyboardEvent) {
    if (
      event.key == "ArrowDown" &&
      (focusedIndex === undefined || focusedIndex < filteredItems.length - 1)
    ) {
      if (focusedIndex === undefined) focusedIndex = 0;
      else focusedIndex += 1;
    } else if (
      event.key == "ArrowUp" &&
      (focusedIndex === undefined || focusedIndex > 0)
    ) {
      if (focusedIndex === undefined) focusedIndex = filteredItems.length - 1;
      else focusedIndex -= 1;
    } else if (event.key == "Enter" && focusedIndex != undefined) {
      toggle(filteredItems[focusedIndex]);
    }
  }

  let input: HTMLElement;
  function handleContainerClick() {
    if (!menuOpened) {
      input.focus();

      // had to timeout because it was catching click outside
      setTimeout(() => {
        openMenu();
      }, 50);
    }
  }

  let searchText: string,
    filteredItems: Item[] = items;
  $: if (searchText) {
    focusedIndex = undefined;
    filteredItems = items.filter((it) => {
      if (searchFunction) return searchFunction(it, searchText);
      else return it.label?.toLowerCase().includes(searchText.toLowerCase());
    });
  } else {
    filteredItems = items;
  }

  import Textfield from "$lib/forms/Textfield.svelte";
  import Chip from "$lib/navigation/Chip.svelte";
  import Menu from "$lib/common/Menu.svelte";
  import { createEventDispatcher } from "svelte";
</script>

<svelte:window />

<div
  bind:this={activator}
  style:width
  style:max-width={maxWidth}
  style:height
  style:opacity={disabled ? "50%" : "100%"}
  on:click={handleContainerClick}
  on:keypress={handleContainerClick}
>
  <slot name="selection-container">
    <div
      class="selection-container"
      style:border
      style:border-radius={borderRadius}
    >
      {#each values as selection}
        <slot name="selection" {selection}>
          <div style:height={chipHeight}>
            <Chip
              color={chipColor}
              textColor={chipTextColor}
              close={true}
              label={true}
              on:close={() => unselect(selection)}>{selection.label}</Chip
            >
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
        minWidth={textFieldMinWidth}
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
        {disabled}
        on:focus={handleTextFieldFocus}
        on:blur={handleTextFieldBlur}
        on:keydown={handleWindowKeyDown}
        bind:inputElement={input}
      />
    </div>
  </slot>
</div>

<slot name="menu">
  <Menu
    {activator}
    width={menuWidth || ""}
    height={menuHeight}
    maxHeight="300px"
    boxShadow={menuBoxShadow}
    borderRadius={menuBorderRadius}
    bind:open={menuOpened}
    anchor="bottom-center"
    closeOnClickOutside
    bind:refreshPosition
    bind:menuElement
  >
    <div style:background-color={menuBackgroundColor}>
      {#each filteredItems as item, index}
        <slot
          name="item"
          {item}
          {index}
          selected={values.findIndex((i) => {
            return i.value == item.value;
          }) != -1}
        >
          <div
            style:--autocomplete-selected-item-background-color={selectedItemBackgroundColor}
            style:--autocomplete-focus-item-background-color={focusItemBackgroundColor}
            class:selection-item={true}
            class:focused={index == focusedIndex}
            class:selected={values.findIndex((i) => {
              return i.value == item.value;
            }) != -1}
            on:click={() => toggle(item)}
            on:keypress={() => toggle(item)}
          >
            {item.label}
          </div>
        </slot>
      {/each}
    </div>
  </Menu>
</slot>

<style>
  .selection-container {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 5px;
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
