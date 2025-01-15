<script context="module" lang="ts">
  export type Action = {
    label: string;
    icon?: string;
    disabled?: boolean;
    info?: string;
    onClick: (e: CustomEvent<{ nativeEvent: MouseEvent }>) => void;
  };
</script>

<script lang="ts">
  import { Button, Icon, Menu, ToolTip } from "$lib";
  import type { ComponentProps } from "svelte";
  import DynamicTable from "../list/DynamicTable.svelte";
  import { fly } from "svelte/transition";
  import { cubicIn } from "svelte/easing";

  export let selectedItems: ComponentProps<DynamicTable["selectedItems"]>[],
    showSelectContainer: boolean,
    isSelectedAll: boolean,
    totalRows: number,
    slotSelectActionsContainer: HTMLElement | undefined,
    disabled: boolean,
    loading: boolean,
    actionsForSelectedItems: Action[];

  let actions: Action[] = [],
    extraActions: Action[] = [],
    moreActionsActivator: HTMLElement | undefined,
    openMoreActions: boolean = false,
    menuElementActions: HTMLElement,
    infoActivators: { [actionLabel: string]: HTMLElement } = {};

  $: {
    if (!!slotSelectActionsContainer) {
      let numberOfSplit = outerWidth < 1500 ? 4 : 6;
      if (actionsForSelectedItems.length > numberOfSplit) {
        extraActions = actionsForSelectedItems.slice(numberOfSplit);
        actions = actionsForSelectedItems.slice(0, numberOfSplit);
      } else {
        actions = actionsForSelectedItems;
        extraActions = [];
      }
    }
  }
</script>

{#if selectedItems && selectedItems.length > 0 && showSelectContainer}
  <div
    class="select-container"
    transition:fly={{ delay: 150, duration: 150, y: -10, easing: cubicIn }}
  >
    <div class="flex">
      <div>
        <button class="select-info" on:click={() => (selectedItems = [])}>
          {!!isSelectedAll ? totalRows : selectedItems.length} items selected
          <Icon name="mdi-close" />
        </button>
      </div>
      <div class="select-actions-container">
        <div class="select-actions" bind:this={slotSelectActionsContainer}>
          <div class="flex gap-2">
            {#each actions as action}
              <Button
                --button-height="35px"
                disabled={action.disabled}
                on:click={action.onClick}
              >
                <div class="flex align-center justify-center gap-2">
                  {action.label}
                  {#if action.icon}
                    <Icon name={action.icon} />
                  {/if}
                  {#if !!action.info}
                    <div bind:this={infoActivators[action.label]}>
                      <Icon						
                        name="mdi-help-circle-outline"
                        --icon-size="16px"
                      />
                    </div>
                    <ToolTip
                      appearTimeout={1000}
                      activator={infoActivators[action.label]}
                    >
                      <div
                        style:background-color='rgb(var(--global-color-background-300), .95)'
                        style:border-radius="5px"
                        style:padding="10px"
                        style:color='rgb(var(--global-color-contrast-900))'
                      > 
                        {action.info}
                      </div>
                    </ToolTip>
                  {/if}
                </div>
              </Button>
            {/each}

            {#if extraActions.length > 0}
              <div id="more-actions" bind:this={moreActionsActivator}>
                <Button
                  --button-height="35px"
                  disabled={disabled || loading}
                  class="ml-2"
                  on:click={(e) => {
                    openMoreActions = !openMoreActions;
                  }}
                >
                  <Icon name="mdi-dots-vertical" />
                  More
                </Button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<Menu
  bind:open={openMoreActions}
  activator={moreActionsActivator}
  bind:menuElement={menuElementActions}
  anchor="bottom-center"
  _activatorGap={30}
  openingId="more-actions"
  closeOnClickOutside
>
  <div class="more-actions-container">
    {#each extraActions as action}
      <Button
        --button-height="35px"
        disabled={action.disabled}
        on:click={action.onClick}
      >
        <div class="flex align-center justify-center gap-2">
          {action.label}
          {#if action.icon}
            <Icon name={action.icon} />
          {/if}
          {#if !!action.info}
            <div bind:this={infoActivators[action.label]}>
              <Icon						
                name="mdi-help-circle-outline"
                --icon-size="16px"
              />
            </div>
            <ToolTip
              appearTimeout={1000}
              activator={infoActivators[action.label]}
            >
              <div
                style:background-color='rgb(var(--global-color-background-300), .95)'
                style:border-radius="5px"
                style:padding="10px"
                style:color='rgb(var(--global-color-contrast-900))'
              > 
                {action.info}
              </div>
            </ToolTip>
          {/if}
        </div>
      </Button>
    {/each}
  </div>
</Menu>

<style>
  .select-container {
    position: fixed;
    top: 16px;
    right: 150px;
    bottom: 0;
    z-index: 802;
    width: 80%;
    height: fit-content;
    background-color: rgb(var(--global-color-background-400));
    border-radius: 8px;
    padding: 5px;
    margin-bottom: 10px;
  }

  .select-info {
    height: 35px;
    padding: 0 10px;
    border-radius: 8px;
    background-color: rgb(var(--global-color-background-500));
  }

  .select-info:hover {
    background-color: rgb(var(--global-color-background-300));
  }

  .select-actions-container {
    align-items: center;
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .select-actions {
    display: flex;
    margin: 0 8px;
    justify-content: flex-end;
    width: 100%;
  }

  .more-actions-container {
    display: grid;
    grid-template-columns: 1fr;
    justify-content: center;
    align-items: center;
    box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.2);
    position: fixed;
    padding: 10px;
    border-radius: 10px;
    background-color: rgb(var(--global-color-background-400));
    gap: 15px;
    left: 79dvw;
  }

  @media (max-width: 1500px) {
    .more-actions-container {
      display: grid;
      grid-template-columns: 1fr;
      justify-content: center;
      align-items: center;
      box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.2);
      position: fixed;
      padding: 10px;
      border-radius: 10px;
      background-color: rgb(var(--global-color-background-400));
      gap: 15px;
      left: 73dvw;
    }
  }
</style>
