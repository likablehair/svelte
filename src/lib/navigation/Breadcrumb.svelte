<script lang="ts" context="module">
  export type BreadcrumbItem = {
    name: string;
    title: string;
    url?: string;
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher<{
    "item-click": {
      item: BreadcrumbItem;
    };
  }>();

  export let items: BreadcrumbItem[] = [],
    underliner = true,
    separatorIcon = "mdi-chevron-right",
    separatorIconSize = 10,
    spacing = "20px";

  function handleLinkClick(item: BreadcrumbItem) {
    dispatch("item-click", {
      item: item,
    });
  }

  import Icon from "$lib/media/Icon.svelte";
</script>

<div>
  {#each items as item, index}
    <span
      class="history"
      class:link={underliner && index != items.length - 1}
      class:bar-link={underliner && index != items.length - 1}
      on:click={() => handleLinkClick(item)}
      on:keypress={() => handleLinkClick(item)}>{item.title}</span
    >
    {#if index != items.length - 1}<span
        style:margin-left={`calc(${spacing} / 2)`}
        style:margin-right={`calc(${spacing} / 2)`}
        ><Icon name={separatorIcon} size={separatorIconSize} /></span
      >{/if}
  {/each}
</div>

<style>
  .history {
    cursor: pointer;
  }

  .link {
    position: relative;
    white-space: nowrap;
    color: var(--color-text);
  }

  .link::before,
  .link::after {
    position: absolute;
    width: 100%;
    height: 1px;
    background: currentColor;
    top: 100%;
    left: 0;
    pointer-events: none;
  }

  .link::before {
    content: "";
  }

  .bar-link::before {
    transform-origin: 100% 50%;
    transform: scale3d(0, 1, 1);
    transition: transform 0.3s;
  }

  .bar-link:hover::before {
    transform-origin: 0% 50%;
    transform: scale3d(1, 1, 1);
  }
</style>
