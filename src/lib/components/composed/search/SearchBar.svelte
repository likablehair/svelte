<script lang="ts">
  import './SearchBar.css'

  let clazz: {
    container?: string,
    icon?: string,
    input?: string
  } = {};
	export { clazz as class };

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

  export let input: HTMLElement | undefined = undefined,
    value: string | undefined = undefined
</script>

<div
  class="container {clazz.container}"
>
  <slot name="icon">
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      class="search-icon {clazz.icon}"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
      /></svg
    >
  </slot>
  <slot name="input">
    <input
      aria-autocomplete="both" 
      aria-labelledby="search-content" 
      id="search-content" 
      autocomplete="off" 
      autocorrect="off" 
      autocapitalize="off" 
      enterkeyhint="search" 
      spellcheck="false" 
      placeholder="Find something..." 
      maxlength="512" 
      tabindex="0"
      class="input {clazz.input}"
      bind:this={input}
      bind:value={value}
      on:input
      on:change
      on:keydown
    />
  </slot>
</div>

<style>
  .container {
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