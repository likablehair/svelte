<script lang="ts" module>
  export type Option = {
    label: string;
    name: string;
    icon?: string;
    href?: string;
    options?: Omit<Option, "options">[];
  };
</script>

<script lang="ts">
  import "../../../css/main.css";
  import "./HierarchyMenu.css";
  import { Icon } from "$lib";
  import { slide } from "svelte/transition";
  import { sineIn } from "svelte/easing";
  import type { Snippet } from "svelte";

  interface Props {
    options: Option[];
    selected?: string;
    expanded?: string[];
    iconsOnly?: boolean;
    onoptionClick?: (event: {
      detail: {
        option: Option
      }
    }) => void
    prependSnippet?: Snippet<[{ option: Option }]>
    optionSnippet?: Snippet<[{ option: Option }]>
    appendSnippet?: Snippet<[{ option: Option }]>
  }

  let {
    options,
    selected = $bindable(undefined),
    expanded = [],
    iconsOnly = false,
    onoptionClick,
    appendSnippet,
    optionSnippet,
    prependSnippet,
  }: Props = $props();

  function handleOptionClick(option: Option) {
    selected = option.name;
    if(onoptionClick) {
      onoptionClick({
        detail: {
          option
        }
      })
    }
  }

  function handleExpandOptionClick(option: Option) {
    if (expanded.includes(option.name))
      expanded = expanded.filter((e) => e !== option.name);
    else expanded = [...expanded, option.name];
  }
</script>

<div class="hierarchy-container">
  {#each options as option}
    {@const isExpanded = expanded.includes(option.name)}
    <div class="menu-element">
      <div
        class="main-option"
        role="presentation"
        class:selected={option.name === selected}
        onclick={() => handleOptionClick(option)}
      >
        <div>
          {#if prependSnippet}
            {@render prependSnippet({ option })}
          {:else}
            {#if !!option.options}
              <button
                class="style-less-button icon-button"
                class:no-transform={iconsOnly}
                onclick={(e) => {
                  e.stopPropagation()
                  if(!iconsOnly) {
                    handleExpandOptionClick(option)
                  } else {
                    handleOptionClick(option)
                  }
                }}
              >
                {#if !!option.icon}
                  <Icon name={option.icon} />
                {:else if isExpanded}
                  <Icon name="mdi-chevron-down" />
                {:else}
                  <Icon name="mdi-chevron-right" />
                {/if}
              </button>

              {#if !iconsOnly}
                <button
                  class="style-less-button expand-button"
                  onclick={(e) => {
                    e.stopPropagation()
                    handleExpandOptionClick(option)}
                  }
                >
                  {#if isExpanded}
                    <Icon name="mdi-chevron-down" />
                  {:else}
                    <Icon name="mdi-chevron-right" />
                  {/if}
                </button>
              {/if}
            {:else if !!option.icon}
              <div class="icon-only">
                <Icon name={option.icon} />
              </div>
            {/if}
          {/if}
        </div>
        {#if !iconsOnly}
          {#if optionSnippet}
            {@render optionSnippet({ option })}
          {:else}
            <div class="label">
              {option.label}
            </div>
          {/if}
          {#if appendSnippet}  
            <div
              onclick={(e) => { e.stopPropagation() }}
              onkeydown={() => {}}
              role="presentation"
            >
             {@render appendSnippet({ option })}
            </div>
          {/if}
        {/if}
      </div>
      {#if !!option.options && isExpanded && !iconsOnly}
        <div
          class="sub-options-container"
          transition:slide={{
            duration: 150,
            easing: sineIn,
          }}
        >
          {#each option.options as subOption}
            <div class="sub-menu-element">
              <div
                role="presentation"
                class:selected={subOption.name === selected}
                onclick={() => handleOptionClick(subOption)}
                class="main-option sub-element-main-option"
              >
                <div>
                  {#if prependSnippet}
                    {@render prependSnippet({ option: subOption })}
                  {:else}
                    <div class="style-less-button sub-icon-button">
                      {#if !!subOption.icon}
                        <Icon name={subOption.icon} />
                      {/if}
                    </div>
                  {/if}
                </div>
                {#if optionSnippet}
                  {@render optionSnippet({ option: subOption })}
                {:else}
                  <div class="label">
                    {subOption.label}
                  </div>
                {/if}
                {#if appendSnippet}  
                  <div
                    onclick={(e) => { e.stopPropagation() }}
                    onkeydown={() => {}}
                    role="presentation"
                  >
                    {@render appendSnippet({ option: subOption })}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .hierarchy-container {
    display: flex;
    flex-direction: column;
    gap: var(--hierarchy-menu-gap, var(--hierarchy-menu-default-gap));
    height: var(--hierarchy-menu-height, var(--hierarchy-menu-default-height));
    width: var(--hierarchy-menu-width, var(--hierarchy-menu-default-width));
  }

  .sub-options-container {
    display: flex;
    flex-direction: column;
    gap: var(--hierarchy-menu-gap, var(--hierarchy-menu-default-gap));
    margin-top: var(--hierarchy-menu-gap, var(--hierarchy-menu-default-gap));
    margin-bottom: var(--hierarchy-menu-gap, var(--hierarchy-menu-default-gap));
  }

  .sub-element-main-option {
    padding: var(
      --hierarchy-menu-sub-options-padding,
      var(--hierarchy-menu-default-sub-options-padding)
    );
  }

  .main-option {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: var(
      --hierarchy-menu-element-cursor,
      var(--hierarchy-menu-default-element-cursor)
    );
    border-radius: var(
      --hierarchy-menu-element-border-radius,
      var(--hierarchy-menu-default-element-border-radius)
    );
    background-color: var(
      --hierarchy-menu-element-background-color,
      var(--hierarchy-menu-default-element-background-color)
    );
    color: var(
      --hierarchy-menu-element-color,
      var(--hierarchy-menu-default-element-color)
    );
  }

  .main-option:not(.sub-element-main-option) {
    padding: var(
      --hierarchy-menu-element-padding,
      var(--hierarchy-menu-default-element-padding)
    );
  }

  .main-option.selected {
    background-color: var(
      --hierarchy-menu-element-selected-background-color,
      var(--hierarchy-menu-default-element-selected-background-color)
    );
    color: var(
      --hierarchy-menu-element-selected-color,
      var(--hierarchy-menu-default-element-selected-color)
    );
    font-weight: var(
      --hierarchy-menu-element-selected-font-weight,
      var(--hierarchy-menu-default-element-selected-font-weight)
    );
  }

  .main-option:hover:not(.selected) {
    background-color: var(
      --hierarchy-menu-element-hover-background-color,
      var(--hierarchy-menu-default-element-hover-background-color)
    );
    color: var(
      --hierarchy-menu-element-hover-color,
      var(--hierarchy-menu-default-element-hover-color)
    );
  }

  .main-option:active:not(.selected) {
    background-color: var(
      --hierarchy-menu-element-active-background-color,
      var(--hierarchy-menu-default-element-active-background-color)
    );
    color: var(
      --hierarchy-menu-element-active-color,
      var(--hierarchy-menu-default-element-active-color)
    );
  }

  .style-less-button {
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
  }

  .main-option:hover .expand-button {
    display: block;
  }

  .main-option:hover .icon-button:not(.no-transform) {
    display: none;
  }

  .icon-only {
    padding: var(
      --hierarchy-menu-icon-button-padding,
      var(--hierarchy-menu-default-icon-button-padding)
    );
  }

  .expand-button {
    display: none;
    padding: var(
      --hierarchy-menu-icon-button-padding,
      var(--hierarchy-menu-default-icon-button-padding)
    );
  }

  .icon-button {
    padding: var(
      --hierarchy-menu-icon-button-padding,
      var(--hierarchy-menu-default-icon-button-padding)
    );
  }

  .sub-icon-button {
    padding: var(
      --hierarchy-menu-icon-button-padding,
      var(--hierarchy-menu-default-icon-button-padding)
    );
  }
</style>
