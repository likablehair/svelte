<script lang="ts">
  export let name: string,
    click = false,
    tabindex: number | null | undefined = undefined;

  let clazz = "";
  export { clazz as class };

  import "../common/materialDesign.css";
</script>

{#if click}
  <span
    role="button"
    on:click
    on:keypress
    class="icon mdi {name} {clazz} click"
    {tabindex}
  />
{:else}
  <span
    class="icon mdi {name} {clazz}"
  />
{/if}

<style>
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
    height: var(
      --icon-container-height,
      var(--icon-default-container-height)
    );
    width: var(
      --icon-container-width,
      var(--icon-default-container-width)
    );
  }
  .icon.click:not(.click) {
    cursor: var(--icon-cursor, default);
    pointer-events: var(--icon-pointer-events, none);
  }

  .click:focus, .click:active {
    color: var(
      --icon-active-color,
      rgb(var(--global-color-primary-500))
    );
    outline: none;
  }
</style>
