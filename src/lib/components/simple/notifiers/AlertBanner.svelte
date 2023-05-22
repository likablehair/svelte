<script lang="ts">
    import { createEventDispatcher } from "svelte";

  // css props
  export let _cursor: string = 'pointer',
    _bannerColor: string | null = 'grey',
    _borderRadius: string | null = null,
    _paddingLeft: string | null = null,
    _paddingRight: string | null = null,
    _paddingTop: string | null = null,
    _paddingBottom: string | null = null,
    _borderWidth: string | null = null,
    _width: string | null = null

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
  style:--alert-banner-color={_bannerColor}
  style:--alert-banner-border-radius={_borderRadius}
  style:--alert-banner-padding-left={_paddingLeft}
  style:--alert-banner-padding-right={_paddingRight}
  style:--alert-banner-padding-top={_paddingTop}
  style:--alert-banner-padding-bottom={_paddingBottom}
  style:--alert-banner-border-width={_borderWidth}
  style:width={_width}
  class="alert-banner-container"
  style:cursor={_cursor}
  on:keypress={handleKeypressEvent}
  on:click={handleClickEvent}
>
  <div 
    class="border-colored"
  ></div>
  <div class="body">
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
    border-radius: var(--alert-banner-border-radius, 5px);
  }

  .border-colored {
    background-color: var(--alert-banner-color);
    position: absolute;
    width: var(--alert-banner-border-width, .7rem);
    top: 0px;
    bottom: 0px;
    border-radius: var(--alert-banner-border-radius, 5px) 0px 0px var(--alert-banner-border-radius, 5px);
  }

  .body {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .content {
    padding-left: var(--alert-banner-padding-left, .5rem);
    padding-top: var(--alert-banner-padding-top, .3rem);
    padding-bottom: var(--alert-banner-padding-bottom, .3rem);
    padding-right: var(--alert-banner-padding-bottom, .3rem);
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