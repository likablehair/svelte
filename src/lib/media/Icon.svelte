<script lang="ts">
  export let name: string,
    size: number = 15,
    color: string = '';
  
  let clazz: string = ''
  export { clazz as class }
  
  import '../common/materialDesign.css'
</script>

<style>
.icon {
  font-size: var(--size);
  color: var(--color);
}
</style>

<span
  style:font-size={size + 'pt'}
  style:color={color}
  class="icon mdi {name} {clazz}"
></span>

