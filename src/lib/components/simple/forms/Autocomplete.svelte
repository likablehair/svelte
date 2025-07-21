<script module lang="ts">
  export type Item<Data = any> = {
    value: string | number;
    label?: string | number;
    data?: Data;
  };
</script>

<script lang="ts" generics="Data">
  import "../../../css/main.css";
  import "./Autocomplete.css";
  import { scrollInMenu } from "../common/scroller";

  type ItemData = Item<Data>;
  interface Props {
    values?: ItemData[];
    items?: ItemData[];
    searchFunction?: (
      item: ItemData,
      searchText: string | undefined,
    ) => boolean;
    multiple?: boolean;
    disabled?: boolean;
    mandatory?: boolean;
    placeholder?: string;
    width?: string;
    height?: string;
    maxWidth?: string;
    minWidth?: string;
    openingId?: string;
    searchText?: string;
    maxVisibleChips?: number;
    menuOpened?: boolean;
    closeOnSelect?: boolean;
    emptySearchTextOnMenuClose?: boolean;
    menuBoxShadow?: string;
    menuBorderRadius?: string;
    mobileDrawer?: boolean;
    menuWidth?: string | null;
    menuAnchor?: ComponentProps<typeof Menu>['anchor']
    class?: {
      activator?: string;
      menu?: string;
      simpleTextfield?: ComponentProps<typeof SimpleTextField>["class"];
    };
    selectionContainerSnippet?: Snippet<
      [
        {
          values: ItemData[];
          searchText: string | undefined;
          disabled: boolean;
          openMenu: () => void;
          handleKeyDown: (event: { key: string }) => void;
          unselect: (item: ItemData) => void;
          select: (item: ItemData) => void;
        },
      ]
    >;
    selectionSnippet?: Snippet<
      [
        {
          selection: ItemData;
          unselect: (item: ItemData) => void;
        },
      ]
    >;
    chipLabelSnippet?: Snippet<
      [
        {
          selection: ItemData;
        },
      ]
    >;
    exceedCounterSnippet?: Snippet<
      [
        {
          notVisibleChipNumber: number;
          maxVisibleChips: number;
          values: ItemData[];
          searchText: string | undefined;
          disabled: boolean;
        },
      ]
    >;
    menuSnippet?: Snippet<[]>;
    itemLabelSnippet?: Snippet<
      [
        {
          item: ItemData;
        },
      ]
    >;
    itemSnippet?: Snippet<
      [
        {
          item: ItemData;
          index: number;
          selected: boolean;
        },
      ]
    >;
    onchange?: (event: {
      detail: {
        unselect: ItemData | undefined;
        select: ItemData | undefined;
        selection: ItemData[];
      };
    }) => void;
    onfocus?: () => void;
    onblur?: () => void;
    onkeydown?: () => void;
    onclose?: ComponentProps<typeof MenuOrDrawer>["onclose"];
  }

  let {
    values = $bindable(),
    items = [],
    searchFunction = undefined,
    multiple = false,
    disabled = false,
    mandatory = false,
    placeholder = "",
    width = "auto",
    height = "auto",
    maxWidth = undefined,
    minWidth = "200px",
    openingId = $bindable("autocomplete-menu"),
    searchText = $bindable(),
    maxVisibleChips = undefined,
    menuOpened = $bindable(false),
    closeOnSelect = !multiple,
    emptySearchTextOnMenuClose = true,
    menuBoxShadow = "rgb(var(--global-color-background-300), .5) 0px 2px 4px",
    menuBorderRadius = "5px",
    mobileDrawer = false,
    menuWidth = undefined,
    menuAnchor = 'bottom-center',
    class: clazz = {},
    selectionContainerSnippet,
    selectionSnippet,
    chipLabelSnippet,
    exceedCounterSnippet,
    menuSnippet,
    itemLabelSnippet,
    itemSnippet,
    onchange,
    onfocus,
    onblur,
    onkeydown,
    onclose,
  }: Props = $props();

  let notVisibleChipNumber = $derived(
    Math.max(((values || []).length || 0) - (maxVisibleChips || 0), 0),
  );

  function select(item: ItemData) {
    if (disabled) return;

    const alreadyPresent =
      (values || []).findIndex((i) => i.value === item.value) !== -1;

    if (!alreadyPresent) {
      if (multiple) values = [...(values || []), item];
      else values = [item];
      refreshMenuWidth();

      if (onchange) {
        onchange({
          detail: {
            unselect: undefined,
            select: item,
            selection: values,
          },
        });
      }
    }

    if (!multiple && closeOnSelect) menuOpened = false;
  }

  function unselect(item: ItemData) {
    if (disabled) return;

    if (!!values && values.length == 1 && mandatory) return;
    values = (values || []).filter((i) => i.value != item.value);
    refreshMenuWidth();

    if (onchange) {
      onchange({
        detail: {
          unselect: item,
          select: undefined,
          selection: values || [],
        },
      });
    }
  }

  function pop() {
    if (!!values && values.length == 1 && mandatory) return;
    let poppedElement = (values || []).pop();
    values = [...(values || [])];
    refreshMenuWidth();

    if (onchange) {
      onchange({
        detail: {
          unselect: poppedElement,
          select: undefined,
          selection: values,
        },
      });
    }
  }

  function toggle(item: ItemData) {
    const alreadyPresent =
      (values || []).findIndex((i) => i.value === item.value) != -1;

    if (alreadyPresent) unselect(item);
    else select(item);
  }

  let localMenuWidth: string | undefined | null = $state(undefined),
    menuHeight = "auto",
    refreshPosition = $state(false);

  function openMenu() {
    refreshMenuWidth();
    menuOpened = true;
  }

  function refreshMenuWidth() {
    setTimeout(() => {
      if (menuWidth !== undefined) localMenuWidth = menuWidth;
      else if (!!activator) localMenuWidth = activator.offsetWidth + "px";

      setTimeout(() => {
        refreshPosition = true;
      }, 1);
    }, 1);
  }

  let activator: HTMLElement | undefined = $state(),
    focusedIndex: number | undefined = $state(undefined);
  function handleTextFieldFocus() {
    if (onfocus) {
      onfocus();
    }

    if (disabled) return;
    focusedIndex = undefined;
    openMenu();
  }

  function handleTextFieldBlur() {
    if (onblur) {
      onblur();
    }
    // closeMenu()
  }

  let menuElement: HTMLElement | undefined = $state();
  function handleKeyDown(event: { key: string }) {
    if (onkeydown) {
      onkeydown();
    }

    if (disabled) return;

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
    } else if (event.key == "Backspace" && searchText == "") {
      pop();
    } else if (event.key == "Escape" || event.key == "Tab") {
      searchText = "";
      if (!!input) input.blur();
      menuOpened = false;
    }

    if (focusedIndex !== undefined && !!menuElement) {
      let child = menuElement.querySelector<HTMLElement>(
        ".item-" + focusedIndex,
      );

      if (!!child) scrollInMenu(menuElement, child, "instant");
    }
  }

  let input: HTMLElement | undefined = $state();
  function handleContainerClick() {
    if (disabled) return;

    if (!menuOpened) {
      if (!!input) input.focus();

      // had to timeout because it was catching click outside
      setTimeout(() => {
        openMenu();
      }, 50);
    }
  }

  let filteredItems: ItemData[] = $state(items);
  $effect(() => {
    if (searchText) {
      focusedIndex = undefined;
      filteredItems = items.filter((it) => {
        if (searchFunction) return searchFunction(it, searchText);
        else
          return (
            !!searchText &&
            it.label
              ?.toString()
              .toLowerCase()
              .includes(searchText.toLowerCase())
          );
      });
    } else {
      filteredItems = items;
    }
  });

  $effect(() => {
    if (!menuOpened && emptySearchTextOnMenuClose) {
      setTimeout(() => {
        if (!menuOpened && emptySearchTextOnMenuClose) searchText = undefined;
      }, 10);
    }
  });

  $effect(() => {
    if (!!input) {
      if (!disabled && (values || []).length !== 0) {
        input.style.width =
          Math.max(searchText?.length || placeholder?.length, 1) + "ch";
      } else {
        input.style.width = "auto";
      }
    }
  });

  import Chip from "$lib/components/simple/navigation/Chip.svelte";
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import { type ComponentProps, type Snippet } from "svelte";
  import SimpleTextField from "./SimpleTextField.svelte";
  import MenuOrDrawer from "$lib/components/composed/common/MenuOrDrawer.svelte";
</script>

<svelte:window />

<div
  bind:this={activator}
  style:width
  style:max-width={maxWidth}
  style:min-width={minWidth}
  style:height
  style:opacity={disabled ? "50%" : "100%"}
  onclick={handleContainerClick}
  onkeypress={handleContainerClick}
  class={clazz.activator || ""}
  role="button"
  tabindex="0"
>
  {#if selectionContainerSnippet}
    {@render selectionContainerSnippet({
      values: values || [],
      searchText,
      disabled,
      openMenu,
      handleKeyDown,
      unselect,
      select,
    })}
  {:else}
    <div class="selection-container">
      {#each (values || []).slice(0, maxVisibleChips) as selection}
        {#if selectionSnippet}
          {@render selectionSnippet({ selection, unselect })}
        {:else}
          <div tabindex="-1">
            <Chip
              close={true}
              onclose={() => unselect(selection)}
              --chip-default-border-radius="var(--autocomplete-border-radius, var(--autocomplete-default-border-radius))"
              buttonTabIndex={-1}
              truncateText
            >
              {#if chipLabelSnippet}
                {@render chipLabelSnippet({ selection })}
              {:else}
                {selection.label}
              {/if}
            </Chip>
          </div>
        {/if}
      {/each}
      {#if maxVisibleChips !== undefined && notVisibleChipNumber > 0}
        {#if exceedCounterSnippet}
          {@render exceedCounterSnippet({
            notVisibleChipNumber,
            maxVisibleChips,
            values: values || [],
            searchText,
            disabled,
          })}
        {:else}
          <div class="not-visible-chip-number">+ {notVisibleChipNumber}</div>
        {/if}
      {/if}

      <input
        class="autocomplete-input"
        bind:value={searchText}
        onfocus={handleTextFieldFocus}
        onblur={handleTextFieldBlur}
        onkeydown={handleKeyDown}
        {disabled}
        {placeholder}
        bind:this={input}
      />
    </div>
  {/if}
</div>

{#key searchText}
  {#if menuSnippet}
    {@render menuSnippet()}
  {:else if !mobileDrawer}
    <Menu
      {activator}
      _width={localMenuWidth || ""}
      _height={menuHeight}
      _maxHeight="300px"
      _boxShadow={menuBoxShadow}
      _borderRadius={menuBorderRadius}
      bind:open={menuOpened}
      anchor={menuAnchor}
      closeOnClickOutside
      bind:refreshPosition
      bind:menuElement
      bind:openingId
      flipOnOverflow
    >
      <ul
        class={clazz.menu || ""}
        style:background-color="rgb(var(--global-color-background-100))"
      >
        {#each filteredItems as item, index}
          <li class="item-{index}">
            {#if itemSnippet}
              {@render itemSnippet({
                item,
                index,
                selected:
                  (values || []).findIndex((i) => {
                    return i.value == item.value;
                  }) != -1,
              })}
            {:else}
              <div
                class:selection-item={true}
                class:focused={index == focusedIndex}
                class:selected={(values || []).findIndex((i) => {
                  return i.value == item.value;
                }) != -1}
                onclick={() => toggle(item)}
                onkeypress={() => toggle(item)}
                role="button"
                tabindex="0"
              >
                {#if itemLabelSnippet}
                  {@render itemLabelSnippet({ item })}
                {:else}
                  {item.label}
                {/if}
              </div>
            {/if}
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
      {onclose}
    >
      <ul
        class={clazz.menu || ""}
        style:background-color="rgb(var(--global-color-background-100))"
      >
        {#each filteredItems as item, index}
          <li class="item-{index}">
            {#if itemSnippet}
              {@render itemSnippet({
                item,
                index,
                selected:
                  (values || []).findIndex((i) => {
                    return i.value == item.value;
                  }) != -1,
              })}
            {:else}
              <div
                class:selection-item={true}
                class:focused={index == focusedIndex}
                class:selected={(values || []).findIndex((i) => {
                  return i.value == item.value;
                }) != -1}
                onclick={() => toggle(item)}
                onkeypress={() => toggle(item)}
                role="button"
                tabindex="0"
              >
                {#if itemLabelSnippet}
                  {@render itemLabelSnippet({ item })}
                {:else}
                  {item.label}
                {/if}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </MenuOrDrawer>
  {/if}
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
    border: var(--autocomplete-border, var(--autocomplete-default-border));
    background-color: var(
      --autocomplete-background-color,
      var(--autocomplete-default-background-color)
    );
    border-radius: var(
      --autocomplete-border-radius,
      var(--autocomplete-default-border-radius)
    );
    padding: var(--autocomplete-padding, var(--autocomplete-default-padding));
    min-height: var(
      --autocomplete-min-height,
      var(--autocomplete-default-min-height)
    );
    transition: all 0.1s;
  }

  .selection-container:focus-within {
    border: var(
      --autocomplete-focus-border,
      var(
        --autocomplete-default-focus-border,
        var(--autocomplete-border, var(--autocomplete-default-border))
      )
    );
    box-shadow: var(
      --autocomplete-focus-box-shadow,
      var(--autocomplete-default-focus-box-shadow)
    );
  }

  .selection-item {
    padding: 10px;
    max-width: var(
      --autocomplete-options-max-width,
      var(--autocomplete-default-options-max-width)
    );
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
