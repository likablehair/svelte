<script lang="ts">
  export let name: string,
    size: number = 15,
    color: string = '';
  
  let clazz: string = ''
  export { clazz as class }

  $: cssVariables = Object.entries({
      '--size': size + 'pt',
      '--color': color
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');
  
  import '../common/materialDesign.css'
  import '$lib/common/tailwind.css'
</script>

<style>
.icon {
  font-size: var(--size);
  color: var(--color);
}
</style>

<span
  style={cssVariables}
  class="icon mdi {name} {clazz}"
></span>

