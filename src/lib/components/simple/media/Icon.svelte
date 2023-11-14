<script lang="ts">
  export let name: string,
    click = false;

  let clazz = "";
  export { clazz as class };

  import "../common/materialDesign.css";
</script>

{#if click}
  <button
    on:click
    on:keypress
    class="{clazz}"
  >
    <span
      class="icon mdi {name} {clazz}"
    />
  </button>
{:else}
  <span
    class="icon mdi {name} {clazz}"
    class:click
    on:click
    on:keypress
  />
{/if}

<style>
  button {
    background: none; 
    border: none; 
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    outline: inherit;
    height: var(
      --icon-container-height,
      var(--icon-default-container-height)
    );
    width: var(
      --icon-container-width,
      var(--icon-default-container-width)
    )
  }

  .icon {
    font-size: var(
      --icon-size,
      var(--icon-default-size)
    );
    color: var(
      --icon-color,
      var(--icon-default-color)
    );
  }
  .icon.click {
    cursor: var(--icon-cursor, pointer);
    pointer-events: var(--icon-pointer-events, auto);
  }
  .icon.click:not(.click) {
    cursor: var(--icon-cursor, default);
    pointer-events: var(--icon-pointer-events, none);
  }
</style>
