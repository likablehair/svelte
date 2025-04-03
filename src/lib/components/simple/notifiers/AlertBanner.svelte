<script lang="ts">
  import type { Snippet } from 'svelte';
  import '../../../css/main.css'
  import './AlertBanner.css'

  interface Props {
    title?: string
    description?: string
    disabled?: boolean
    class?: {
      container?: string,
      border?: string,
      body?: string
    },
    onclick?: (e: MouseEvent) => void,
    onkeypress?: (e: KeyboardEvent) => void,
    contentSnippet?: Snippet<[{
      title?: string,
      description?: string
    }]>,
    titleSnippet?: Snippet<[{
      title: string,
    }]>,
    descriptionSnippet?: Snippet<[{
      description: string
    }]>,
    appendSnippet?: Snippet<[{
      disabled: boolean
    }]>
  }

  let {
    title,
    description,
    disabled = false,
    class: clazz = { },
    onclick: onclickInternal,
    onkeypress: onkeypressInternal,
    contentSnippet,
    titleSnippet,
    descriptionSnippet,
    appendSnippet
  }: Props = $props()

  function onclick(e: MouseEvent) {
    if(!disabled && !!onclickInternal) onclickInternal(e)
  }

  function onkeypress(e: KeyboardEvent) {
    if(!disabled && !!onkeypressInternal) onkeypressInternal(e)
  }
</script>

<div 
  class="alert-banner-container {clazz.container || ''}"
  {onkeypress}
  {onclick}
  role="presentation"
>
  <div 
    class="border-colored {clazz.border || ''}"
  ></div>
  <div class="body {clazz.body || ''}">
    <div class="content">
      {#if !!contentSnippet}
        {@render contentSnippet({ title, description })}
      {:else}
        {#if !!title}
          {#if !!titleSnippet}
            {@render titleSnippet({ title })}
          {:else}
            <div class="title">{title}</div>
          {/if}
        {/if}
        {#if !!description}
          {#if !!descriptionSnippet}
            {@render descriptionSnippet({ description })}
          {:else}
            <div class="description">{description}</div>
          {/if}
        {/if}
      {/if}
    </div>
    {#if !!appendSnippet}
      <div class="append">
        {@render appendSnippet({ disabled })}
      </div>
    {/if}
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