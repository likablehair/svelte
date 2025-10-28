<script module lang="ts">
  export type Action = {
    label: string;
    icon?: string;
    disabled?: boolean;
    loading?: boolean;
    info?: string;
    disabledInfo?: string
    onClick: NonNullable<ComponentProps<typeof Button>['onclick']>
  };
</script>

<script lang="ts">
  import { Button, Icon, mediaQuery, ToolTip } from "$lib";
  import type { ComponentProps } from "svelte";
  import { fly } from "svelte/transition";
  import { cubicIn } from "svelte/easing";
  import MenuOrDrawer from "./MenuOrDrawer.svelte";
  import './QuickActions.css'

  interface Props {
    selectedItems: number;
    disabled: boolean;
    actionsForSelectedItems: Action[];
    position?: 'top' | 'bottom';
    lang?: 'it' | 'en';
    onClose?: () => void
  }

  let {
    selectedItems,
    disabled,
    actionsForSelectedItems,
    position = 'top',
    lang = 'en',
    onClose,
  }: Props = $props();

  let actions: Action[] = $state([]),
    extraActions: Action[] = $state([]),
    slotSelectActionsContainer: HTMLElement | undefined = $state(),
    moreActionsActivator: HTMLElement | undefined = $state(),
    openMoreActions: boolean = $state(false),
    infoActivators: { [actionLabel: string]: HTMLElement } = $state({}),
    disabledInfoActivators: { [actionLabel: string]: HTMLElement } = $state({});

  $effect(() => {
    if (!!slotSelectActionsContainer) {
      let numberOfSplit = $mediaQuery.xl ? 5 :
        $mediaQuery.l ? 4 :
        $mediaQuery.m ? 2 :
        $mediaQuery.s ? 0 :
        $mediaQuery.xs ? 0 : 3

      if (actionsForSelectedItems.length > numberOfSplit) {
        extraActions = actionsForSelectedItems.slice(numberOfSplit);
        actions = actionsForSelectedItems.slice(0, numberOfSplit);
      } else {
        actions = actionsForSelectedItems;
        extraActions = [];
      }
    }
  })
</script>

{#if selectedItems > 0}
  {#each actions as action}
    {#if !!action.info && !action.disabled}
      <ToolTip
        appearTimeout={500}
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
    {#if !!action.disabledInfo && action.disabled}
      <ToolTip
        appearTimeout={300}
        activator={disabledInfoActivators[action.label]}
      >
        <div
          style:background-color='rgb(var(--global-color-background-300), .95)'
          style:border-radius="5px"
          style:padding="10px"
          style:color='rgb(var(--global-color-contrast-900))'
        > 
          {action.disabledInfo}
        </div>
      </ToolTip>
    {/if}
  {/each}
  <div
    class="container-{position}"
    transition:fly={{ delay: 150, duration: 150, y: -10, easing: cubicIn }}
  >
    <div
      class="select-container"
    >
      <div>
        <button class="select-info" {disabled} onclick={() => {
            infoActivators = {}
            disabledInfoActivators = {}
            if(onClose) onClose()
          }}
        >
          {selectedItems} {lang == 'en' ? 'items selected' : 'righe selezionate'}
          <Icon name="mdi-close" />
        </button>
      </div>
      <div class="select-actions-container">
        <div class="select-actions" bind:this={slotSelectActionsContainer}>
          {#each actions as action}
            <Button
              style='
                --button-background-color: var(--quick-actions-buttons-background-color, var(--quick-actions-default-buttons-background-color));
                --button-active-background-color: var(--quick-actions-buttons-background-color, var(--quick-actions-default-buttons-background-color));
                --button-focus-background-color: var(--quick-actions-buttons-background-color, var(--quick-actions-default-buttons-background-color));
                --button-hover-background-color: var(--quick-actions-buttons-background-color-hover, var(--quick-actions-default-buttons-background-color-hover));
                --button-disabled-background-color: var(--quick-actions-buttons-background-color-disabled, var(--quick-actions-default-buttons-background-color-disabled));
                --button-color: var(--quick-actions-buttons-color, var(--quick-actions-default-buttons-color));
                --button-hover-color: var(--quick-actions-buttons-color, var(--quick-actions-default-buttons-color));
                --button-focus-color: var(--quick-actions-buttons-color, var(--quick-actions-default-buttons-color));
                --button-disabled-color: var(--quick-actions-buttons-color-disabled, var(--quick-actions-default-buttons-color-disabled));
                --button-box-shadow: none;
              '
              --button-height="20px"
              --circular-loader-height="17px"
              disabled={action.disabled || action.loading || disabled}
              loading={action.loading}
              onclick={action.onClick}
            >
              <div class="action" bind:this={disabledInfoActivators[action.label]}>
                {#if action.icon}
                  <Icon name={action.icon} --icon-size='16px'/>
                {/if}
                {#if !!action.info && !action.disabled}
                  <div bind:this={infoActivators[action.label]}>
                    <Icon						
                      name="mdi-help-circle-outline"
                      --icon-size="16px"
                    />
                  </div>
                {/if}
                {action.label}
              </div>
            </Button>
          {/each}

          {#if extraActions.length > 0}
            <div id="more-actions" bind:this={moreActionsActivator}>
              <Button
                style='
                  --button-background-color: var(--quick-actions-buttons-background-color, var(--quick-actions-default-buttons-background-color));
                  --button-active-background-color: var(--quick-actions-buttons-background-color, var(--quick-actions-default-buttons-background-color));
                  --button-focus-background-color: var(--quick-actions-buttons-background-color, var(--quick-actions-default-buttons-background-color));
                  --button-hover-background-color: var(--quick-actions-buttons-background-color-hover, var(--quick-actions-default-buttons-background-color-hover));
                  --button-disabled-background-color: var(--quick-actions-buttons-background-color-disabled, var(--quick-actions-default-buttons-background-color-disabled));
                  --button-color: var(--quick-actions-buttons-color, var(--quick-actions-default-buttons-color));
                  --button-hover-color: var(--quick-actions-buttons-color, var(--quick-actions-default-buttons-color));
                  --button-focus-color: var(--quick-actions-buttons-color, var(--quick-actions-default-buttons-color));
                  --button-disabled-color: var(--quick-actions-buttons-color-disabled, var(--quick-actions-default-buttons-color-disabled));
                  --button-box-shadow: none;"
                  margin-left: 8px;
                '
                --button-height="20px"
                onclick={(e) => {
                  openMoreActions = !openMoreActions;
                }}
              >
                <div class="action">
                  <Icon name="mdi-dots-vertical" />
                  {lang == 'en' ? 'More' : 'Altri'}
                </div>
              </Button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

{#if moreActionsActivator}
  <div class="menu-or-drawer">
    <MenuOrDrawer
      bind:open={openMoreActions}
      menuProps={{
        activator: moreActionsActivator,
        anchor: 'bottom-center',
        openingId: 'more-actions',
      }}
      drawerProps={{
        position: position == 'bottom' ? 'top' : 'bottom',
        _overflow: 'hidden'  
      }}
    >
      {#snippet children({ isDrawer, isMenu })}
        <div 
          class:more-actions-container-menu={isMenu}
          class:more-actions-container-drawer={isDrawer}
          class:more-actions-container-bottom={isMenu && position == 'bottom'}
        >
          {#each extraActions as action}
            <Button
              style='
                --button-background-color: var(--quick-actions-buttons-background-color, var(--quick-actions-default-buttons-background-color));
                --button-active-background-color: var(--quick-actions-buttons-background-color, var(--quick-actions-default-buttons-background-color));
                --button-focus-background-color: var(--quick-actions-buttons-background-color, var(--quick-actions-default-buttons-background-color));
                --button-hover-background-color: var(--quick-actions-buttons-background-color-hover, var(--quick-actions-default-buttons-background-color-hover));
                --button-disabled-background-color: var(--quick-actions-buttons-background-color-disabled, var(--quick-actions-default-buttons-background-color-disabled));
                --button-color: var(--quick-actions-buttons-color, var(--quick-actions-default-buttons-color));
                --button-hover-color: var(--quick-actions-buttons-color, var(--quick-actions-default-buttons-color));
                --button-focus-color: var(--quick-actions-buttons-color, var(--quick-actions-default-buttons-color));
                --button-disabled-color: var(--quick-actions-buttons-color-disabled, var(--quick-actions-default-buttons-color-disabled));
                --button-box-shadow: none;
              '
              --button-height="30px"
              --circular-loader-height="25px"
              disabled={action.disabled || action.loading || disabled}
              loading={action.loading}
              onclick={action.onClick}
            >
              <div class="action" bind:this={disabledInfoActivators[action.label]}>
                {#if action.icon}
                  <Icon name={action.icon} --icon-size='16px'/>
                {/if}
                {#if !!action.info && !action.disabled}
                  <div bind:this={infoActivators[action.label]}>
                    <Icon						
                      name="mdi-help-circle-outline"
                      --icon-size="16px"
                    />
                  </div>
                  <ToolTip
                    appearTimeout={500}
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
                {action.label}
                {#if !!action.disabledInfo && action.disabled}
                  <ToolTip
                    appearTimeout={300}
                    activator={disabledInfoActivators[action.label]}
                  >
                    <div
                      style:background-color='rgb(var(--global-color-background-300), .95)'
                      style:border-radius="5px"
                      style:padding="10px"
                      style:color='rgb(var(--global-color-contrast-900))'
                    > 
                      {action.disabledInfo}
                    </div>
                  </ToolTip>
                {/if}
              </div>
            </Button>
          {/each}
        </div>
      {/snippet}
    </MenuOrDrawer>
  </div>
{/if}

<style>
  .container-top, .container-bottom {
    position: fixed;
    z-index: var(
      --quick-actions-z-index,
      var(--quick-actions-default-z-index)
    );
    display: flex;
    justify-content: center;
    left: 0px;
    right: 0px;
    padding-top: 24px;
    padding-bottom: 24px;
    backdrop-filter: blur(2px);
    background-color: rgb(var(--global-color-background-100),.6);
    mask: linear-gradient(to top, transparent 0%, black 30%, black 100%);
  }

  .container-top {
    top: 0px;
  }

  .container-bottom {
    bottom: 16px;
  }
  
  .select-container {
    display: flex;
    width: 80%;
    height: fit-content;
    background-color: var(
      --quick-actions-background-color,
      var(--quick-actions-default-background-color)
    );
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 16px;
  }

  @media (max-width: 1024px) {
    .select-container {
      width: 90%;
    }
  }

  .select-info {
    height: 35px;
    padding: 0 10px;
    border-radius: 8px;
    border: none;
    background-color: var(
      --quick-actions-selected-items-button-background-color,
      var(--quick-actions-default-selected-items-button-background-color)
    );
    color: rgb(var(--global-color-contrast-900))
  }

  .select-info:hover {
    background-color: var(
      --quick-actions-selected-items-button-background-color-hover,
      var(--quick-actions-default-selected-items-button-background-color-hover)
    );
    cursor: pointer;
  }

  .select-info:disabled {
    background-color: var(
      --quick-actions-selected-items-button-background-color-disabled,
      var(--quick-actions-default-selected-items-button-background-color-disabled)
    );
    color: var(
      --quick-actions-selected-items-button-color-disabled,
      var(--quick-actions-default-selected-items-button-color-disabled)
    );
    cursor: not-allowed;
  }

  .select-actions-container {
    align-items: center;
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .select-actions {
    display: flex;
    margin-left: 8px;
    justify-content: flex-end;
    width: 100%;
    gap: 8px;
  }

  .action {
    display: flex;
    justify-content: center;
    gap: 4px;
  }

  .menu-or-drawer {
    z-index: 50;
  }

  .more-actions-container-menu {
    display: grid;
    grid-template-columns: 1fr;
    justify-content: center;
    align-items: center;
    box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.2);
    position: fixed;
    padding: 10px;
    border-radius: 10px;
    background-color: var(
      --quick-actions-background-color,
      var(--quick-actions-default-background-color)
    );
    gap: 15px;
    left: 79dvw;
  }

  .more-actions-container-drawer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: center;
    align-items: center;
    --button-width: 100%;
  }

  .more-actions-container-bottom {
    bottom: 121px;
  }

  @media (max-width: 1440px) {
    .more-actions-container-menu {
      display: grid;
      grid-template-columns: 1fr;
      justify-content: center;
      align-items: center;
      box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.2);
      position: fixed;
      padding: 10px;
      border-radius: 10px;
      background-color: var(
        --quick-actions-background-color,
        var(--quick-actions-default-background-color)
      );
      gap: 15px;
      left: 73dvw;
    }
  }
</style>
