<script lang="ts">
  export let type: 'default' | 'text' | 'icon' = 'default'
  export let icon: string = undefined
  export let iconSize: number = 15
  let clazz: string = ''
  export { clazz as class };


  $: position = !!$$slots.append ? 'relative' : undefined
  $: cssVariables = Object.entries({
      '--icon-button-height': (iconSize + 15) + 'pt',
      '--icon-button-width': (iconSize + 15) + 'pt',
      '--button-position': position
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');

  import Icon from '$lib/media/Icon.svelte'
</script>

<div 
  class="button {clazz}"
  class:button-default={type === 'default'}
  class:button-text={type === 'text'}
  class:button-icon={type === 'icon'}
  on:click
  style={cssVariables}
>
  {#if !!icon}
    <Icon name={icon} size={iconSize}></Icon>
  {:else}
    <slot></slot>
  {/if}
  {#if $$slots.append}
    <span class="append-item">
      <slot name="append">
        
      </slot>
    </span>
  {/if}
</div>

<style>
  .append-item {
    position: absolute;
    right: 0px;
  }

  .button {
    overflow: hidden;
    position: var(--button-position);
    width: var(--width, fit-content);
    height: var(--height, fit-content);
    text-align: var(--text-align, center);
    cursor: var(--cursor, pointer);
    padding: var(--padding, 5px);
    font-size: var(--font-size);
  }

  .button-default {
    transition: background-color 200ms;
    color: var(--color);
    background-color: var(--background-color);
    outline: 0;
    border: 0;
    border-radius: var(--border-radius, 0.25rem);
    box-shadow: var(--box-shadow, 0 0 0.5rem rgba(0, 0, 0, 0.3));
  }

  .button-default:hover {
    background-color: var(--hover-background-color, var(--background-color));
  }

  .button-text {
    color: var(--color);
    transition: background-color 200ms;
    text-transform: uppercase;
    font-weight: 600;
    outline: 0;
    border: 0;
    border-radius: var(--border-radius, 0.25rem);
  }

  .button-text:hover {
    background-color: var(--hover-background-color, transparent);
  }

  .button-icon {
    color: var(--color);
    transition: background-color 200ms;
    outline: 0;
    border: 0;
    border-radius: var(--border-radius, 50%);
    height: var(--icon-button-height) !important;
    width: var(--icon-button-width) !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button-icon:hover {
    background-color: var(--hover-background-color, transparent);
  }
</style>