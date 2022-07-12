<script lang="ts">
  export let name: string,
    size: number = 15,
    color: string = "",
    click: boolean = false;

  let clazz: string = "";
  export { clazz as class };

  import "../common/materialDesign.css";

</script>

<span
  style:font-size={size + "pt"}
  style:color
  class="icon mdi {name} {clazz}"
  on:click
  style:cursor={click ? "pointer" : "default"}
  style:pointer-events={click ? "auto" : "none"}
/>

<style>
  .icon {
    font-size: var(--size);
    color: var(--color);
  }
</style>
