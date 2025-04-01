<script lang="ts" module>
  export type AvatarItem<Data = any> = {
    value: string | number,
    tooltip?: string | number,
    label?: string | number,
    text?: string
    src?: string
    alt?: string
    data?: Data
  };
</script>

<script lang="ts" generics="Data">
  import lodash from "lodash";
  import Autocomplete from "../../../components/simple/forms/Autocomplete.svelte";
  import Icon from '../../simple/media/Icon.svelte'
  import Avatar from "$lib/components/simple/media/Avatar.svelte";
  import ToolTip from "../common/ToolTip.svelte";
  import type { Snippet } from "svelte";

  type AvatarItemData = AvatarItem<Data>
  interface Props {
    items?: AvatarItemData[];
    values?: AvatarItemData[];
    multiple?: boolean;
    menuOpened?: boolean;
    openingId?: string;
    width?: string;
    minWidth?: string;
    disabled?: boolean;
    menuWidth?: string | null;
    onchange?: (event: {
      detail: {
        unselect: AvatarItemData | undefined;
        select: AvatarItemData | undefined;
        selection: AvatarItemData[];
      }
    }) => void
    labelSnippet?: Snippet<[{
      values: AvatarItemData[]
      items: AvatarItemData[]
      handleCloseClick: typeof handleCloseClick
    }]>
    noValuesSnippet?: Snippet<[{
      values: AvatarItemData[]
      items: AvatarItemData[]
      handleCloseClick: typeof handleCloseClick
    }]>
    itemLabelSnippet?: Snippet<[{
      item: AvatarItemData
    }]>
  }

  let {
    items = [],
    values = $bindable([]),
    multiple = true,
    menuOpened = $bindable(false),
    openingId = $bindable("autocomplete-menu"),
    width,
    minWidth = 'auto',
    disabled = false,
    menuWidth = "144px",
    onchange,
    labelSnippet,
    noValuesSnippet,
    itemLabelSnippet: itemLabelInternalSnippet,
  }: Props = $props();

  function handleCloseClick(params: { index: number }) {
    let unselected = lodash.cloneDeep(values[params.index])
    values.splice(params.index, 1)
    values = [...values]

    if(onchange){ 
      onchange({
        detail: {
          unselect: unselected,
          select: undefined,
          selection: values
        }
      })
    }
  }

  let autocompleteItems = $derived(items.map((e) => {
    return {
      ...e,
      label: e.label || e.text,
      data: {
        ...(e.data || {}),
        text: e.text,
        src: e.src,
        alt: e.alt,
      }
    }
  }))

  let tooltipsActivator: HTMLElement[] = []
</script>

<Autocomplete
  items={autocompleteItems}
  bind:values
  {multiple}
  searchFunction={() => true}
  {onchange}
  bind:menuOpened
  bind:openingId
  {width}
  {minWidth}
  {disabled}
  {menuWidth}
>
  {#snippet selectionContainerSnippet({ handleKeyDown, openMenu })}
    <button
      class="unstyled-button"
      onclick={openMenu}
      onkeydown={(event) => {
        handleKeyDown(event)
        if(event.key == 'ArrowDown' || event.key == 'ArrowUp') {
          event.stopPropagation()
          event.preventDefault()
        }
      }}
    >
      {#if labelSnippet}
        {@render labelSnippet({ values, items, handleCloseClick })}
      {:else}
        {#if values.length > 0}
          <div class="overlapped-avatars">
            {#each values as avatar, i}
              {#if !!avatar.tooltip || !!avatar.label }
                <ToolTip activator={tooltipsActivator[i]} appearTimeout={500}>
                  <div class="tooltip">{avatar.tooltip || avatar.label}</div>
                </ToolTip>
              {/if}
              <div class="single-avatar" bind:this={tooltipsActivator[i]}>
                <Avatar 
                  text={avatar.text}
                  alt={avatar.alt}
                  src={avatar.src}
                  --avatar-default-border="2px solid rgb(var(--global-color-background-100))"
                ></Avatar>
                <div 
                  onclick={(e) => {
                    e.stopPropagation()
                    handleCloseClick({ index: i })
                  }}
                  onkeypress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleCloseClick({ index: i })
                    }
                  }}
                  class="unstyled-button remove-button"
                  role="button"
                  tabindex="0"
                >
                  <Icon --icon-default-size="10px" name="mdi-close"></Icon>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          {#if noValuesSnippet}
            {@render noValuesSnippet({ values, items, handleCloseClick})}
          {:else}
            <Icon name="mdi-account-plus"></Icon>
          {/if}
        {/if}
      {/if}
    </button>
  {/snippet}
  {#snippet itemLabelSnippet({ item })}
    {#if itemLabelInternalSnippet}
      {@render itemLabelInternalSnippet({ item })}
    {:else}
      <div class="item-label-container">
        <Avatar 
          text={item.data.text}
          alt={item.data.alt}
          src={item.data.src}
          --avatar-default-border="2px solid rgb(var(--global-color-background-100))"
        ></Avatar>
        {item.label}
      </div>
    {/if}
  {/snippet}
</Autocomplete>

<style>
  .unstyled-button {
    background-color: transparent;
    outline: inherit;
    background-image: none;
    text-transform: none;
    line-height: inherit;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
  }

  .overlapped-avatars {
    display: flex;
    flex-direction: row-reverse;
  }

  .single-avatar {
    position: relative
  }

  .single-avatar {
    position: relative;
  }

  .remove-button {
    position: absolute;
    display: none;
    top: 0px;
    right: 0px;
    height: 14px;
    width: 14px;
    border-radius: 9999px;
    line-height: 12px;
    font-size: 10px;
  }

  .remove-button:hover {
    display: flex;
  }

  .single-avatar:hover .remove-button {
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 5;
    background-color: rgb(var(--global-color-error-500));
    border: 1px solid rgb(var(--global-color-background-100));
  }

  .single-avatar:not(:first-child) {
    margin-right: -12px;
  }

  .tooltip {
    background-color: rgb(var(--global-color-background-200));
    padding: 4px 8px;
    border-radius: 8px;
  }

  .item-label-container {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>