<script lang="ts" generics="Data">
  import lodash from "lodash";
  import Autocomplete, { type Item } from "../../../components/simple/forms/Autocomplete.svelte";
  import Button from '../../simple/buttons/Button.svelte'
  import Icon from '../../simple/media/Icon.svelte'
  import type { ComponentProps, Snippet } from "svelte";

  type ItemData = Item<Data>
  interface Props {
    items?: ItemData[];
    values?: ItemData[];
    multiple?: boolean;
    lang?: 'it' | 'en';
    searchText?: string;
    maxVisibleChips?: number;
    placeholder?: string;
    clearable?: boolean;
    mandatory?: boolean;
    icon?: string;
    menuOpened?: boolean;
    openingId?: string;
    width?: string;
    height?: string;
    minWidth?: string;
    menuWidth?: string;
    mobileDrawer?: boolean;
    disabled?: boolean;
    onchange?: (event: {
      detail: {
        unselect: ItemData | undefined;
        select: ItemData | undefined;
        selection: ItemData[];
      }
    }) => void
    itemLabelSnippet?: ComponentProps<typeof Autocomplete<Data>>['itemLabelSnippet']
    labelSnippet?: Snippet<[{
      values: typeof values,
      items: typeof items,
      searchText: typeof searchText,
      generatedLabel: typeof generatedLabel,
      placeholder: typeof placeholder,
      clearable: typeof clearable,
      handleCloseClick: typeof handleCloseClick,
    }]>
  }

  let {
    items = [],
    values = $bindable([]),
    multiple = false,
    lang = 'en',
    searchText = $bindable(),
    maxVisibleChips,
    placeholder = lang === 'en' ? "Select" : "Seleziona",
    clearable = true,
    mandatory = true,
    icon,
    menuOpened = $bindable(false),
    openingId = $bindable("autocomplete-menu"),
    width,
    height,
    minWidth = 'none',
    menuWidth = width,
    mobileDrawer = false,
    disabled = false,
    onchange,
    itemLabelSnippet,
    labelSnippet,
  }: Props = $props();

  let generatedLabel = $derived(values.length == 1 ? values[0].label : `${values.length} Selezionati`)

  function handleCloseClick(event: Parameters<NonNullable<ComponentProps<typeof Icon>['onclick']>>[0]) {
    if(event){
      event.preventDefault()
      event.stopPropagation()
    }
    let valuesBefore = lodash.cloneDeep(values)
    values = []

    if(onchange){
      onchange({
        detail: {
          unselect: valuesBefore[0],
          select: undefined,
          selection: []
        }
      })
    }
  }
</script>

<Autocomplete
  {items}
  bind:values
  bind:searchText
  {multiple}
  {maxVisibleChips}
  {mandatory}
  {disabled}
  searchFunction={() => true}
  {onchange}
  bind:menuOpened
  bind:openingId
  {width}
  {mobileDrawer}
  {minWidth}
  {height}
  {menuWidth}
  {itemLabelSnippet}
>
  {#snippet selectionContainerSnippet({ openMenu, handleKeyDown })}
    <Button
      onclick={openMenu}
      onkeydown={(event) => {
        handleKeyDown(event.detail.nativeEvent)
        if(event.detail.nativeEvent.key == 'ArrowDown' || event.detail.nativeEvent.key == 'ArrowUp') {
          event.detail.nativeEvent.stopPropagation()
          event.detail.nativeEvent.preventDefault()
        }
      }}
      --button-padding="var(--dropdown-button-padding, 10px 12px)"
      --button-border='var(--dropdown-button-border, none)'
      --button-background-color='var(--dropdown-button-background-color, rgb(var(--global-color-background-300), .6))'
      --button-hover-background-color='var(--dropdown-button-hover-color, rgb(var(--global-color-background-300), .6))'
      --button-focus-background-color='var(--dropdown-button-focus-color, rgb(var(--global-color-background-300), .6))'
      --button-active-background-color='var(--dropdown-button-active-color, rgb(var(--global-color-background-300), .6))'
      --button-hover-color='var(--dropdown-button-hover-color, rgb(var(--global-color-contrast-800)))'
      --button-color='var(--dropdown-button-color, rgb(var(--global-color-contrast-800)))'
      --button-focus-color='var(--dropdown-button-focus-color, rgb(var(--global-color-contrast-800)))'
      --button-border-radius='var(--dropdown-button-border-radius, 4px)'
      --button-height='var(--dropdown-button-height, 38.78px)'
      --button-active-box-shadow='var(--dropdown-button-active-box-shadow)'
      --button-focus-box-shadow='var(--dropdown-button-focus-box-shadow)'
      --button-box-sizing='var(--dropdown-button-box-sizing, border-box)'
    >
      {#if labelSnippet}
        {@render labelSnippet({ 
          values,
          items,
          searchText,
          generatedLabel,
          placeholder,
          clearable,
          handleCloseClick,
        })}
      {:else}
        <div class="label">
          {#if !!icon}
            <Icon name={icon}></Icon>
          {/if}
          {#if values.length == 0}
            <div class="space-between">
              <div>{placeholder}</div>
              <Icon name="mdi-chevron-down"></Icon>
            </div>
          {:else}
            <div class="space-between">
              <div>{generatedLabel}</div>
              {#if clearable}
                <Icon
                  name="mdi-close"
                  onclick={handleCloseClick}
                ></Icon>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </Button>
  {/snippet}
</Autocomplete>

<style>
  .label {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
    width: 100%;
    text-overflow: ellipsis;
    white-space: pre;
  }

  .space-between {
    flex-grow: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
</style>