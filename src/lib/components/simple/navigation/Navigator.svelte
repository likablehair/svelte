<script context="module" lang="ts">
  export type Item = {
    title?: string;
    icon?: string;
    name: string;
    url?: string;
    detail?: object;
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Icon from "../media/Icon.svelte"
  
  export let items: Item[] = [],
    color: string | undefined = undefined,
    vertical = false,
    variant: 'standard' | 'underlined' = 'underlined',
    textColor: string | undefined = '',
    hoverTextColor: string | undefined = undefined,
    space = "20px";

  const dispatch = createEventDispatcher<{
    "item-click": {
      item: Item;
    };
  }>();

  function handleItemClick(item: Item) {
    dispatch("item-click", { item });
  }
</script>

<div 
  style:--navigator-text-color={textColor}
  style:--navigator-hover-text-color={hoverTextColor}
  style:display="flex" 
  style:flex-direction={vertical ? "column" : "row"}
  style:gap={space}
>
  {#each items as item}
    <a
      style:width="fit-content"
      style:color
      class="link"
      class:bar-link={variant == 'underlined'}
      class:standard-link={variant == 'standard'}
      on:click={() => handleItemClick(item)}
      on:keypress={() => handleItemClick(item)}
      href={item.url}
    >
      {#if !!item.title}
        {item.title}
      {:else if !!item.icon}
        <Icon name={item.icon}></Icon>
      {/if}
    </a>
  {/each}
</div>

<style>
  .link {
    cursor: pointer;
    font-size: 18px;
    position: relative;
    white-space: nowrap;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    text-decoration: none;
    color: var(--navigator-text-color);
  }

  /* bar link */

  .bar-link::before,
  .bar-link::after {
    position: absolute;
    width: 100%;
    height: 1.5px;
    background: currentColor;
    top: 100%;
    left: 0;
    pointer-events: none;
  }

  .bar-link::before {
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

  /* standard link */
  .standard-link {
    color: var(--navigator-text-color);
    transition-property: color;
    transition-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1);
    transition-duration: .5s;
  }

  .standard-link:hover {
    color: var(--navigator-hover-text-color);
  }
</style>
