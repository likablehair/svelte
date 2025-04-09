<script lang="ts">
    import type { ChangeEventHandler, FocusEventHandler, FormEventHandler, KeyboardEventHandler } from 'svelte/elements';
  import '../../../css/main.css'
  import './SearchBar.css'
    import type { Snippet } from 'svelte';

  /*
    Styles:

    --search-bar-ring-color
    --search-bar-background-color
    --search-bar-border-radius
    --search-bar-height
    --search-bar-padding
    --search-bar-line-height
    --search-bar-font-size
    --search-bar-max-width
    --search-bar-width
  */

  interface Props {
    input?: HTMLElement;
    value?: string;
    placeholder?: string;
    class?: {
      container?: string,
      icon?: string,
      input?: string
    }
    oninput?: FormEventHandler<HTMLInputElement>
    onchange?: ChangeEventHandler<HTMLInputElement>
    onkeydown?: KeyboardEventHandler<HTMLInputElement>
    onfocus?: FocusEventHandler<HTMLInputElement>
    onblur?: FocusEventHandler<HTMLInputElement>
    iconSnippet?: Snippet<[]>
    inputSnippet?: Snippet<[]>
  }

  let {
    input = $bindable(undefined),
    value = $bindable(undefined),
    placeholder = undefined,
    class: clazz = {},
    onblur,
    onchange,
    onfocus,
    oninput,
    onkeydown,
    iconSnippet,
    inputSnippet,
  }: Props = $props();
</script>

<div
  class="search-bar-container {clazz.container}"
>
  {#if iconSnippet}
    {@render iconSnippet()}
  {:else}
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      class="search-icon {clazz.icon}"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
      />
    </svg>
  {/if}
  {#if inputSnippet}
    {@render inputSnippet()}
  {:else}
    <input
      aria-autocomplete="both"
      aria-labelledby="search-content"
      id="search-content"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      enterkeyhint="search"
      spellcheck="false"
      placeholder={placeholder}
      maxlength="512"
      tabindex="0"
      bind:this={input}
      bind:value={value}
      {oninput}
      {onchange}
      {onkeydown}
      {onfocus}
      {onblur}
      class="input {clazz.input}"
    />
  {/if}
  
</div>

<style>
  .search-bar-container {
    box-shadow: inset 0 0 0 1px var(
      --search-bar-ring-color,
      var(--search-bar-default-ring-color)
    );
    background-color: var(
      --search-bar-background-color,
      var(--search-bar-default-background-color)
    );
    border-radius: var(
      --search-bar-border-radius,
      var(--search-bar-default-border-radius)
    );
    height: var(
      --search-bar-height,
      var(--search-bar-default-height)
    );
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: var(
      --search-bar-padding,
      var(--search-bar-default-padding)
    );
    box-sizing: border-box;
    max-width: var(
      --search-bar-max-width,
      var(--search-bar-default-max-width)
    );
    width: var(
      --search-bar-width,
      var(--search-bar-default-width)
    );
  }

  .input {
    font-size: var(
      --search-bar-font-size,
      var(--search-bar-default-font-size)
    );
    line-height: var(
      --search-bar-line-height,
      var(--search-bar-default-line-height)
    );
    width: 100%;
    box-sizing: border-box;
    border: 0 solid #e5e7eb;
    outline: 2px solid transparent;
    outline-offset: 2px;
    background-color: transparent;
    color: inherit;
    appearance: none;
  }

  .search-icon {
    height: 1.25rem;
    width: 1.25rem;
    stroke: currentColor;
  }
</style>