<script lang="ts">
  import '../../../css/main.css'
  import './QuickFilters.css'
  import { ENGLISH_LABELS_MAPPER, ITALIAN_LABELS_MAPPER, type Filter } from "$lib/utils/filters/filters";
  import Icon from '$lib/components/simple/media/Icon.svelte';
  import type { Snippet } from 'svelte';
  import Menu from '$lib/components/simple/common/Menu.svelte';
  import FilterEditor from './FilterEditor.svelte';
  import Button from '$lib/components/simple/buttons/Button.svelte';
    import MediaQuery from '$lib/components/simple/common/MediaQuery.svelte';
    import Drawer from '$lib/components/simple/navigation/Drawer.svelte';

  type QuickFilter = Filter & {
    icon?: string
  }

  type Props = {
    filters?: QuickFilter[],
    lang?: 'it' | 'en',
    onapply?: (params: { filter: QuickFilter, filters: QuickFilter[] }) => void,
    buttonLabelSnippet?: Snippet<
      [
        {
          filter: QuickFilter;
        },
      ]
    >;
  }

  let { 
    filters = $bindable(),
    buttonLabelSnippet,
    onapply,
    lang
  }: Props = $props()


  let activators: Record<string, HTMLElement> = $state({}),
    openMenus: Record<string, boolean> = $state({})

  function handleApplyFilter(params: { index: number }) {
    if(!!filters) {
      filters[params.index].active = true
      openMenus[filters[params.index].name] = false
      onapply?.({ filter: filters[params.index], filters: filters || [] })
    }
  }

  function handleClearFilter(params: { index: number }) {
    if(!!filters) {
      filters[params.index].active = false
      onapply?.({ filter: filters[params.index], filters: filters || [] })
    }
  }
</script>


<div class="quick-filters-container">
  {#if !!filters}
    {#each filters as filter, index}
      <button 
        class="quick-filters-button"
        class:active={filter.active}
        bind:this={activators[filter.name]}
        onclick={() => openMenus[filter.name] = true}
      >
        {#if buttonLabelSnippet}
          {@render buttonLabelSnippet({ filter })}
        {:else}
          {#if !!filter.icon}
            <span style:margin-right="4px">
              <Icon name={filter.icon}></Icon>
            </span>
          {/if}
          {filter.label}
          {#if filter.active}
            <div
              class="clear-button"
              onclick={(e) => {
                e.stopPropagation()
                handleClearFilter({ index })
              }}
              role="presentation"
            >
              <Icon name="mdi-close"></Icon>
            </div>
          {/if}
        {/if}
      </button>
      <MediaQuery>
        {#snippet defaultSnippet({ mAndDown })}
          {#if mAndDown}
            <Drawer 
              bind:open={openMenus[filter.name]}
              position="bottom"
            >
              <div class="quick-filter-editor-container">
                <div class="editing-filter-title">
                  {filter.label}
                </div>
                <FilterEditor
                  filter={filters[index]}
                  labelsMapper={lang === 'en' ? ENGLISH_LABELS_MAPPER : ITALIAN_LABELS_MAPPER}
                  editFilterMode="multi-edit"
                >
                  {#snippet filterActionsSnippet({ filter })}
                    <div class="apply-button-container">
                      <Button 
                        --button-default-width="100%"
                        --button-default-border-radius="4px"
                        onclick={() => {
                          if(!!filter) {
                            filters[index] = filter
                          }
                          handleApplyFilter({ index })
                        }}
                      >Applica</Button>
                    </div>
                  {/snippet}
                </FilterEditor>
              </div>
            </Drawer>
          {:else}
            <Menu 
              activator={activators[filter.name]}
              bind:open={openMenus[filter.name]}
              closeOnClickOutside
              openingId="quick-filter"
              _overflow="none"
            >
              <div class="quick-filter-editor-container">
                <FilterEditor
                  filter={filters[index]}
                  labelsMapper={lang === 'en' ? ENGLISH_LABELS_MAPPER : ITALIAN_LABELS_MAPPER}
                  editFilterMode="multi-edit"
                >
                  {#snippet filterActionsSnippet({ filter })}
                    <div class="apply-button-container">
                      <Button 
                        --button-default-width="100%"
                        --button-default-border-radius="4px"
                        onclick={() => {
                          if(!!filter) {
                            filters[index] = filter
                          }
                          handleApplyFilter({ index })
                        }}
                      >Applica</Button>
                    </div>
                  {/snippet}
                </FilterEditor>
              </div>
            </Menu>
          {/if}
        {/snippet}
      </MediaQuery>
    {/each}
  {/if}
</div>

<style>

  * {
    box-sizing: border-box;
  }

  .editing-filter-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .quick-filters-container {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    width: var(
      --quick-filters-width,
      var(--quick-filters-default-width)
    );
  }

  .quick-filters-button {
    background: none;
    border: none;
    padding: var(
      --quick-filters-button-padding,
      var(--quick-filters-default-button-padding)
    );
    border-radius: var(
      --quick-filters-button-border-radius,
      var(--quick-filters-default-button-border-radius)
    );
    background-color: var(
      --quick-filters-button-background-color,
      var(--quick-filters-default-button-background-color)
    );
    box-shadow: var(
      --quick-filters-button-box-shadow,
      var(--quick-filters-default-button-box-shadow)
    );
    margin: 0;
    font: inherit;
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    gap: 2px;
  }

  .clear-button {
    background: none;
    border: none;
    margin: 0;
    font: inherit;
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
  }

  .quick-filters-button:hover {
    background-color: var(
      --quick-filters-button-hover-background-color,
      var(--quick-filters-default-button-hover-background-color)
    );
  }

  .quick-filters-button.active {
    background-color: var(
      --quick-filters-button-active-background-color,
      var(--quick-filters-default-button-active-background-color)
    );
    box-shadow: var(
      --quick-filters-button-active-box-shadow,
      var(--quick-filters-default-button-active-box-shadow)
    );
    color: var(
      --quick-filters-button-active-color,
      var(--quick-filters-default-button-active-color)
    );
  }

  .quick-filter-editor-container {
    background-color: var(
      --quick-filters-editor-background-color,
      var(--quick-filters-default-editor-background-color)
    );
    backdrop-filter: var(
      --quick-filters-editor-backdrop-filter,
      var(--quick-filters-default-editor-backdrop-filter)
    );
    border: var(
      --quick-filters-editor-border,
      var(--quick-filters-default-editor-border)
    );
    border-radius: var(
      --quick-filters-editor-border-radius,
      var(--quick-filters-default-editor-border-radius)
    );
    padding: var(
      --quick-filters-editor-padding,
      var(--quick-filters-default-editor-padding)
    );
    min-width: var(
      --quick-filters-editor-min-width,
      var(--quick-filters-default-editor-min-width)
    );
    width: var(
      --quick-filters-editor-width,
      var(--quick-filters-default-editor-width)
    );
    min-height: var(
      --quick-filters-editor-min-height,
      var(--quick-filters-default-editor-min-height)
    );
  }

  .apply-button-container {
    margin-top: 8px;
    width: calc(100% - 16px);
  }
</style>