<script lang="ts">
  export let type: 'default' | 'text' | 'icon' = 'default',
    loading: boolean = false,
    icon: string = undefined,
    iconSize: number = 15,
    clazz: string = '',
    maxWidth: string = undefined,
    maxHeight: string = undefined,
    minWidth: string = undefined,
    minHeight: string = undefined,
    width: string = undefined,
    height: string = undefined,
    textAlign: string = "center",
    cursor: string = "pointer",
    padding: string = "5px",
    fontSize: string = undefined,
    color: string = undefined,
    backgroundColor: string = undefined,
    hoverBackgroundColor: string = '#88888847',
    borderRadius: string = undefined,
    boxShadow: string = undefined

  export { clazz as class };


  $: defaultBorderRadius = type == 'icon' ? '50%' : '5px'
  $: position = !!$$slots.append ? 'relative' : undefined

  import Icon from '$lib/media/Icon.svelte'
  import CircularLoader from '$lib/loaders/CircularLoader.svelte';
</script>

<div 
  style:width={width}
  style:max-width={maxWidth}
  style:min-width={minWidth}
  style:height={height}
  style:max-height={maxHeight}
  style:min-height={minHeight}
  style:text-align={textAlign}
  style:position={position}
  style:cursor={cursor}
  style:padding={padding}
  style:font-size={fontSize}
  style:color={color}
  style:--button-border-radius={!!borderRadius ? borderRadius : defaultBorderRadius}
  style:--button-background-color={backgroundColor}
  style:--button-hover-background-color={hoverBackgroundColor}
  style:--button-box-shadow={boxShadow}
  style:--button-icon-height={(iconSize + 5) + 'pt'}
  style:--button-icon-width={(iconSize + 5) + 'pt'}
  class="button no-select {clazz}"
  class:button-default={type === 'default'}
  class:button-text={type === 'text'}
  class:button-icon={type === 'icon'}
  on:click
>
  {#if loading}
    <CircularLoader
      color={color}
    ></CircularLoader>
  {:else}
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
  {/if}

</div>

<style>
  .append-item {
    position: absolute;
    right: 0px;
  }

  .button {
    overflow: hidden;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
  }

  .button-default {
    transition: background-color 200ms;
    background-color: var(--button-background-color);
    outline: 0;
    border: 0;
    border-radius: var(--button-border-radius, 0.25rem);
    box-shadow: var(--button-box-shadow, 0 0 0.5rem rgba(0, 0, 0, 0.3));
  }

  .button-default:hover {
    background-color: var(--button-hover-background-color, var(--button-background-color));
  }

  .button-text {
    transition: background-color 200ms;
    text-transform: uppercase;
    font-weight: 600;
    outline: 0;
    border: 0;
    border-radius: var(--button-border-radius, 0.25rem);
  }

  .button-text:hover {
    background-color: var(--button-hover-background-color, transparent);
  }

  .button-icon {
    transition: background-color 200ms;
    outline: 0;
    border: 0;
    border-radius: var(--button-border-radius, 50%);
    height: var(--button-icon-height) !important;
    width: var(--button-icon-width) !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button-icon:hover {
    background-color: var(--button-hover-background-color, transparent);
  }

  .no-select {
    -webkit-touch-callout: none; /* iOS Safari */
      -webkit-user-select: none; /* Safari */
      -khtml-user-select: none; /* Konqueror HTML */
        -moz-user-select: none; /* Old versions of Firefox */
          -ms-user-select: none; /* Internet Explorer/Edge */
              user-select: none; /* Non-prefixed version, currently
                                    supported by Chrome, Edge, Opera and Firefox */
  }
</style>