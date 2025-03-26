<script lang="ts" context="module">
  export type AvatarItem = {
    value: string | number,
    tooltip?: string | number,
    label?: string | number,
    text?: string
    src?: string
    alt?: string
    data?: any
  };
</script>

<script lang="ts">
  import lodash from "lodash";
  import Autocomplete from "../../../components/simple/forms/Autocomplete.svelte";
  import Icon from '../../simple/media/Icon.svelte'
  import { createEventDispatcher } from "svelte";
  import Avatar from "$lib/components/simple/media/Avatar.svelte";
  import ToolTip from "../common/ToolTip.svelte";

  let dispatch = createEventDispatcher<{
    change: {
      unselect: AvatarItem | undefined;
      select: AvatarItem | undefined;
      selection: AvatarItem[];
    }
  }>()

  export let items: AvatarItem[] = [],
    values: AvatarItem[] = [],
    multiple: boolean = true,
    menuOpened: boolean = false,
    openingId: string | undefined = undefined,
    width: string | undefined = undefined,
    minWidth: string | undefined = 'auto',
    disabled: boolean = false,
    menuWidth: string | undefined | null = "144px"

  function handleCloseClick(params: { index: number }) {
    let unselected = lodash.cloneDeep(values[params.index])
    values.splice(params.index, 1)
    values = [...values]

    dispatch('change', {
      unselect: unselected,
      select: undefined,
      selection: values
    })
  }

  $: autocompleteItems = items.map((e) => {
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
  })

  let tooltipsActivator: HTMLElement[] = []
</script>

<Autocomplete
  bind:items={autocompleteItems}
  bind:values
  bind:multiple
  searchFunction={() => true}
  on:change
  bind:menuOpened
  bind:openingId
  bind:width
  bind:minWidth
  bind:disabled
  menuWidth={menuWidth}
>
  <svelte:fragment slot="selection-container" let:openMenu let:handleKeyDown>
    <button
      class="unstyled-button"
      on:click={openMenu}
      on:keydown={(event) => {
        handleKeyDown(event)
        if(event.key == 'ArrowDown' || event.key == 'ArrowUp') {
          event.stopPropagation()
          event.preventDefault()
        }
      }}
    >
      <slot 
        name="label" 
        {values} 
        {items}
        {handleCloseClick}
      >
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
                  on:click|stopPropagation={() => {
                    handleCloseClick({ index: i })
                  }}
                  on:keypress={(e) => {
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
          <slot 
            name="no-values"
            {values} 
            {items}
            {handleCloseClick}
          >
            <Icon name="mdi-account-plus"></Icon>
          </slot>
        {/if}
      </slot>
    </button>
  </svelte:fragment>
  <svelte:fragment slot="item-label" let:item >
    <slot name="item-label" {item}>
      <div class="item-label-container">
        <Avatar 
          text={item.data.text}
          alt={item.data.alt}
          src={item.data.src}
          --avatar-default-border="2px solid rgb(var(--global-color-background-100))"
        ></Avatar>
        {item.label}
      </div>
    </slot>
  </svelte:fragment>
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