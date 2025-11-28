<script lang="ts">
  import '../../../css/main.css'
  import './SimpleTextField.css'
  import Icon from "../media/Icon.svelte";
  import type { HTMLInputAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  interface Props extends HTMLInputAttributes{
    value?: string | number;
    valueTo?: string | number;
    type?: "text" | "password" | "number" | "time" | "date";
    range?: boolean
    placeholder?: string;
    placeholderTo?: string;
    disabled?: boolean;
    readonly?: boolean;
    id?: string;
    idTo?: string;
    appendIcon?: string;
    appendInnerIcon?: string;
    prependIcon?: string;
    prependInnerIcon?: string;
    iconSize?: string;
    name?: string;
    nameTo?: string;
    hint?: string;
    input?: HTMLElement;
    inputTo?: HTMLElement;
    betweenLabel?: string
    class?: {
      container?: string,
      row?: string,
      field?: string,
      hint?: string,
      input?: string
    }
    prependSnippet?: Snippet<[{
      prependIcon: string | undefined
      iconSize: string
    }]>
    prependInnerSnippet?: Snippet<[{
      prependInnerIcon: string | undefined
      iconSize: string
    }]>
    appendSnippet?: Snippet<[{
      appendIcon: string | undefined
      iconSize: string
    }]>
    appendInnerSnippet?: Snippet<[{
      appendInnerIcon: string | undefined
      iconSize: string
    }]>
    hintSnippet?: Snippet<[{
      hint: string | undefined
    }]>
  }

  let {
    value = $bindable(),
    valueTo = $bindable(),
    type = "text",
    range = false,
    placeholder = undefined,
    placeholderTo = undefined,
    disabled = false,
    readonly = false,
    id = undefined,
    idTo = undefined,
    appendIcon = undefined,
    appendInnerIcon = undefined,
    prependIcon = undefined,
    prependInnerIcon = undefined,
    iconSize = "12pt",
    name = undefined,
    nameTo = undefined,
    hint = undefined,
    input = $bindable(undefined),
    inputTo = $bindable(undefined),
    betweenLabel = '-',
    class: clazz = {},
    prependSnippet,
    prependInnerSnippet,
    appendInnerSnippet,
    appendSnippet,
    hintSnippet,
    onchange,
    oninput,
    onfocus,
    onblur,
    onkeydown,
    onkeyup,
    onkeypress,
    ...rest
  }: Props = $props();
</script>

<div
  class="textfield-container {clazz?.container || ''}"
>
  <div class="row {clazz?.row || ''}">
    {#if prependSnippet}
      {@render prependSnippet({ prependIcon, iconSize })}
    {:else}
      {#if !!prependIcon}
        <Icon name={prependIcon} --icon-size={iconSize}></Icon>
      {/if}
    {/if}
    <div class="textfield {clazz?.field || ''}">
      {#if prependInnerSnippet}
        {@render prependInnerSnippet({ prependInnerIcon, iconSize })}
      {:else}
        {#if !!prependInnerIcon}
          <Icon name={prependInnerIcon} --icon-size={iconSize}></Icon>
        {/if}
      {/if}
      <input
        bind:value={value}
        placeholder={placeholder}
        type={type}
        id={id}
        disabled={disabled}
        readonly={readonly}
        {onchange}
        {oninput}
        {onfocus}
        {onblur}
        {onkeydown}
        {onkeyup}
        {onkeypress}
        name={name}
        class={clazz?.input || '' + (range ? ' align-right' : '')}
        bind:this={input}
        {...rest}
      />
      {#if range}
        {betweenLabel}
        <input
          bind:value={valueTo}
          placeholder={placeholderTo}
          type={type}
          id={idTo}
          disabled={disabled}
          readonly={readonly}
          {onchange}
          {oninput}
          {onfocus}
          {onblur}
          {onkeydown}
          {onkeyup}
          {onkeypress}
          name={nameTo}
          class={clazz?.input || ''}
          bind:this={inputTo}
          {...rest}
        />
      {/if}
      {#if appendInnerSnippet}
        {@render appendInnerSnippet({ appendInnerIcon, iconSize })}
      {:else}
        {#if !!appendInnerIcon}
          <Icon name={appendInnerIcon} --icon-size={iconSize}></Icon>
        {/if}
      {/if}
    </div>
    {#if appendSnippet}
      {@render appendSnippet({ appendIcon, iconSize })}
    {:else}
      {#if !!appendIcon}
        <Icon name={appendIcon} --icon-size={iconSize}></Icon>
      {/if}
    {/if}
  </div>
  {#if hintSnippet}
    {@render hintSnippet({ hint })}
  {:else}
    <div class="row {clazz?.hint || ''}">
      {#if !!hint}
        <span class="hint">{hint}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .textfield-container {
    max-width: var(
      --simple-textfield-max-width,
      var(--simple-textfield-default-max-width)
    );
    width: var(
      --simple-textfield-width,
      var(--simple-textfield-default-width)
    );
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(
      --simple-textfield-outer-gap, 
      var(--simple-textfield-default-outer-gap)
    );
    margin-bottom: var(
      --simple-textfield-margin-bottom,
      var(--simple-textfield-default-margin-bottom)
    );
    margin-left: var(
      --simple-textfield-margin-left,
      var(--simple-textfield-default-margin-left)
    );
  }

  .row:last-of-type {
    margin-bottom: 0px;
  }

  .hint {
    margin-left: var(
      --simple-textfield-hint-margin-left, 
      var(--simple-textfield-default-hint-margin-left)
    );
    font-size: var(
      --simple-textfield-hint-font-size, 
      var(--simple-textfield-default-hint-font-size)
    );
    color: var(
      --simple-textfield-hint-color,
      var(--simple-textfield-default-hint-color)
    );
  }

  .textfield {
    padding: var(
      --simple-textfield-padding,
      var(--simple-textfield-default-padding)
    );
    height: var(
      --simple-textfield-height,
      var(--simple-textfield-default-height)
    );
    width: fit-content;
    background-color: var(
      --simple-textfield-background-color,
      var(--simple-textfield-default-background-color)
    );
    border: var(
      --simple-textfield-border,
      var(--simple-textfield-default-border)
    );
    border-radius: var(
      --simple-textfield-border-radius,
      var(--simple-textfield-default-border-radius)
    );
    box-shadow: var(
      --simple-textfield-box-shadow,
      var(--simple-textfield-default-box-shadow)
    );
    transition: var(
      --simple-textfield-transition,
      var(--simple-textfield-default-transition)
    );
    gap: var(
      --simple-textfield-inner-gap,
      var(--simple-textfield-default-inner-gap)
    );
    display: flex;
    flex-grow: 1;
  }

  .textfield:focus-within {
    background-color: var(
      --simple-textfield-focus-background-color, 
      var(
        --simple-textfield-default-focus-background-color,
        var(
          --simple-textfield-background-color,
          var(--simple-textfield-default-background-color)
        )
      )
    );
    box-shadow: var(
      --simple-textfield-focus-box-shadow, 
      var(--simple-textfield-default-focus-box-shadow)
    );
  }

  input {
    outline: none;
    width: 100%;
    background-color: transparent;
    font-size: var(
      --simple-textfield-font-size, 
      var(--simple-textfield-default-font-size)
    );
    font-weight: var(
      --simple-textfield-font-weight,
      var(--simple-textfield-default-font-weight)
    );
    color: var(
      --simple-textfield-color,
      var(--simple-textfield-default-color)
    );
    border: none
  }

  ::-webkit-calendar-picker-indicator {
    opacity: 0;
  }

  .align-right {
    text-align: var(
      --simple-textfield-range-text-align,
      var(--simple-textfield-default-range-text-align)
    );
  }

</style>