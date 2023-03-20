<script lang="ts">
  export let maxWidth: string = "36rem",
    width: string = "100%",
    ringColor: string = "rgba(24,24,27,.1)"
</script>

<div
  style:--search-bar-ring-color={ringColor}
  style:max-width={maxWidth}
  style:width={width}
  class="container"
>
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
  />
</div>

<style>
  .container {
    box-shadow: inset 0 0 0 1px var(--search-bar-ring-color);
    background-color: rgb(250 250 250/1);
    border-radius: 0.5rem;
    height: 3rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .input {
    font-size: .875rem;
    line-height: 1.5rem;
    box-sizing: border-box;
    border: 0 solid #e5e7eb;
    outline: 2px solid transparent;
    outline-offset: 2px;
    background-color: transparent;
    color: rgb(24 24 27/1);
    appearance: none;
  }

  .search-icon {
    height: 1.25rem;
    width: 1.25rem;
    stroke: currentColor;
  }
</style>