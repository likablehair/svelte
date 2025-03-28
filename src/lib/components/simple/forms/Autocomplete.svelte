<script context="module" lang="ts">
  export type Item = {
    value: string | number;
    label?: string | number;
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    data?: any;
  };
</script>

<script lang="ts">
  import '../../../css/main.css'
  import './Autocomplete.css'
  import { scrollInMenu } from '../common/scroller';

  let clazz: {
    activator?: string,
    menu?: string,
    simpleTextfield?: ComponentProps<SimpleTextField>['class']
  } = {};
	export { clazz as class };

  export let values: Item[] = [],
    items: Item[],
    searchFunction: ((item: Item, searchText: string | undefined) => boolean) | undefined =
      undefined,
    multiple = false,
    disabled = false,
    mandatory = false,
    placeholder = "",
    width = "auto",
    height = "auto",
    maxWidth: string | undefined = undefined,
    minWidth: string | undefined = "200px",
    openingId: string = "autocomplete-menu",
    searchText: string | undefined = undefined,
    maxVisibleChips: number | undefined = undefined,
    menuOpened: boolean = false,
    closeOnSelect: boolean = !multiple,
    emptySearchTextOnMenuClose: boolean = true,
    // menu
    menuBoxShadow = "rgb(var(--global-color-background-300), .5) 0px 2px 4px",
    menuBorderRadius = "5px",
    mobileDrawer: boolean = false,
    menuWidth: string | undefined | null = undefined

  let dispatch = createEventDispatcher<{
    change: {
      unselect: Item | undefined;
      select: Item | undefined;
      selection: Item[];
    }
  }>();

  function select(item: Item) {
    if(disabled) return

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

    if (!multiple && closeOnSelect) menuOpened = false
  }

  function unselect(item: Item) {
    if(disabled) return

    if(values.length == 1 && mandatory) return
    values = values.filter((i) => i.value != item.value);
    refreshMenuWidth();

    dispatch("change", {
      unselect: item,
      select: undefined,
      selection: values,
    });
  }

  function pop() {
    if(values.length == 1 && mandatory) return
    let poppedElement = values.pop()
    values = [...values]
    refreshMenuWidth()

    dispatch("change", {
      unselect: poppedElement,
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

  let localMenuWidth: string | undefined | null = undefined,
    menuHeight = "auto",
    refreshPosition = false;

  function openMenu() {
    refreshMenuWidth();
    menuOpened = true;
  }

  function refreshMenuWidth() {
    setTimeout(() => {
      if(menuWidth !== undefined) localMenuWidth = menuWidth
      else localMenuWidth = activator.offsetWidth + "px"

      setTimeout(() => {
        refreshPosition = true;
      }, 1);
    }, 1);
  }

  let activator: HTMLElement,
    focusedIndex: number | undefined = undefined;
  function handleTextFieldFocus() {
    if(disabled) return
    focusedIndex = undefined;
    openMenu();
  }

  function handleTextFieldBlur() {
    // closeMenu()
  }

  let menuElement: HTMLElement;
  function handleKeyDown(event: { key: string }) {
    if(disabled) return

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
    } else if(event.key == 'Backspace' && searchText == '') {
      pop()
    } else if(event.key == 'Escape' || event.key == 'Tab') {
      searchText = ''
      if(!!input) input.blur()
      menuOpened = false
    }

    if(focusedIndex !== undefined && !!menuElement) {
      let child = menuElement.querySelector<HTMLElement>('.item-' + focusedIndex)

      if(!!child) scrollInMenu(menuElement, child, 'instant')
    }
  }

  let input: HTMLElement;
  function handleContainerClick() {
    if(disabled) return
    
    if (!menuOpened) {
      if(!!input) input.focus();

      // had to timeout because it was catching click outside
      setTimeout(() => {
        openMenu();
      }, 50);
    }
  }

  let filteredItems: Item[] = items;
  $: if (searchText) {
    focusedIndex = undefined;
    filteredItems = items.filter((it) => {
      if (searchFunction) return searchFunction(it, searchText);
      else return !!searchText && it.label?.toString().toLowerCase().includes((searchText).toLowerCase());
    });
  } else {
    filteredItems = items;
  }

  $: notVisibleChipNumber = Math.max((values?.length || 0) - (maxVisibleChips || 0), 0)

  $: if(!menuOpened && emptySearchTextOnMenuClose) {
    setTimeout(() => {
      if(!menuOpened && emptySearchTextOnMenuClose) searchText = undefined
    }, 10);
  }

  $: if(!!input) {
    if(!disabled && values.length != 0) {
      input.style.width = Math.max(searchText?.length || placeholder?.length, 1) + 'ch'
    } else {
      input.style.width = 'auto'
    }
  }

  import Chip from "$lib/components/simple/navigation/Chip.svelte";
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import { createEventDispatcher, type ComponentProps } from "svelte";
  import SimpleTextField from "./SimpleTextField.svelte";
  import MenuOrDrawer from '$lib/components/composed/common/MenuOrDrawer.svelte';
</script>

<svelte:window />

<div
  bind:this={activator}
  style:width
  style:max-width={maxWidth}
  style:min-width={minWidth}
  style:height
  style:opacity={disabled ? "50%" : "100%"}
  on:click={handleContainerClick}
  on:keypress={handleContainerClick}
  class={clazz.activator || ''}
  role="button"
  tabindex="0"
>
  <slot name="selection-container" {values} {searchText} {disabled} {openMenu} {handleKeyDown} {unselect} {select}>
    <div
      class="selection-container"
    >
      {#each (values || []).slice(0, maxVisibleChips) as selection}
        <slot name="selection" {selection} {unselect} >
          <div tabindex="-1">
            <Chip
              close={true}
              on:close={() => unselect(selection)}
              --chip-default-border-radius="var(--autocomplete-border-radius, var(--autocomplete-default-border-radius))"
              buttonTabIndex={-1}
              truncateText
            >
              <slot name="chip-label" {selection}>
                {selection.label}
              </slot>
            </Chip>
          </div>
        </slot>
      {/each}
      {#if maxVisibleChips !== undefined && notVisibleChipNumber > 0}
        <slot name="exceedCounter" {notVisibleChipNumber} {maxVisibleChips} {values} {searchText} {disabled}>
          <div class="not-visible-chip-number">+ {notVisibleChipNumber}</div>
        </slot>
      {/if}

      <input
        class="autocomplete-input"
        bind:value={searchText}
        on:focus={handleTextFieldFocus}
        on:focus
        on:blur={handleTextFieldBlur}
        on:blur
        on:keydown={handleKeyDown}
        on:keydown
        {disabled}
        placeholder={placeholder}
        bind:this={input}
      />
    </div>
  </slot>
</div>

{#key searchText}
  <slot name="menu">
    {#if !mobileDrawer}
      <Menu
        {activator}
        _width={localMenuWidth || ""}
        _height={menuHeight}
        _maxHeight="300px"
        _boxShadow={menuBoxShadow}
        _borderRadius={menuBorderRadius}
        bind:open={menuOpened}
        anchor="bottom-center"
        closeOnClickOutside
        bind:refreshPosition
        bind:menuElement
        bind:openingId={openingId}
        flipOnOverflow
      >
        <ul
          class={clazz.menu || ''}
          style:background-color="rgb(var(--global-color-background-100))"
        >
          {#each filteredItems as item, index}
            <li class="item-{index}">
              <slot
                name="item"
                {item}
                {index}
                selected={(values || []).findIndex((i) => {
                  return i.value == item.value;
                }) != -1}
              >
                <div
                  class:selection-item={true}
                  class:focused={index == focusedIndex}
                  class:selected={(values || []).findIndex((i) => {
                    return i.value == item.value;
                  }) != -1}
                  on:click={() => toggle(item)}
                  on:keypress={() => toggle(item)}
                  role="button"
                  tabindex="0"
                >
                  <slot name="item-label" {item}>
                    {item.label}
                  </slot>
                </div>
              </slot>
            </li>
          {/each}
        </ul>
      </Menu>
    {:else}
      <MenuOrDrawer
        {activator}
        _width={localMenuWidth || ""}
        _height={menuHeight}
        _maxHeight="300px"
        _boxShadow={menuBoxShadow}
        _borderRadius={menuBorderRadius}
        bind:open={menuOpened}
        on:close
      >
        <ul
          class={clazz.menu || ''}
          style:background-color="rgb(var(--global-color-background-100))"
        >
          {#each filteredItems as item, index}
            <li class="item-{index}">
              <slot
                name="item"
                {item}
                {index}
                selected={(values || []).findIndex((i) => {
                  return i.value == item.value;
                }) != -1}
              >
                <div
                  class:selection-item={true}
                  class:focused={index == focusedIndex}
                  class:selected={(values || []).findIndex((i) => {
                    return i.value == item.value;
                  }) != -1}
                  on:click={() => toggle(item)}
                  on:keypress={() => toggle(item)}
                  role="button"
                  tabindex="0"
                >
                  <slot name="item-label" {item}>
                    {item.label}
                  </slot>
                </div>
              </slot>
            </li>
          {/each}
        </ul>
      </MenuOrDrawer>
    {/if}
  </slot>
{/key}

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .selection-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    border: var(
      --autocomplete-border,
      var(--autocomplete-default-border)
    );
    background-color: var(
      --autocomplete-background-color,
      var(--autocomplete-default-background-color)
    );
    border-radius: var(
      --autocomplete-border-radius,
      var(--autocomplete-default-border-radius)
    );
    padding: var(
      --autocomplete-padding,
      var(--autocomplete-default-padding)
    );
    min-height: var(
      --autocomplete-min-height,
      var(--autocomplete-default-min-height)
    );
    transition: all .1s;
  }

  .selection-container:focus-within {
    border: var(
      --autocomplete-focus-border,
      var(
        --autocomplete-default-focus-border,
        var(
          --autocomplete-border,
          var(--autocomplete-default-border)
        )
      )
    );
    box-shadow: var(
      --autocomplete-focus-box-shadow,
      var(--autocomplete-default-focus-box-shadow)
    );
  }

  .selection-item {
    padding: 10px;
    max-width: var(--autocomplete-options-max-width, var(--autocomplete-default-options-max-width));
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  .selection-item.selected {
    background-color: var(
      --autocomplete-selected-item-background-color,
      var(--autocomplete-default-selected-item-background-color)
    );
    color: var(
      --autocomplete-selected-item-color,
      var(--autocomplete-default-selected-item-color)
    );
  }

  .selection-item.focused:not(.selected) {
    background-color: var(
      --autocomplete-focused-item-background-color,
      var(--autocomplete-default-focused-item-background-color)
    );
    color: var(
      --autocomplete-focused-item-color,
      var(--autocomplete-default-focused-item-color)
    );
  }

  .selection-item:hover:not(.selected):not(.focused) {
    background-color: var(
      --autocomplete-hover-item-background-color,
      var(--autocomplete-default-hover-item-background-color)
    );
    color: var(
      --autocomplete-hover-item-color,
      var(--autocomplete-default-hover-item-color)
    );
  }

  .not-visible-chip-number {
    opacity: 50%;
    cursor: pointer;
  }

  .autocomplete-input {
    background-color: rgb(1, 1, 1, 0);
    margin-left: var(
      --autocomplete-input-margin-left,
      var(--autocomplete-default-input-margin-left)
    );
    outline: none;
    border: none;
    color: inherit;
  }
</style>
