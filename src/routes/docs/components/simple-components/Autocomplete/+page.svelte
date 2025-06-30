<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";

  import Autocomplete, { type Item } from "$lib/components/simple/forms/Autocomplete.svelte";

  let items: Item[] = [
    { value: 'orange', label: 'Orange' },
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'pear', label: 'Pear' },
    { value: 'blackberry', label: 'Blackberry' }
  ]
</script>

<h1>Autocomplete</h1>
<ComponentSubtitle>Autocompletion out of the limits.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div
    style:display="flex"
    style:gap="5px"
  >
    <Autocomplete
      closeOnSelect
      items={items}
    ></Autocomplete>
    <Autocomplete
      closeOnSelect
      items={items}
      disabled
      placeholder="disabled"
    ></Autocomplete>
    <div style:font-size="">
      <Autocomplete
        items={items}
        multiple
        --chip-height="20px"
        --chip-min-height="20px"
        --chip-border-radius="8px"
        --autocomplete-min-height="auto"
        --autocomplete-padding="6px"
        --autocomplete-background-color="transparent"
        --autocomplete-border-radius="8px"
        --autocomplete-border="1px solid rgb(var(--global-color-background-200))"
        --autocomplete-focus-box-shadow="0 0 0 2px rgb(var(--global-color-primary-500))"
        maxVisibleChips={2}
        mobileDrawer={true}
      ></Autocomplete>
    </div>
  </div>
  <div>Fixed width</div>
  <div>
    <Autocomplete
      closeOnSelect
      items={items}
      width="200px"
      values={[
        { value: 'orange', label: 'Orange' }
      ]}
    ></Autocomplete>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'values', type: 'ItemData[]', description: 'The selected values for the autocomplete.', default: '[]' },
    { name: 'items', type: 'ItemData[]', description: 'The list of items to display in the dropdown.', default: '[]' },
    { name: 'searchFunction', type: 'function', description: 'Custom search function for filtering items based on the search text.', default: 'undefined' },
    { name: 'multiple', type: 'boolean', description: 'If true, allows multiple selections. Otherwise, only one selection is allowed.', default: 'false' },
    { name: 'disabled', type: 'boolean', description: 'If true, disables the autocomplete.', default: 'false' },
    { name: 'mandatory', type: 'boolean', description: 'If true, at least one item must be selected.', default: 'false' },
    { name: 'placeholder', type: 'string', description: 'The placeholder text to display in the input field.', default: '""' },
    { name: 'width', type: 'string', description: 'The width of the autocomplete container.', default: '"auto"' },
    { name: 'height', type: 'string', description: 'The height of the autocomplete container.', default: '"auto"' },
    { name: 'maxWidth', type: 'string | undefined', description: 'The maximum width of the autocomplete container.', default: 'undefined' },
    { name: 'minWidth', type: 'string', description: 'The minimum width of the autocomplete container.', default: '"200px"' },
    { name: 'openingId', type: 'string', description: 'The id used for opening the menu.', default: '"autocomplete-menu"' },
    { name: 'searchText', type: 'string | undefined', description: 'The text entered into the search input.', default: 'undefined' },
    { name: 'maxVisibleChips', type: 'number | undefined', description: 'The maximum number of chips to display.', default: 'undefined' },
    { name: 'menuOpened', type: 'boolean', description: 'Controls whether the dropdown menu is open or closed.', default: 'false' },
    { name: 'closeOnSelect', type: 'boolean', description: 'If true, closes the menu when an item is selected.', default: 'true' },
    { name: 'emptySearchTextOnMenuClose', type: 'boolean', description: 'If true, clears the search text when the menu is closed.', default: 'true' },
    { name: 'menuBoxShadow', type: 'string', description: 'The CSS box-shadow for the menu.', default: '"rgb(var(--global-color-background-300), .5) 0px 2px 4px"' },
    { name: 'menuBorderRadius', type: 'string', description: 'The border-radius for the menu.', default: '"5px"' },
    { name: 'mobileDrawer', type: 'boolean', description: 'If true, a drawer menu is used for mobile devices.', default: 'false' },
    { name: 'menuWidth', type: 'string | null', description: 'The width of the menu.', default: 'null' },
    { name: 'menuAnchor', type: '"bottom" | "bottom-center" | "right-center"', description: 'The anchor of the menu.', default: '"bottom-center"' },
    { name: 'class', type: 'object', description: 'CSS classes to apply to different parts of the component.', default: 'undefined' },
  ]}
  styleProps={[
    { name: "--autocomplete-background-color", type: "color", description: "The background color of the selection container.", default: "rgb(var(--global-color-background-300), .5)" },
    { name: "--autocomplete-border", type: "border", description: "The border of the selection container.", default: "" },
    { name: "--autocomplete-border-radius", type: "radius", description: "The border radius of the selection container.", default: "1.5rem" },
    { name: "--autocomplete-focus-border", type: "border", description: "The border when the selection container is focused.", default: "var(--autocomplete-border)" },
    { name: "--autocomplete-focus-box-shadow", type: "box-shadow", description: "The box-shadow when the selection container is focused.", default: "" },
    { name: "--autocomplete-selected-item-background-color", type: "color", description: "The background color of the selected item.", default: "rgb(var(--global-color-primary-500))" },
    { name: "--autocomplete-selected-item-color", type: "color", description: "The text color of the selected item.", default: "rgb(var(--global-color-grey-50))" },
    { name: "--autocomplete-focused-item-background-color", type: "color", description: "The background color of the focused item.", default: "rgb(var(--global-color-primary-500), .2)" },
    { name: "--autocomplete-focused-item-color", type: "color", description: "The text color of the focused item.", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--autocomplete-hover-item-background-color", type: "color", description: "The background color of the hovered item.", default: "rgb(var(--global-color-primary-500), .1)" },
    { name: "--autocomplete-hover-item-color", type: "color", description: "The text color of the hovered item.", default: "rgb(var(--global-color-contrast-900))" },
    { name: "--autocomplete-padding", type: "spacing", description: "The padding inside the selection container.", default: "0.5rem .5rem .5rem .5rem" },
    { name: "--autocomplete-min-height", type: "size", description: "The minimum height of the selection container.", default: "2rem" },
    { name: "--autocomplete-options-max-width", type: "size", description: "The maximum width of the selection options.", default: "100%" },
    { name: "--autocomplete-input-margin-left", type: "spacing", description: "The margin-left for the autocomplete input.", default: "4px" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { 
      name: 'selectionContainerSnippet', 
      description: 'Renders the container for selected items.', 
      default: `
<div
  class="selection-container"
>
  {#each (values || []).slice(0, maxVisibleChips) as selection}
    {#if selectionSnippet}
      {@render selectionSnippet({ selection, unselect})}
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
      {@render exceedCounterSnippet({ notVisibleChipNumber, maxVisibleChips, values, searchText, disabled })}
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
    placeholder={placeholder}
    bind:this={input}
  />
</div>
      `, 
      properties: [
        { name: 'values', type: 'ItemData[]', description: 'The selected values for the autocomplete.' },
        { name: 'searchText', type: 'string | undefined', description: 'The current search text.' },
        { name: 'disabled', type: 'boolean', description: 'If true, the component is disabled.' },
        { name: 'openMenu', type: 'function', description: 'Function to open the menu.' },
        { name: 'handleKeyDown', type: 'function', description: 'Function to handle key down events.' },
        { name: 'unselect', type: 'function', description: 'Function to unselect an item.' },
        { name: 'select', type: 'function', description: 'Function to select an item.' }
      ]
    },
    { 
      name: 'selectionSnippet', 
      description: 'Renders each selected item.', 
      default: `
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
      `, 
      properties: [
        { name: 'selection', type: 'ItemData', description: 'The selected item.' },
        { name: 'unselect', type: 'function', description: 'Function to unselect the item.' }
      ]
    },
    { 
      name: 'chipLabelSnippet', 
      description: 'Renders the label inside each chip.', 
      default: '{selection.label}', 
      properties: [
        { name: 'selection', type: 'ItemData', description: 'The selected item.' }
      ]
    },
    { 
      name: 'exceedCounterSnippet', 
      description: 'Renders the counter for chips exceeding the maximum visible count.', 
      default: '<div class="not-visible-chip-number">+ {notVisibleChipNumber}</div>', 
      properties: [
        { name: 'notVisibleChipNumber', type: 'number', description: 'Number of chips not visible.' },
        { name: 'maxVisibleChips', type: 'number', description: 'Maximum visible chips.' },
        { name: 'values', type: 'ItemData[]', description: 'The selected items.' },
        { name: 'searchText', type: 'string | undefined', description: 'The current search text.' },
        { name: 'disabled', type: 'boolean', description: 'If true, the component is disabled.' }
      ]
    },
    { 
      name: 'menuSnippet', 
      description: 'Renders the menu container.', 
      default: `
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
          {#if itemSnippet}
            {@render itemSnippet({
              item,
              index,
              selected: (values || [])
                .findIndex((i) => { return i.value == item.value }) != -1
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
      class={clazz.menu || ''}
      style:background-color="rgb(var(--global-color-background-100))"
    >
      {#each filteredItems as item, index}
        <li class="item-{index}">
          {#if itemSnippet}
            {@render itemSnippet({
              item,
              index,
              selected: (values || [])
                .findIndex((i) => { return i.value == item.value }) != -1
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
      `, 
    },
    { 
      name: 'itemLabelSnippet', 
      description: 'Renders the label of an item.', 
      default: '{item.label}', 
      properties: [
        { name: 'item', type: 'ItemData', description: 'The item to render the label for.' }
      ]
    },
    { 
      name: 'itemSnippet', 
      description: 'Renders each item in the dropdown menu.', 
      default: `
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
      `, 
      properties: [
        { name: 'item', type: 'ItemData', description: 'The item to render.' },
        { name: 'index', type: 'number', description: 'The index of the item in the list.' },
        { name: 'selected', type: 'boolean', description: 'Indicates if the item is selected.' }
      ]
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: 'onchange',
      description: 'Fired when the selection changes.',
      properties: [
        { name: 'unselect', type: 'ItemData | undefined', description: 'The item that was unselected.' },
        { name: 'select', type: 'ItemData | undefined', description: 'The item that was selected.' },
        { name: 'selection', type: 'ItemData[]', description: 'The current selection of items.' }
      ]
    },
    {
      name: 'onfocus',
      description: 'Fired when the input field is focused.',
    },
    {
      name: 'onblur',
      description: 'Fired when the input field loses focus.',
    },
    {
      name: 'onkeydown',
      description: 'Fired when a key is pressed in the input field.',
    },
    {
      name: 'onclose',
      description: 'Fired when the menu is closed.',
    }
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
</style>