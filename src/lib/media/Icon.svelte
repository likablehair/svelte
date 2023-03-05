<script lang="ts">
  export let name: string,
    size = 15,
    color = "",
    click = false;

  let clazz = "";
  export { clazz as class };

  import "../common/materialDesign.css";
</script>

<span
  style:font-size={size + "pt"}
  style:color
  class="icon mdi {name} {clazz}"
  on:click
  on:keypress
  style:cursor={click ? "pointer" : "default"}
  style:pointer-events={click ? "auto" : "none"}
/>

<style>
  .icon {
    font-size: var(--size);
    color: var(--color);
  }
</style>
