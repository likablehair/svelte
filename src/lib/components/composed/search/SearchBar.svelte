<script lang="ts">
  export let maxWidth: string | undefined = undefined,
    width: string = "100%",
    ringColor: string = "rgba(24,24,27,.1)",
    backgroundColor: string = "rgb(250 250 250/1)",
    borderRadius: string = "0.5rem",
    height: string = "3rem",
    padding: string = "0rem 1rem 0rem 1rem",
    lineHeight: string = "1.5rem",
    fontSize: string = ".875rem",
    input: HTMLElement | undefined = undefined,
    value: string | undefined = undefined
</script>

<div
  style:--search-bar-ring-color={ringColor}
  style:--search-bar-background-color={backgroundColor}
  style:--search-bar-border-radius={borderRadius}
  style:--search-bar-height={height}
  style:--search-bar-padding={padding}
  style:--search-bar-line-height={lineHeight}
  style:--search-bar-font-size={fontSize}
  style:max-width={maxWidth}
  style:width={width}
  class="container"
>
  <slot name="icon">
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      class="search-icon"
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
      class="input" 
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
    box-shadow: inset 0 0 0 1px var(--search-bar-ring-color);
    background-color: var(--search-bar-background-color);
    border-radius: var(--search-bar-border-radius);
    height: var(--search-bar-height);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: var(--search-bar-padding);
    box-sizing: border-box;
  }

  .input {
    font-size: var(--search-bar-font-size);
    line-height: var(--search-bar-line-height);
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