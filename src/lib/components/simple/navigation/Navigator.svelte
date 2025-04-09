<script module lang="ts">
  export type Item = {
    title?: string;
    icon?: string;
    name: string;
    url?: string;
    detail?: object;
  };
</script>

<script lang="ts">
  import Icon from "../media/Icon.svelte"
  
  interface Props {
    items?: Item[];
    color?: string;
    vertical?: boolean;
    variant?: 'standard' | 'underlined';
    textColor?: string;
    hoverTextColor?: string;
    space?: string;
    onitemClick?: (event: {
      detail: {
        item: Item
      }
    }) => void
  }

  let {
    items = [],
    color = undefined,
    vertical = false,
    variant = 'underlined',
    textColor = '',
    hoverTextColor = undefined,
    space = "20px",
    onitemClick,
  }: Props = $props();

  function handleItemClick(item: Item) {
    if(onitemClick) {
      onitemClick({
        detail: {
          item
        }
      })
    }
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
      onclick={() => handleItemClick(item)}
      onkeypress={() => handleItemClick(item)}
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
