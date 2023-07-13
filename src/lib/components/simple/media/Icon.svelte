<script lang="ts">
  export let name: string,
    click = false;

  let clazz = "";
  export { clazz as class };

  import "../common/materialDesign.css";
</script>

<span
  class="icon mdi {name} {clazz}"
  class:click
  on:click
  on:keypress
/>

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
  }
  .icon.click:not(.click) {
    cursor: var(--icon-cursor, default);
    pointer-events: var(--icon-pointer-events, none);
  }
</style>
