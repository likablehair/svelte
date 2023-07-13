<script lang="ts">
  import '../../../css/main.css'
  import './AlertBanner.css'
  import { createEventDispatcher } from "svelte";

  let clazz: {
    container?: string,
    border?: string,
    body?: string
  } = {};
	export { clazz as class };

  /* 
    Styles:
    
    --alert-banner-color
    --alert-banner-cursor
    --alert-banner-border-radius
    --alert-banner-padding-left
    --alert-banner-padding-right
    --alert-banner-padding-top
    --alert-banner-padding-bottom
    --alert-banner-border-width
    --alert-banner-width
  */

  // props
  export let title: string | undefined = undefined,
    description: string | undefined = undefined,
    disabled: boolean = false

    let dispatch = createEventDispatcher<{
      'click': MouseEvent,
      'keypress': KeyboardEvent
    }>()

    function handleClickEvent(e: MouseEvent) {
      if(!disabled) dispatch('click', e)
    }

    function handleKeypressEvent(e: KeyboardEvent) {
      if(!disabled) dispatch('keypress', e)
    }
</script>

<div 
  class="alert-banner-container {clazz.container || ''}"
  on:keypress={handleKeypressEvent}
  on:click={handleClickEvent}
>
  <div 
    class="border-colored {clazz.border || ''}"
  ></div>
  <div class="body {clazz.body || ''}">
    <div class="content">
      <slot name="content" title={title} description={description}>
        {#if !!title}
          <slot name="title" title={title}>
            <div class="title">{title}</div>
          </slot>
        {/if}
        {#if !!description}
          <slot name="description" description={description}>
            <div class="description">{description}</div>
          </slot>
        {/if}
      </slot>
    </div>
    <div class="append">
      <slot name="append" disabled={disabled}></slot>
    </div>
  </div>
</div>

<style>
  .alert-banner-container {
    position: relative;
    box-shadow: 0 3px 1px -2px rgba(0,0,0,.2),0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12)!important;
    border-radius: var(--alert-banner-border-radius, var(--alert-banner-default-border-radius));
    cursor: var(--alert-banner-cursor, var(--alert-banner-default-cursor));
    width: var(--alert-banner-width, var(--alert-banner-default-width));
  }

  .border-colored {
    background-color: var(--alert-banner-color, var(--alert-banner-default-color));
    position: absolute;
    width: var(--alert-banner-border-width, var(--alert-banner-default-border-width));
    top: 0px;
    bottom: 0px;
    border-radius: 
      var(--alert-banner-border-radius, var(--alert-banner-default-border-radius))
      0px 
      0px 
      var(--alert-banner-border-radius, var(--alert-banner-default-border-radius));
  }

  .body {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .content {
    padding-left: var(--alert-banner-padding-left, var(--alert-banner-default-padding-left));
    padding-top: var(--alert-banner-padding-top, var(--alert-banner-default-padding-top));
    padding-bottom: var(--alert-banner-padding-bottom, var(--alert-banner-default-padding-bottom));
    padding-right: var(--alert-banner-padding-right, var(--alert-banner-default-padding-right));
  }

  .title {
    font-weight: 700;
    font-size: 1.2rem;
    padding-left: 10px;
  }

  .description {
    padding-left: 10px;
    white-space: pre-wrap;
  }
</style>